import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from 'mikser-io-sdk-api'
import { generateMikserRoutes } from 'mikser-io-sdk-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MIKSER_URL = process.env.MIKSER_URL || 'http://localhost:3001'

const client = createClient({ url: MIKSER_URL }).entities('public')

// Build-time, one-shot. mapRoute returns a plain descriptor we serialize to
// JSON; the public entry rehydrates it into React Router routes at runtime.
const routes = await generateMikserRoutes({
  client,
  mapRoute: (document) => ({
    path: document.route,
    layout: document?.meta?.layout ?? 'page',
    id: document.id,
    title: document?.meta?.title ?? '',
  }),
})

mkdirSync(resolve(__dirname, '../src/generated'), { recursive: true })
writeFileSync(
  resolve(__dirname, '../src/generated/routes.json'),
  JSON.stringify(routes, null, 2),
)

console.log(`Generated ${routes.length} routes → src/generated/routes.json`)
