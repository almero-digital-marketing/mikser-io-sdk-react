import { Link } from 'react-router-dom'
import { useDocuments } from 'mikser-io-sdk-react'

export default function Nav() {
  // Nav links are content-driven: documents marked meta.nav: true. The
  // narrow `fields` projection keeps the response small even on a big
  // catalog. The dev-mode wide-list warning would fire if we forgot it.
  const { documents: links } = useDocuments({
    filter: { 'meta.nav': true, 'meta.published': true },
    sort: { 'meta.nav_order': 1 },
    fields: ['id', 'meta.title', 'meta.route'],
  })

  return (
    <nav className="nav">
      <Link to="/" className="nav__brand">
        mikser
      </Link>
      <ul className="nav__links">
        {links.map((link) => (
          <li key={link.id}>
            <Link to={link.meta?.route ?? '/'}>{link.meta?.title}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
