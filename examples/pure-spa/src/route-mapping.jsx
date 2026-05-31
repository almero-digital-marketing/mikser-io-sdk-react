import Home from './views/Home.jsx'
import ArticleIndex from './views/ArticleIndex.jsx'
import ArticleView from './views/ArticleView.jsx'
import ProductIndex from './views/ProductIndex.jsx'
import ProductView from './views/ProductView.jsx'
import LandingView from './views/LandingView.jsx'
import PageView from './views/PageView.jsx'

export const viewForLayout = {
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

/**
 * mapRoute — turn a mikser catalog entry into a React Router route object.
 *
 * document: { id, route, meta: { layout, title, ... } }
 * Returns { path, element } as expected by useMikserRoutes / useRoutes.
 */
export function mapRoute(document) {
  const View = viewForLayout[document?.meta?.layout] ?? PageView
  return {
    path: document.route,
    element: <View id={document.id} />,
  }
}
