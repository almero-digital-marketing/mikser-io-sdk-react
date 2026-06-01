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

export default function App({ sitemap }) {
  // Live route array, rebuilt whenever the mikser catalog changes.
  // Uses the sitemap client (passed from main.jsx) — narrow payload,
  // server-side cache: true so a reverse proxy can fall back to disk
  // when mikser is down, transparent to the SDK.
  const routes = useMikserRoutes({
    client: sitemap,
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
