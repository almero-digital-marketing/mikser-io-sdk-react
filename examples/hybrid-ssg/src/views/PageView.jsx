import { useDocument } from 'mikser-io-sdk-react'

export default function PageView({ id }) {
  const { document } = useDocument(id)

  if (!document) return null

  const { meta, content } = document

  return (
    <article className="document">
      <h1>{meta?.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  )
}
