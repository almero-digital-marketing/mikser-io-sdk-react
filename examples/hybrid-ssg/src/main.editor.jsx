import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import AppEditor from './App.editor.jsx'

const MIKSER_URL = import.meta.env.VITE_MIKSER_URL || 'http://localhost:3001'

// One client. data.catalog pulls the static snapshot the data plugin
// writes (out/data/sitemap.json) on first paint, then live SSE keeps
// it current. No second API endpoint.
const documents = createClient({ baseUrl: MIKSER_URL })
  .entities('public', { data: { catalog: 'sitemap' } })

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MikserProvider client={documents}>
      <BrowserRouter>
        <AppEditor />
      </BrowserRouter>
    </MikserProvider>
  </React.StrictMode>,
)
