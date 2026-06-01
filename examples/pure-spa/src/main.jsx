import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import App from './App.jsx'

const MIKSER_URL = import.meta.env.VITE_MIKSER_URL || 'http://localhost:3001'

// Two clients, one root:
//   - documents → full content fetch via useDocument inside views
//   - sitemap   → narrow router data via useMikserRoutes in App.
//                 Server-side `cache: true` writes responses to disk;
//                 a reverse proxy can fail over to the cache when
//                 mikser is down — transparent to the SDK.
const root = createClient({ baseUrl: MIKSER_URL })
const documents = root.entities('public')
const sitemap = root.entities('sitemap')

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MikserProvider client={documents}>
      <BrowserRouter>
        <App sitemap={sitemap} />
      </BrowserRouter>
    </MikserProvider>
  </React.StrictMode>,
)
