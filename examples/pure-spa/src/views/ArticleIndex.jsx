import { Link } from 'react-router-dom'
import { useDocuments } from 'mikser-io-sdk-react'

export default function ArticleIndex() {
  const { documents: articles, loading } = useDocuments({
    filter: { 'meta.component': 'article' },
    sort: { 'meta.date': -1 },
    fields: ['id', 'route', 'meta'],
  })

  return (
    <section className="article-index">
      <h1>Articles</h1>
      {loading && <p>Loading…</p>}
      <ul className="article-list">
        {articles.map((article) => {
          const { meta } = article
          return (
            <li key={article.id} className="article-list__item">
              <Link to={article.route}>
                <h2>{meta?.title}</h2>
              </Link>
              <p className="article-list__meta">
                {meta?.author && <span>{meta.author}</span>}
                {meta?.date && <span> · {meta.date}</span>}
              </p>
              {meta?.summary && <p>{meta.summary}</p>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
