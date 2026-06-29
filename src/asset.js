// Asset resolution — React-reactive shell around sdk-api's format-neutral
// asset helpers.
//
//   useAsset().assetUrl(source, preset, { ext })  — preset → derivative
//     URL by convention; pure, needs no provider (just the client's
//     baseUrl). The common case.
//   useAsset().asset(ref)                          — managed-entity
//     metadata lookup; only resolves inside <AssetIndexProvider>.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { assetUrl as buildAssetUrl, createAssetIndex } from 'mikser-io-sdk-api'
import { MikserClientContext, useMikserClient } from './client.js'

export const AssetIndexContext = createContext(null)

// Stable signature for the filter, used as a useEffect dep so the SSE
// subscription only rewires when the filter's *shape* changes.
function filterKey(filter) {
    return JSON.stringify(filter ?? null)
}

/**
 * AssetIndexProvider — subscribes to managed asset entities and exposes
 * the index via context. Only needed for useAsset().asset(ref); the
 * assetUrl() convention helper needs no provider.
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
 * Asset access. Returns `{ assetUrl, asset, index }`.
 *
 *   const { assetUrl } = useAsset()
 *   <video src={assetUrl(clip, 'presentation')}
 *          poster={assetUrl(clip, 'poster', { ext: 'jpg' })} />
 *
 * `assetUrl(source, preset, { ext })` builds the derivative URL by
 * convention, baseUrl from the installed client; needs no provider.
 * `asset(ref)` → `{ url, meta } | null` for a managed asset entity, and
 * only resolves inside <AssetIndexProvider> (otherwise null).
 */
export function useAsset() {
    const client = useContext(MikserClientContext)
    const index = useContext(AssetIndexContext)

    const baseUrl = client?.baseUrl ?? ''
    const assetUrl = useCallback(
        (source, preset, options = {}) => buildAssetUrl(source, preset, { baseUrl, ...options }),
        [baseUrl],
    )
    const asset = useCallback((ref) => (index ? index.asset(ref) : null), [index])

    return { assetUrl, asset, index }
}
