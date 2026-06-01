import { Link, useRoutes } from 'react-router-dom'
import { useMikserRoutes } from 'mikser-io-sdk-react'
import { mapRoute } from './route-mapping.jsx'

/**
 * Editor (live) shell. Routes come live from the mikser catalog via
 * useMikserRoutes, so adding or editing content shows up instantly while
 * editing — the same views the static build uses, but resolved at runtime.
 */
export default function AppEditor({ sitemap }) {
  // useMikserRoutes against the sitemap client (passed in from main.editor.jsx).
  // The sitemap endpoint has server-side cache: true so a reverse
  // proxy fails over to disk when mikser is down — transparent failover.
  const routes = useMikserRoutes({ client: sitemap, mapRoute })
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
