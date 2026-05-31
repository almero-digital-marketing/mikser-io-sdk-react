import { Link } from 'react-router-dom'
import { useDocuments } from 'mikser-io-sdk-react'

export default function ProductIndex() {
  const { documents: products } = useDocuments({
    filter: { 'meta.layout': 'product' },
    sort: { 'meta.title': 1 },
  })

  return (
    <section className="product-index">
      <h1>Products</h1>
      <ul className="card-grid">
        {products.map((product) => {
          const { meta } = product
          return (
            <li key={product.id} className="card product-card">
              <Link to={product.route}>
                {meta?.image && <img src={meta.image} alt={meta?.title} />}
                <h3>{meta?.title}</h3>
                <p className="product-card__price">{meta?.price}</p>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
