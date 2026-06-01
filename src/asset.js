// Asset / image reference resolution — React-reactive shell around
// sdk-api's pure createAssetIndex. Lives in its own context so it can
// be used independently from the href index.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createAssetIndex } from 'mikser-io-sdk-api'
import { useMikserClient } from './client.js'

export const AssetIndexContext = createContext(null)

// Stable signature for the filter, used as a useEffect dep so the SSE
// subscription only rewires when the filter's *shape* changes.
function filterKey(filter) {
    return JSON.stringify(filter ?? null)
}

/**
 * AssetIndexProvider — subscribes to asset entities, rebuilds the
 * index via sdk-api's createAssetIndex, and exposes it via context.
 *
 *   <AssetIndexProvider>
 *     <App />
 *   </AssetIndexProvider>
 */
export function AssetIndexProvider({
    client: clientArg,
    filter,
    children,
}) {
    const client = clientArg ?? useMikserClient()
    const [assets, setAssets] = useState([])

    const effectiveFilter = filter ?? { type: 'asset' }
    const filterRef = useRef(effectiveFilter)
    filterRef.current = effectiveFilter
    const key = useMemo(() => filterKey(effectiveFilter), [effectiveFilter])

    useEffect(() => {
        let cancelled = false
        const dispose = client.live(
            filterRef.current,
            (docs) => {
                if (cancelled) return
                setAssets(docs)
            },
            { fields: ['id', 'meta'] },
        )
        return () => {
            cancelled = true
            dispose?.()
        }
    }, [client, key])

    const index = useMemo(() => createAssetIndex(assets), [assets])
    return createElement(AssetIndexContext.Provider, { value: index }, children)
}

/**
 * Read the asset index. Returns `{ asset, image, index }`.
 *
 *   const { asset, image } = useAsset()
 *   <img {...image('/assets/hero.jpg')} />
 *
 * `asset(ref)` returns the full record (url + dimensions + meta).
 * `image(ref)` returns `{ src, width, height, srcSet, alt }` — note
 * `srcSet` (camelCase) for React's JSX prop naming, even though
 * sdk-api emits `srcset` to match the HTML attribute. The wrapper
 * remaps it here.
 *
 * Returns null for unresolved refs — components should branch on that.
 */
export function useAsset() {
    const index = useContext(AssetIndexContext)
    if (!index) {
        throw new Error(
            'useAsset: <AssetIndexProvider> must wrap your tree first'
        )
    }

    const asset = useCallback((ref) => index.asset(ref), [index])

    const image = useCallback((ref) => {
        const a = index.image(ref)
        if (!a) return null
        // sdk-api returns lowercase `srcset` (HTML); React JSX prefers
        // camelCase `srcSet`. Remap here without dropping other fields.
        const { srcset, ...rest } = a
        return srcset !== undefined ? { ...rest, srcSet: srcset } : rest
    }, [index])

    return { asset, image, index }
}
