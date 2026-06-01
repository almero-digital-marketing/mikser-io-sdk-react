import { Link } from 'react-router-dom'
import { useDocuments } from 'mikser-io-sdk-react'

export default function Home() {
  // "Latest 6 articles" — a known-shape query that's still useful in
  // dynamic-routes mode. Note the `fields` projection: we're not
  // pulling every article's markdown body, just the routing + display
  // fields. The dev-mode wide-list warning would fire without it.
  const { documents: latest } = useDocuments({
    filter: { 'meta.component': 'article', 'meta.published': true },
    sort: { 'meta.date': -1 },
    fields: ['id', 'meta.title', 'meta.summary', 'meta.route', 'meta.date'],
    limit: 6,
  })

  return (
    <section className="home">
      <h1>Welcome</h1>
      <p className="home__lead">
        Dynamic-routes SPA — one catch-all route, per-navigation lookup,
        cache-backed first paint. Routes scale without touching first
        paint cost.
      </p>
      <h2>Latest articles</h2>
      <ul className="card-grid">
        {latest.map((doc) => (
          <li key={doc.id} className="card">
            <Link to={doc.meta?.route ?? '/'}>
              <h3>{doc.meta?.title}</h3>
              {doc.meta?.date && <time>{doc.meta.date}</time>}
              {doc.meta?.summary && <p>{doc.meta.summary}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
