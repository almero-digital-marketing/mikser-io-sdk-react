// Router integration for React Router v6+.
//
// The Vue SDK's createMikserRouter returns a router instance whose
// routes are kept in sync via addRoute/removeRoute. React Router's
// equivalent shape is different — `useRoutes(routes)` takes an array
// and renders the matched route. So the hook here returns the array
// directly; the consumer passes it to `useRoutes()` or to
// `createBrowserRouter()` at the top of their tree.
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
//
// The first is preferred because it doesn't tear down router state on
// every catalog change. The second is right if you need data-router
// features (loaders, actions, etc.) on the dynamic routes.
import { useEffect, useMemo, useState } from 'react'
import { useMikserClient } from './client.js'

const DEFAULT_FILTER = { 'meta.published': true, 'meta.route': { $exists: true } }

/**
 * Live list of React Router route objects from the catalog.
 *
 *   const routes = useMikserRoutes({
 *       filter: { 'meta.published': true, 'meta.route': { $exists: true } },
 *       mapRoute: doc => ({
 *           path: doc.meta.route,
 *           element: <DocumentPage entityId={doc.id} />,
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

    // Stable key for the filter so we don't re-subscribe on every render
    const filterKey = useMemo(() => JSON.stringify(filter), [filter])

    useEffect(() => {
        let cancelled = false
        const dispose = client.live(
            JSON.parse(filterKey),
            (docs) => {
                if (cancelled) return
                setContentRoutes(docs.map(mapRoute).filter(Boolean))
            },
            { fields: ['id', 'meta'] },
        )
        return () => {
            cancelled = true
            dispose?.()
        }
    }, [client, filterKey, mapRoute])

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
 *       client: docs,
 *       mapRoute: doc => ({ path: doc.meta.route, id: doc.id }),
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
