import { useLocation } from 'react-router-dom'
import { useDocumentByRoute } from 'mikser-io-sdk-react'
import ArticleView from './ArticleView.jsx'
import ProductView from './ProductView.jsx'
import LandingView from './LandingView.jsx'
import PageView    from './PageView.jsx'
import NotFound    from './NotFound.jsx'

// Same dispatch table as pure-spa's route-mapping.jsx, just keyed
// inline rather than from a separate module — there's no other
// consumer here.
const views = {
  article: ArticleView,
  product: ProductView,
  landing: LandingView,
  page:    PageView,    // fallback for unknown components
}

export default function DocumentResolver() {
  // Look up the catalog entry whose meta.route matches the current URL.
  // With cache: true on the public endpoint, mikser writes each unique
  // route's response to disk as a side effect — repeat visits to the
  // same route are served by the reverse proxy directly. First visit
  // pays one API roundtrip; warm thereafter. Effectively per-route ISR.
  const { pathname } = useLocation()
  const { document: doc, loading } = useDocumentByRoute(pathname)

  if (loading) return <p className="loading">Loading…</p>
  if (!doc) return <NotFound />
  const View = views[doc.meta?.component] ?? PageView
  return <View entityId={doc.id} />
}
