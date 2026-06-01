// Document data hooks — useDocument (single) and useDocuments (list).
// Both wrap client.live() in React state with proper subscription
// teardown on unmount or dep change.
//
// Naming: we use `useSyncExternalStore` semantics conceptually but
// stick with useState + useEffect for clarity — the SSE stream is a
// long-lived subscription that fans out to multiple React leaves, not
// a snapshot store.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMikserClient } from './client.js'

/**
 * Live single-document hook. Resolves the document by id and stays in sync
 * with changes via client.live().
 *
 *   const { document, loading, error, refresh } = useDocument(entityId)
 *
 * `id` changes between renders cause the subscription to re-establish
 * for the new id automatically.
 */
export function useDocument(id, { client: clientArg } = {}) {
    const client = clientArg ?? useMikserClient()

    const [document, setDocument] = useState(null)
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(null)
    // refreshTick forces re-subscription without changing id
    const [refreshTick, setRefreshTick] = useState(0)

    useEffect(() => {
        if (id == null || id === '') {
            setDocument(null)
            setLoading(false)
            setError(null)
            return
        }

        setLoading(true)
        setError(null)
        let cancelled = false

        const dispose = client.live(
            { id },
            (items) => {
                if (cancelled) return
                setDocument(items[0] ?? null)
                setLoading(false)
            },
            {
                limit: 1,
                onError: (err) => {
                    if (cancelled) return
                    setError(err)
                    setLoading(false)
                },
            },
        )

        return () => {
            cancelled = true
            dispose?.()
        }
    }, [client, id, refreshTick])

    const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

    return { document, loading, error, refresh }
}

// Stable signature for a query object — used as the useEffect dep so
// the subscription re-establishes only when the *shape* changes, not
// when the consumer happens to recreate the literal between renders.
function queryKey(query) {
    if (!query) return ''
    return JSON.stringify({
        f: query.filter ?? null,
        s: query.sort   ?? null,
        F: query.fields ?? null,
        l: query.limit  ?? null,
        k: query.skip   ?? null,
    })
}

/**
 * Live list hook. Returns the current array of documents that stays in
 * sync with client.live() updates.
 *
 *   const { documents, loading } = useDocuments({
 *       filter: { type: 'document', 'meta.published': true },
 *       sort:   { 'meta.date': -1 },
 *       limit:  20,
 *   })
 */
export function useDocuments(query = {}, { client: clientArg } = {}) {
    const client = clientArg ?? useMikserClient()

    const [documents, setDocuments] = useState([])
    const [loading,   setLoading]   = useState(true)
    const [error,     setError]     = useState(null)
    const [refreshTick, setRefreshTick] = useState(0)

    const key = useMemo(() => queryKey(query), [query])
    // Latest query, captured by ref so the effect uses the current value
    // without forcing re-subscription when only the wrapper changes.
    const queryRef = useRef(query)
    queryRef.current = query

    useEffect(() => {
        const current = queryRef.current ?? {}
        const { filter = {}, sort, fields, limit, skip } = current

        setLoading(true)
        setError(null)
        let cancelled = false

        const dispose = client.live(
            filter,
            (items) => {
                if (cancelled) return
                setDocuments(items)
                setLoading(false)
            },
            {
                sort, fields, limit, skip,
                onError: (err) => {
                    if (cancelled) return
                    setError(err)
                    setLoading(false)
                },
            },
        )

        return () => {
            cancelled = true
            dispose?.()
        }
        // key is the stable shape signature; client identity also matters
    }, [client, key, refreshTick])

    const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

    return { documents, loading, error, refresh }
}

/**
 * Live single-document lookup by URL route. Resolves the document
 * whose `meta.route` matches the given path; stays subscribed for
 * updates. Use this in the catch-all view of a SPA with dynamic
 * routes — the right shape when the catalog is too large to enumerate
 * via the snapshot/registered-routes approach.
 *
 * Each unique route resolves through the api plugin's per-query cache,
 * so the first user pays an API round-trip and subsequent users get
 * the cached file via the reverse proxy — effectively on-demand SSG
 * with no extra config.
 *
 *   import { useLocation } from 'react-router-dom'
 *   const { pathname } = useLocation()
 *   const { document, loading } = useDocumentByRoute(pathname)
 *
 * Extra options:
 *   - `extraFilter`: merged into the filter (default `{ 'meta.published': true }`).
 *     Pass `{}` to disable the published filter; pass other fields to add them.
 *   - `client`: override the default entities client.
 */
export function useDocumentByRoute(path, {
    client: clientArg,
    extraFilter = { 'meta.published': true },
} = {}) {
    const client = clientArg ?? useMikserClient()

    const [document, setDocument] = useState(null)
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(null)
    const [refreshTick, setRefreshTick] = useState(0)

    // Snapshot extraFilter into a stable signature for the effect dep.
    // Recreating { 'meta.published': true } between renders shouldn't
    // re-subscribe; an actual shape change should.
    const extraKey = useMemo(() => JSON.stringify(extraFilter ?? null), [extraFilter])

    useEffect(() => {
        if (path == null || path === '') {
            setDocument(null)
            setLoading(false)
            setError(null)
            return
        }

        setLoading(true)
        setError(null)
        let cancelled = false

        const filter = { 'meta.route': path, ...(extraFilter ?? {}) }
        const dispose = client.live(
            filter,
            (items) => {
                if (cancelled) return
                setDocument(items[0] ?? null)
                setLoading(false)
            },
            {
                limit: 1,
                onError: (err) => {
                    if (cancelled) return
                    setError(err)
                    setLoading(false)
                },
            },
        )

        return () => {
            cancelled = true
            dispose?.()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client, path, extraKey, refreshTick])

    const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

    return { document, loading, error, refresh }
}
