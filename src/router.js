// Router integration for React Router v6+.
//
// `useMikserRoutes` returns a live array of route objects. The consumer
// passes it to `useRoutes(routes)` (recommended — no router teardown on
// catalog changes) or to a memoized `createBrowserRouter(routes)` when
// they need data-router features (loaders, actions, etc.).
//
// Either pattern works:
//
//   function App() {
//       const routes = useMikserRoutes({ mapRoute })
//       return useRoutes(routes)
//   }
//
//   function App() {
//       const routes = useMikserRoutes({ mapRoute })
//       const router = useMemo(() => createBrowserRouter(routes), [routes])
//       return <RouterProvider router={router} />
//   }
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMikserClient } from './client.js'

const DEFAULT_FILTER = { 'meta.published': true, 'meta.route': { $exists: true } }

// Stable string signature for a filter, so the effect that owns the SSE
// subscription only re-runs when the filter's *shape* changes — not on
// every render where the consumer recreates the object literal.
function filterKey(filter) {
    return JSON.stringify(filter ?? null)
}

/**
 * Live list of React Router route objects from the catalog.
 *
 *   const routes = useMikserRoutes({
 *       filter: { 'meta.published': true, 'meta.route': { $exists: true } },
 *       mapRoute: document => ({
 *           path: document.meta.route,
 *           element: <DocumentPage entityId={document.id} />,
 *       }),
 *       staticRoutes: [{ path: '/login', element: <Login /> }],
 *       notFoundElement: <NotFound />,
 *   })
 *   return useRoutes(routes)
 */
export function useMikserRoutes({
    client: clientArg,
    filter = DEFAULT_FILTER,
    mapRoute,
    staticRoutes = [],
    notFoundElement = null,
} = {}) {
    if (!mapRoute) {
        throw new Error('useMikserRoutes: { mapRoute } is required')
    }
    const client = clientArg ?? useMikserClient()

    const [contentRoutes, setContentRoutes] = useState([])

    // Capture latest values without making them effect deps. The effect
    // re-runs only when the filter *shape* (filterKey) or client identity
    // change; inside the callback we always read the latest mapRoute and
    // filter from refs.
    const filterRef = useRef(filter)
    filterRef.current = filter
    const mapRouteRef = useRef(mapRoute)
    mapRouteRef.current = mapRoute

    const key = useMemo(() => filterKey(filter), [filter])

    useEffect(() => {
        let cancelled = false
        const dispose = client.live(
            filterRef.current,
            (documents) => {
                if (cancelled) return
                setContentRoutes(documents.map(mapRouteRef.current).filter(Boolean))
            },
            { fields: ['id', 'meta'] },
        )
        return () => {
            cancelled = true
            dispose?.()
        }
    }, [client, key])

    return useMemo(() => {
        const tail = notFoundElement
            ? [{ path: '*', element: notFoundElement }]
            : []
        return [...staticRoutes, ...contentRoutes, ...tail]
    }, [staticRoutes, contentRoutes, notFoundElement])
}

/**
 * Build-time route generation. One-shot list() against the catalog;
 * returns plain route definitions for use in Vite SSG / Next static
 * export / any prerender tooling.
 *
 *   // build/routes.mjs
 *   const routes = await generateMikserRoutes({
 *       client: documents,
 *       mapRoute: document => ({ path: document.meta.route, id: document.id }),
 *   })
 *
 * mapRoute can return any shape — this helper just enumerates the
 * catalog and applies your mapper. Returns whatever the mapper
 * returns; React Router specifics (element, lazy, etc.) are the
 * caller's problem because element construction is environment-
 * specific (server vs client).
 */
export async function generateMikserRoutes({
    client,
    filter = DEFAULT_FILTER,
    mapRoute,
} = {}) {
    if (!client)   throw new Error('generateMikserRoutes: { client } is required')
    if (!mapRoute) throw new Error('generateMikserRoutes: { mapRoute } is required')

    const { items } = await client.list({
        filter,
        fields: ['id', 'meta'],
        limit:  10_000,
    })
    return items.map(mapRoute)
}
