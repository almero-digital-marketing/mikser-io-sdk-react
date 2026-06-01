import { Routes, Route } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Home from './views/Home.jsx'
import DocumentResolver from './views/DocumentResolver.jsx'

// Scenario D — one catch-all route, dispatch happens inside
// DocumentResolver via useDocumentByRoute(pathname). Hand-coded
// routes (Home) are matched first so they shadow the catch-all
// where they should.
export default function App() {
  return (
    <div className="app">
      <Nav />
      <main className="content">
        <Routes>
          <Route path="/"  element={<Home />} />
          {/* Catch-all → DocumentResolver looks up meta.route === pathname */}
          <Route path="*"  element={<DocumentResolver />} />
        </Routes>
      </main>
    </div>
  )
}
