import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import AppEditor from './App.editor.jsx'

const MIKSER_URL = import.meta.env.VITE_MIKSER_URL || 'http://localhost:3001'
const client = createClient({ url: MIKSER_URL }).entities('public')

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <MikserProvider client={client}>
      <BrowserRouter>
        <AppEditor />
      </BrowserRouter>
    </MikserProvider>
  </React.StrictMode>,
)
