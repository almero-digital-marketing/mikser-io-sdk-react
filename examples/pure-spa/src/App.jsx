import { useRoutes } from 'react-router-dom'
import { useMikserRoutes } from 'mikser-io-sdk-react'
import Nav from './components/Nav.jsx'
import Home from './views/Home.jsx'
import ArticleIndex from './views/ArticleIndex.jsx'
import ProductIndex from './views/ProductIndex.jsx'
import NotFound from './views/NotFound.jsx'
import { mapRoute } from './route-mapping.jsx'

// Static routes that are not backed by a single mikser document. These are
// merged with the live catalog routes coming from useMikserRoutes.
const staticRoutes = [
  { path: '/', element: <Home /> },
  { path: '/articles', element: <ArticleIndex /> },
  { path: '/products', element: <ProductIndex /> },
]

export default function App() {
  // Live route array, rebuilt whenever the mikser catalog changes.
  // Reads the default client from MikserProvider — that client is
  // configured with data: { catalog: 'sitemap', entities: 'page' } in main.jsx, so
  // the first paint loads from the static snapshot (CDN-cacheable, no
  // API roundtrip), then SSE deltas keep it current.
  const routes = useMikserRoutes({
    mapRoute,
    staticRoutes,
    notFoundElement: <NotFound />,
  })

  const element = useRoutes(routes)

  return (
    <div className="app">
      <Nav />
      <main className="content">{element}</main>
    </div>
  )
}
