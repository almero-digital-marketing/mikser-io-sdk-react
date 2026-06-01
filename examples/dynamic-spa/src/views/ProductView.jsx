import { useDocument } from 'mikser-io-sdk-react'

export default function ProductView({ id }) {
  const { document } = useDocument(id)

  if (!document) return null

  const { meta, content } = document
  const inStock = Boolean(meta?.in_stock)

  return (
    <article className="product">
      <div className="product__media">
        {meta?.image && <img src={meta.image} alt={meta?.title} />}
      </div>
      <div className="product__info">
        <h1>{meta?.title}</h1>
        <p className="product__price">{meta?.price}</p>
        <p className="product__sku">SKU: {meta?.sku}</p>
        <p className={`product__stock${inStock ? ' in-stock' : ''}`}>
          {inStock ? 'In stock' : 'Out of stock'}
        </p>
        <button disabled={!inStock}>
          {inStock ? 'Add to cart' : 'Out of stock'}
        </button>
        <div
          className="product__description"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </article>
  )
}
