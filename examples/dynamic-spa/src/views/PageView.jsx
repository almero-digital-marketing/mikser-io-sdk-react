import { useDocument } from 'mikser-io-sdk-react'

export default function PageView({ id }) {
  const { document } = useDocument(id)

  if (!document) return null

  const { meta, content } = document

  return (
    <article className="page">
      <h1>{meta?.title}</h1>
      <div
        className="page__body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </article>
  )
}
