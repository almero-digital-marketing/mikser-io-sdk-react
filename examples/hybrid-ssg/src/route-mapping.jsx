import ArticleView from './views/ArticleView.jsx'
import PageView from './views/PageView.jsx'

// Dispatch by meta.component, not meta.layout — layout stays reserved
// for mikser's SSG render pipeline. Keeping them separate avoids
// "layout 'page' not found" warnings when a SPA-only component has
// no matching template.
export const viewForComponent = {
  article: ArticleView,
  page: PageView,
  landing: PageView,
  product: PageView,
}

// Resolve URL path: prefer meta.route, fall back to destination.
function routeFor(document) {
  if (document.meta?.route) return document.meta.route
  if (document.destination) {
    return document.destination
      .replace(/\/index\.html?$/, '/')
      .replace(/\.html?$/, '')
  }
  return null
}

/**
 * mapRoute — used by the editor (runtime) side via useMikserRoutes.
 * Returns { path, element } for React Router, or null to skip.
 */
export function mapRoute(document) {
  const path = routeFor(document)
  if (!path) return null
  const View = viewForComponent[document?.meta?.component] ?? PageView
  return {
    path,
    element: <View id={document.id} />,
  }
}
