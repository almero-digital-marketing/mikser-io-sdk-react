import { createRoot } from 'react-dom/client'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import SearchBox from '../components/SearchBox.jsx'

const MIKSER_URL = import.meta.env.VITE_MIKSER_URL || 'http://localhost:3001'
const client = createClient({ url: MIKSER_URL }).entities('public')

export function mountSearch(selector = '[data-island="search"]') {
  for (const el of document.querySelectorAll(selector)) {
    const props = { ...el.dataset }
    createRoot(el).render(
      <MikserProvider client={client}>
        <SearchBox {...props} />
      </MikserProvider>,
    )
  }
}
