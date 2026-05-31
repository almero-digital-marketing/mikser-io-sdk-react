import { useDocument } from 'mikser-io-sdk-react'

export default function ArticleView({ id }) {
  const { document } = useDocument(id)

  if (!document) return null

  const { meta, content } = document

  return (
    <article className="document">
      <h1>{meta?.title}</h1>
      {meta?.author && <p className="byline">By {meta.author}</p>}
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  )
}
