// Asset resolution — React-reactive shell around sdk-api's format-neutral
// asset helpers.
//
//   useAsset().url(ref)        — join a deployed served path (meta.url or
//     meta.presets.<name>) to the client base; pure, needs no provider.
//     The common case (ADR-0011).
//   useAsset().asset(ref)      — managed-entity metadata lookup; only
//     resolves inside <AssetIndexProvider>.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { deployedUrl, createAssetIndex } from 'mikser-io-sdk-api'
import { MikserClientContext, useMikserClient } from './client.js'

export { watchAssetFallbacks } from 'mikser-io-sdk-api'

export const AssetIndexContext = createContext(null)

// Stable signature for the filter, used as a useEffect dep so the SSE
// subscription only rewires when the filter's *shape* changes.
function filterKey(filter) {
    return JSON.stringify(filter ?? null)
}

/**
 * AssetIndexProvider — subscribes to managed asset entities and exposes
 * the index via context. Only needed for useAsset().asset(ref); the
 * url() helper needs no provider.
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
 * Asset access. Returns `{ url, asset, index }`.
 *
 *   const { url } = useAsset()
 *   <video src={url(clip.meta.url)}
 *          poster={url(clip.meta.presets.poster)} />
 *
 * `url(ref)` joins a deployed served path (from `meta.url` /
 * `meta.presets.<name>`, expanded via the catalog) to the client base;
 * needs no provider. `asset(ref)` → `{ url, meta } | null` for a managed
 * asset entity, and only resolves inside <AssetIndexProvider> (else null).
 */
export function useAsset() {
    const client = useContext(MikserClientContext)
    const index = useContext(AssetIndexContext)

    const baseUrl = client?.baseUrl ?? ''
    const url = useCallback(
        (ref) => deployedUrl(ref, { baseUrl }),
        [baseUrl],
    )
    const asset = useCallback((ref) => (index ? index.asset(ref) : null), [index])

    return { url, asset, index }
}
