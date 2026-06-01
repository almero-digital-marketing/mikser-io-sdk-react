import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import AppEditor from './App.editor.jsx'

const MIKSER_URL = import.meta.env.VITE_MIKSER_URL || 'http://localhost:3001'
// Two clients, one root. documents for useDocument inside views;
// sitemap drives the editor's useMikserRoutes and benefits from
// server-side cache: true + reverse-proxy failover.
const root = createClient({ baseUrl: MIKSER_URL })
const documents = root.entities('public')
const sitemap = root.entities('sitemap')

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MikserProvider client={documents}>
      <BrowserRouter>
        <AppEditor sitemap={sitemap} />
      </BrowserRouter>
    </MikserProvider>
  </React.StrictMode>,
)
