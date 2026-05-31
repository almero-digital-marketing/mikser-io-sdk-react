import { Link } from 'react-router-dom'
import { useDocuments } from 'mikser-io-sdk-react'

export default function Nav() {
  const { documents: links } = useDocuments({
    filter: { 'meta.nav': true },
    sort: { 'meta.nav_order': 1 },
    fields: ['id', 'route', 'meta'],
  })

  return (
    <nav className="nav">
      <Link to="/" className="nav__brand">
        mikser
      </Link>
      <ul className="nav__links">
        {links.map((link) => (
          <li key={link.id}>
            <Link to={link.route}>{link.meta?.title ?? link.route}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
