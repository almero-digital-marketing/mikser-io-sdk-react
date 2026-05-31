// Vector integration — bridges the mikser-io-sdk-vector client into a
// React-shaped hook. Same Context shape as the documents client, just
// a separate provider so projects that don't search don't have to
// install mikser-io-sdk-vector.
//
// SDK files stay plain .js (no JSX) so the package ships without a JSX
// build step. createElement() is used in place of JSX inside the SDK;
// consumers write JSX freely in their own apps.
import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

export const MikserVectorContext = createContext(null)

/**
 * MikserVectorProvider — wrap your tree to make the vector client
 * available to every hook below it.
 *
 *   <MikserVectorProvider client={similar}>
 *     <App />
 *   </MikserVectorProvider>
 *
 * `client` should be what `createClient(...)` from mikser-io-sdk-vector
 * returns. The SDK doesn't import that package directly (it's an
 * optional runtime dep), it just expects the same surface.
 */
export function MikserVectorProvider({ client, children }) {
    if (!client) {
        throw new Error('MikserVectorProvider: { client } prop is required')
    }
    return createElement(MikserVectorContext.Provider, { value: client }, children)
}

/**
 * Read the configured vector client from context. Useful for ad-hoc
 * calls; useSimilar reads it for you.
 */
export function useMikserVectorClient() {
    const client = useContext(MikserVectorContext)
    if (!client) {
        throw new Error(
            'useMikserVectorClient: no vector client found. Did you wrap your tree in ' +
            '<MikserVectorProvider client={...}>?'
        )
    }
    return client
}

/**
 * Live semantic search hook. Re-fires the search when `query` changes,
 * debounced. Stale results from races are discarded via a monotonic
 * token, so a fast-typing burst can't have older responses clobber
 * newer ones.
 *
 *   const [q, setQ] = useState('')
 *   const { results, loading, error } = useSimilar('documents', q, {
 *       limit: 10, debounce: 200, minLength: 2,
 *   })
 *
 *   results === [{ id, distance, data: {...} }, ...]
 *
 * Configuration:
 *
 *   limit     — max hits per request. Default 5.
 *   debounce  — ms to wait after the last query change before firing.
 *               Default 200. Set to 0 to fire immediately.
 *   minLength — skip the request below this query length. Default 1
 *               (empty string never fires; 'a' fires).
 *   client    — override the injected vector client. Rare.
 *
 * `refresh()` forces a fresh request against the current query.
 */
export function useSimilar(storeName, query, {
    client: clientArg,
    limit = 5,
    debounce = 200,
    minLength = 1,
} = {}) {
    const ctxClient = useContext(MikserVectorContext)
    const client = clientArg ?? ctxClient
    if (!client) {
        throw new Error(
            'useSimilar: no vector client found. Wrap your tree in ' +
            '<MikserVectorProvider client={...}> or pass { client } directly.'
        )
    }
    const store = useMemo(() => client.vector(storeName), [client, storeName])

    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(null)
    const [refreshTick, setRefreshTick] = useState(0)

    // Monotonic per-fire token. Held in a ref so it survives renders
    // but doesn't trigger them. Every new fire increments it; the
    // response handler discards itself when the token has moved on.
    const tokenRef = useRef(0)

    const trimmed = String(query ?? '').trim()

    useEffect(() => {
        if (trimmed.length < minLength) {
            setResults([])
            setLoading(false)
            setError(null)
            return
        }
        const myToken = ++tokenRef.current

        async function fire() {
            setLoading(true)
            try {
                const { results: hits } = await store.findSimilar(trimmed, { limit })
                if (myToken !== tokenRef.current) return
                setResults(hits)
                setError(null)
            } catch (err) {
                if (myToken !== tokenRef.current) return
                setError(err)
                setResults([])
            } finally {
                if (myToken === tokenRef.current) setLoading(false)
            }
        }

        if (debounce > 0) {
            const timer = setTimeout(fire, debounce)
            return () => clearTimeout(timer)
        } else {
            fire()
            // Mark any in-flight request as stale on cleanup
            return () => { tokenRef.current++ }
        }
    }, [store, trimmed, limit, debounce, minLength, refreshTick])

    const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

    return { results, loading, error, refresh }
}
