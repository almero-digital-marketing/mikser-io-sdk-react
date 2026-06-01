# Dynamic SPA — React

A SPA shape for catalogs too large to enumerate at boot. One catch-all route, per-navigation lookup, cache-backed first paint.

## When to pick this

- Content catalogs past ~5–10k routes — blogs with thousands of posts, large product catalogs, big knowledge bases, document archives.
- Any case where `/data/sitemap.json` would be over ~1–2 MB and dragging first paint.

For smaller catalogs (< 5k routes), [`examples/pure-spa`](../pure-spa) is the right choice — it pre-registers every route from the snapshot and gives an even faster cold-route experience.

## What it shows

- **One catch-all route.** `App.jsx` registers exactly one mikser-backed `<Route path="*" element={<DocumentResolver />} />`. Hand-coded routes (`/`) come before it so they shadow the catch-all where they should.
- **`useDocumentByRoute(pathname)`** in `DocumentResolver.jsx` — issues `GET /api/public/entities?meta.route=<currentPath>` and dispatches the matched document to the right view (`ArticleView` / `ProductView` / `LandingView` / `PageView`).
- **No `data.catalog`, no `useMikserRoutes`, no `data.catalog.sitemap` block.** The catalog is the route table — there's no separate index to maintain or load.
- **Live updates via SSE.** `useDocumentByRoute` wraps `client.live()` underneath, so an edit to the currently-displayed document updates the page without a refresh — same DX as pure-spa, just at scale.
- **`useDocuments` still works for known-shape queries** — the nav menu and Home's "Latest articles" list use it, with `fields` projections to keep the responses narrow.

## How the caching works

`useDocumentByRoute` issues a GET to `/api/public/entities?meta.route=...`. With `cache: true` on the public endpoint, mikser writes that response to disk as a side effect of serving it. The standard nginx failover config (see [mikser-io's caching docs](https://github.com/almero-digital-marketing/mikser-io/blob/main/documentation/caching.md)) serves the file directly on subsequent requests. So:

- **First visitor to a route:** SDK → mikser → response served + written to `out/api/public/entities/meta.route=%2F...&meta.published=true&limit=1.json`
- **Every subsequent visitor:** SDK → proxy serves the cached file (mikser idle)
- **Catalog change:** entire cache directory cleared, re-warms on demand

Effectively per-route ISR — the cache is built by real user traffic, no separate prerender step.

## Project structure

```
dynamic-spa/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx               ← createRoot + MikserProvider + BrowserRouter
    ├── App.jsx                ← <Nav /> + <Routes> with ONE catch-all
    ├── components/
    │   └── Nav.jsx            ← useDocuments({ filter: meta.nav })
    └── views/
        ├── Home.jsx           ← hand-coded landing, "Latest 6 articles" via useDocuments
        ├── DocumentResolver.jsx   ← useDocumentByRoute(pathname) + dispatch
        ├── ArticleView.jsx
        ├── ProductView.jsx
        ├── LandingView.jsx
        ├── PageView.jsx
        └── NotFound.jsx
```

No `route-mapping.jsx` — there's no separate route table to maintain. The dispatch table lives inline in `DocumentResolver.jsx` since it's the only consumer.

## Running it

```bash
# In a separate terminal — start the shared mikser backend
cd ../mikser-content
npm install
npm run dev

# Back here — install + run
npm install
echo "VITE_MIKSER_URL=http://localhost:3001" > .env
npm run dev
```

Visit `http://localhost:5173`. Navigate to any document — `/en/articles/welcome`, `/en/products/desk-lamp`, etc. — and the catch-all kicks in: `useDocumentByRoute` resolves the catalog entry, the matching view renders.

## Production note

The cache-backed first paint only works when a reverse proxy is fronting mikser and configured to serve the cached files on upstream failure. In dev mode you're hitting mikser directly every time. See [the caching docs](https://github.com/almero-digital-marketing/mikser-io/blob/main/documentation/caching.md) for the working nginx config.

## Diffs vs. pure-spa

If you're already familiar with [`examples/pure-spa`](../pure-spa), here's what changed:

| | pure-spa (Scenario A) | dynamic-spa (Scenario D) |
|---|---|---|
| Client setup | `entities('public', { data: { catalog: 'sitemap', entities: 'page' } })` | `entities('public')` — no snapshot |
| Router | `useMikserRoutes` + `useRoutes(routes)` | One `<Route path="*">` catch-all |
| `route-mapping.jsx` | Has it, maps catalog entries to React Router descriptors | Doesn't exist — dispatch happens inline in DocumentResolver |
| `mikser.config.js` | Has `data.catalog.sitemap` block | Can drop the block — no snapshot consumed |
| First paint cost | One CDN-cacheable snapshot fetch | One API roundtrip per unique cold route (cached thereafter) |
| Scaling | Snapshot size grows linearly with catalog | First paint cost constant per route, independent of catalog size |
