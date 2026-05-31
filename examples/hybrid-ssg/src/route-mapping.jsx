import ArticleView from './views/ArticleView.jsx'
import PageView from './views/PageView.jsx'

export const viewForLayout = {
  article: ArticleView,
  page: PageView,
  landing: PageView,
  product: PageView,
}

/**
 * mapRoute — used by the editor (runtime) side via useMikserRoutes.
 * Returns { path, element } for React Router.
 */
export function mapRoute(document) {
  const View = viewForLayout[document?.meta?.layout] ?? PageView
  return {
    path: document.route,
    element: <View id={document.id} />,
  }
}
