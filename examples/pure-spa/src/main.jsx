import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import App from './App.jsx'

const MIKSER_URL = import.meta.env.VITE_MIKSER_URL || 'http://localhost:3001'

// One client, one endpoint. data.catalog points at the static snapshot
// the data plugin writes (out/data/sitemap.json) — that's the fast
// first-paint path for routes. After the snapshot lands the SDK opens
// a live SSE subscribe on the same /public endpoint for incremental
// updates. No second API endpoint, no second cache file — just one
// CDN-cacheable static file plus the existing live channel.
const documents = createClient({ baseUrl: MIKSER_URL })
  .entities('public', { data: { catalog: 'sitemap' } })

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MikserProvider client={documents}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MikserProvider>
  </React.StrictMode>,
)
