// Asset / image reference resolution — same provider/hook pattern as
// href, scoped to asset entities. Useful when assets carry metadata
// the UI needs (dimensions, srcset, alt) and you want to look them up
// by reference rather than re-fetching per render.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useMikserClient } from './client.js'

export const AssetIndexContext = createContext(null)

/**
 * AssetIndexProvider — wraps your tree to expose a reactive asset
 * index. Same shape as the href index; lives in its own context so the
 * two can be used independently.
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
    const [index, setIndex] = useState({})

    const effectiveFilter = filter ?? { type: 'asset' }
    const filterKey = useMemo(() => JSON.stringify(effectiveFilter), [effectiveFilter])

    useEffect(() => {
        let cancelled = false
        const dispose = client.live(
            JSON.parse(filterKey),
            (assets) => {
                if (cancelled) return
                const next = {}
                for (const a of assets) {
                    next[a.id] = {
                        url:    a.meta?.destination ?? a.meta?.url ?? a.id,
                        width:  a.meta?.width,
                        height: a.meta?.height,
                        srcset: a.meta?.srcset,
                        alt:    a.meta?.alt,
                        meta:   a.meta,
                    }
                }
                setIndex(next)
            },
            { fields: ['id', 'meta'] },
        )
        return () => {
            cancelled = true
            dispose?.()
        }
    }, [client, filterKey])

    return createElement(AssetIndexContext.Provider, { value: index }, children)
}

/**
 * Read the asset index. Returns `{ asset, image, index }`.
 *
 *   const { asset, image } = useAsset()
 *   <img {...image('/assets/hero.jpg')} />
 *
 * `asset(ref)` returns the full record (url + dimensions + meta).
 * `image(ref)` returns `{ src, width, height, srcSet, alt }` suitable
 * for spreading onto an <img>. Note: `srcSet` (camelCase) for React's
 * JSX prop naming.
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

    const asset = useCallback((ref) => index[ref] ?? null, [index])

    const image = useCallback((ref) => {
        const a = index[ref]
        if (!a) return null
        return {
            src:    a.url,
            width:  a.width,
            height: a.height,
            srcSet: a.srcset,    // React JSX uses srcSet (camelCase)
            alt:    a.alt,
        }
    }, [index])

    return { asset, image, index }
}
