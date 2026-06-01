import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import App from './App.jsx'

const MIKSER_URL = import.meta.env.VITE_MIKSER_URL || 'http://localhost:3001'

// Scenario D — Dynamic routes.
//
//   No data.catalog. No useMikserRoutes. No /data/sitemap.json snapshot.
//
// Why: when the catalog is past ~5–10k routes, loading every route
// into a snapshot at boot is the wrong shape. Install one catch-all
// instead and resolve the current path against mikser per-navigation.
// The api plugin's `cache: true` writes each unique route's response
// to disk, so a reverse proxy serves repeat visits from the cache
// directly — effectively per-route ISR powered by real traffic.
const documents = createClient({ baseUrl: MIKSER_URL })
  .entities('public')

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MikserProvider client={documents}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MikserProvider>
  </React.StrictMode>,
)
