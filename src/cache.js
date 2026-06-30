// Reactive local content cache — React shell around sdk-api's createCache.
//
// React reads state through hooks, not module scope, so the reactive
// surface is `useCached` / `useCachedDocument` (backed by
// useSyncExternalStore over the cache's subscribe/peek). The cache itself is
// the framework-agnostic createCache — create one (module scope or context)
// and pass it in.
//
// Pairs with the live href index (useHref / meta): meta() is always-fresh
// from an SSE subscription; this is load-once, expand-capable. live()/meta()
// for changing feeds; this for system docs, nav, settings.
//
//   const content = createCache(client.entities('public'))   // once
//   const products = useCachedDocument(content, '/system/products', {
//       expand: ['products.*.video'],
//   })
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

export { createCache, cacheKey } from 'mikser-io-sdk-api'

// Reactive read of a cached query. Triggers the load (once per query) and
// re-renders when the entry lands or is invalidated. `peek` returns a stable
// envelope reference until the entry changes, so useSyncExternalStore stays
// loop-free.
export function useCached(cache, query) {
    const queryKey = useMemo(() => JSON.stringify(query ?? null), [query])
    const subscribe = useCallback((cb) => cache.subscribe(cb), [cache])
    const getSnapshot = useCallback(() => cache.peek(query), [cache, queryKey])
    useEffect(() => { cache.get(query).catch(() => {}) }, [cache, queryKey])
    return useSyncExternalStore(subscribe, getSnapshot)
}

// Doc-by-logical-ref convenience — returns the loaded doc (items[0]) or null.
// A document comes with its references resolved — default expand is the `$`
// wildcard. Pass `expand: []` to opt out, or a path list to narrow.
export function useCachedDocument(cache, href, { expand = ['$'] } = {}) {
    const query = useMemo(
        () => ({ filter: { 'meta.href': href }, limit: 1, expand }),
        [href, JSON.stringify(expand ?? null)],
    )
    const env = useCached(cache, query)
    return env?.items?.[0] ?? null
}
