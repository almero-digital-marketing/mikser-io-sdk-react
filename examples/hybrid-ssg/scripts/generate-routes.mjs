import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from 'mikser-io-sdk-api'
import { generateMikserRoutes } from 'mikser-io-sdk-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MIKSER_URL = process.env.MIKSER_URL || 'http://localhost:3001'

// Same single client as the runtime editor. data.catalog points at
// the static snapshot the data plugin writes (out/data/sitemap.json)
// — generateMikserRoutes consults it before falling back to a fresh
// list() call.
const client = createClient({ baseUrl: MIKSER_URL })
  .entities('public', { data: { catalog: 'sitemap' } })

function routeFor(d) {
  if (d.meta?.route) return d.meta.route
  if (d.destination) {
    return d.destination
      .replace(/\/index\.html?$/, '/')
      .replace(/\.html?$/, '')
  }
  return null
}

// Build-time, one-shot. mapRoute returns a plain descriptor we serialize to
// JSON; the public entry rehydrates it into React Router routes at runtime.
const routes = (await generateMikserRoutes({
  client,
  mapRoute: (document) => {
    const path = routeFor(document)
    if (!path) return null
    return {
      path,
      component: document?.meta?.component ?? 'page',
      id:        document.id,
      title:     document?.meta?.title ?? '',
    }
  },
})).filter(Boolean)

mkdirSync(resolve(__dirname, '../src/generated'), { recursive: true })
writeFileSync(
  resolve(__dirname, '../src/generated/routes.json'),
  JSON.stringify(routes, null, 2),
)

console.log(`Generated ${routes.length} routes → src/generated/routes.json`)
