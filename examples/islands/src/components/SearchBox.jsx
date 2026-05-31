import { useMemo, useState } from 'react'
import { useDocuments } from 'mikser-io-sdk-react'

export default function SearchBox() {
  const [query, setQuery] = useState('')
  const { documents } = useDocuments({
    fields: ['id', 'route', 'meta'],
    limit: 100,
  })

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return []
    return documents
      .filter((document) => (document.meta?.title ?? '').toLowerCase().includes(term))
      .slice(0, 8)
  }, [query, documents])

  return (
    <div className="search">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        type="search"
        placeholder="Search…"
        className="search__input"
      />
      {results.length > 0 && (
        <ul className="search__results">
          {results.map((hit) => (
            <li key={hit.id}>
              <a href={hit.route}>{hit.meta?.title ?? hit.route}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
