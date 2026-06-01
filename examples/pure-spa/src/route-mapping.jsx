import Home from './views/Home.jsx'
import ArticleIndex from './views/ArticleIndex.jsx'
import ArticleView from './views/ArticleView.jsx'
import ProductIndex from './views/ProductIndex.jsx'
import ProductView from './views/ProductView.jsx'
import LandingView from './views/LandingView.jsx'
import PageView from './views/PageView.jsx'

// Dispatch by meta.component, not meta.layout — layout stays reserved
// for mikser's SSG render pipeline (the islands example uses it).
// Keeping them separate avoids "layout 'page' not found" warnings.
export const viewForComponent = {
  page: PageView,
  article: ArticleView,
  product: ProductView,
  landing: LandingView,
}

// Optional index views, keyed by route so the catalog can opt in via meta.
export const indexViews = {
  ArticleIndex,
  ProductIndex,
  Home,
}

// Resolve URL path: prefer meta.route, fall back to destination
// (mikser computes this from source path + cleanUrls). Returns null
// to skip documents with neither — fragments, partials, etc.
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
 * mapRoute — turn a mikser catalog entry into a React Router route object.
 *
 * document: { id, meta: { component, route, title, ... }, destination }
 * Returns { path, element } or null to skip.
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
