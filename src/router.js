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
 * Build-time route generation. Enumerates every matching catalog entity
 * and applies the mapRoute callback; returns plain route definitions
 * for use in Vite SSG / Next static export / any prerender tooling.
 *
 *   // build/routes.mjs
 *   const routes = await generateMikserRoutes({
 *       client: documents,
 *       mapRoute: document => ({ path: document.meta.route, id: document.id }),
 *   })
 *
 * mapRoute can return any shape — this helper just enumerates the
 * catalog and applies your mapper. Returns whatever the mapper returns;
 * React Router specifics (element, lazy, etc.) are the caller's problem
 * because element construction is environment-specific (server vs client).
 *
 * Auto-paginates via sdk-api's listAll() — no manual limit, no silent
 * truncation on large catalogs.
 */
// Implementation lives in mikser-io-sdk-api so all three framework SDKs
// share the same enumeration + filter defaults. Re-export here so React
// users still import it from their framework package.
export { generateMikserRoutes } from 'mikser-io-sdk-api'

/**
 * Dev-mode detector for the silent "no route matched → null element" class.
 * `useRoutes(routes)` returns null when nothing matches and react-router only
 * logs a terse warning — the page goes blank with no pointer to the cause.
 * Catalog routes live at their (often localized) `meta.route` path, so
 * reaching for the canonical href as a path (`/web` when the route is at `/`)
 * misses.
 *
 * Decoupled from react-router (kept an optional peer, like the rest of this
 * module): you pass the current `pathname` (from `useLocation`) and whether a
 * content route `matched`. When a route carries `id === pathname` — set
 * `id: document.meta.href` in mapRoute, the analog of vue-router's `name` —
 * the warning points at the real route.
 *
 *   const routes  = useMikserRoutes({ mapRoute })
 *   const element = useRoutes(routes)
 *   const { pathname } = useLocation()
 *   useUnmatchedRouteWarning({ routes, pathname, matched: element != null })
 *   return element
 *
 * (With a `notFoundElement`, `useRoutes` is never null — derive `matched`
 * from your own check, e.g. react-router's `matchRoutes`, excluding the `*`
 * route.) Reports only; it renders nothing itself.
 */
export function useUnmatchedRouteWarning({ routes, pathname, matched, warn = console.warn } = {}) {
    useEffect(() => {
        if (matched) return
        let hint = ''
        const named = (routes ?? []).find((r) => r.id === pathname)
        if (named?.path) {
            hint =
                `\n  '${pathname}' is a route id (a canonical href), not a path — ` +
                `its route is '${named.path}'. Navigate to that path.`
        }
        warn(`[mikser] no route matched '${pathname}' — the matched element is null.${hint}`)
    }, [pathname, matched]) // eslint-disable-line react-hooks/exhaustive-deps
}
