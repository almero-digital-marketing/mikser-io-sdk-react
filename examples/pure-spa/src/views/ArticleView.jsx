import { useDocument } from 'mikser-io-sdk-react'

export default function ArticleView({ id }) {
  const { document, loading } = useDocument(id)

  if (loading) return <p>Loading…</p>
  if (!document) return <p>Not found.</p>

  const { meta, content } = document

  return (
    <article className="article">
      <header className="article__header">
        <h1>{meta?.title}</h1>
        <p className="article__byline">
          {meta?.author && <span>By {meta.author}</span>}
          {meta?.date && <span> · {meta.date}</span>}
        </p>
        {meta?.summary && (
          <p className="article__summary">{meta.summary}</p>
        )}
      </header>
      <div
        className="article__body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  )
}
