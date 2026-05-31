import { useDocument } from 'mikser-io-sdk-react'

export default function LandingView({ id }) {
  const { document } = useDocument(id)

  if (!document) return null

  const { meta, content } = document

  return (
    <div className="landing">
      <section className="hero">
        <h1>{meta?.hero?.heading ?? meta?.title}</h1>
        {meta?.hero?.subheading && (
          <p className="hero__sub">{meta.hero.subheading}</p>
        )}
        {meta?.cta?.href && (
          <a className="hero__cta" href={meta.cta.href}>
            {meta.cta.label ?? 'Learn more'}
          </a>
        )}
      </section>
      <div
        className="landing__body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}
