import { Link, useRoutes } from 'react-router-dom'
import { viewForComponent } from './route-mapping.jsx'

/**
 * Public (static) shell. The route manifest is generated at build time by
 * scripts/generate-routes.mjs and rehydrated here into React Router routes.
 * No live catalog subscription — the route list is fixed at build time, though
 * each view still fetches its document so content stays current.
 */
export default function AppPublic({ routes: manifest }) {
  const routes = manifest.map((entry) => {
    const View = viewForComponent[entry.component] ?? viewForComponent.page
    return { path: entry.path, element: <View id={entry.id} /> }
  })

  const element = useRoutes(routes)

  return (
    <div className="app">
      <header className="bar">
        <strong>Public (static)</strong>
        <nav>
          {manifest.map((entry) => (
            <Link key={entry.id} to={entry.path}>
              {entry.title ?? entry.path}
            </Link>
          ))}
        </nav>
      </header>
      <main>{element}</main>
    </div>
  )
}
