import { Link, useRoutes } from 'react-router-dom'
import { useMikserRoutes } from 'mikser-io-sdk-react'
import { mapRoute } from './route-mapping.jsx'

/**
 * Editor (live) shell. Routes come live from the mikser catalog via
 * useMikserRoutes, so adding or editing content shows up instantly while
 * editing — the same views the static build uses, but resolved at runtime.
 */
export default function AppEditor() {
  // useMikserRoutes reads the default client from MikserProvider —
  // configured in main.editor.jsx with data.catalog pointing at the
  // static sitemap snapshot. First paint loads from that file; SSE
  // keeps the route table current.
  const routes = useMikserRoutes({ mapRoute })
  const element = useRoutes(routes)

  return (
    <div className="app">
      <header className="bar bar--editor">
        <strong>Editor (live)</strong>
        <nav>
          <Link to="/">home</Link>
        </nav>
      </header>
      <main>{element}</main>
    </div>
  )
}
