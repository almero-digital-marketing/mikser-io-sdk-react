import { Link } from 'react-router-dom'
import { useDocuments } from 'mikser-io-sdk-react'

export default function Home() {
  const { documents: featured } = useDocuments({
    filter: { 'meta.featured': true },
    sort: { 'meta.date': -1 },
    fields: ['id', 'route', 'meta.title', 'meta.summary'],
    limit: 6,
  })

  return (
    <section className="home">
      <h1>Welcome</h1>
      <p className="home__lead">
        This is a runtime-everything SPA powered by mikser. Routes and content
        are resolved live in the browser.
      </p>
      <h2>Featured</h2>
      <ul className="card-grid">
        {featured.map((document) => (
          <li key={document.id} className="card">
            <Link to={document.route}>
              <h3>{document.meta?.title ?? document.route}</h3>
              {document.meta?.summary && <p>{document.meta.summary}</p>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
