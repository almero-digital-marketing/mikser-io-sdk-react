# mikser-io-sdk-react

**Wire a React app to a [mikser-io](https://github.com/almero-digital-marketing/mikser-io) content backend in ~10 lines.** Content stays as `.md` and `.yml` files on disk — diffable, grep-able, copy-anywhere. The hooks below give you live updates over SSE, typed access to layout-shaped front-matter, multilingual URL resolution, asset metadata, and semantic search.

| What you get | Reads as |
|---|---|
| **Live content** | `const { document } = useDocument(id)` — re-renders as the file changes |
| **Current document** | `useCurrentDocument()` — the current-route document, one shared subscription (provide once at the root) |
| **Live lists** | `const { documents } = useDocuments({ filter, sort, fields })` |
| **Multilingual URLs** | `href('/about')` → `/en/about` or `/fr/a-propos` per locale |
| **Content by reference** | `meta('/menu').products` — read a known document's fields by its logical `$ref`, no extra query |
| **Hreflang + switchers** | `useAlternates({ route })` |
| **Asset URLs** | `url(clip.meta.url)` → `<cms>/...` — join a served path from the catalog to the client base |
| **Semantic search** | `useSimilar(store, query)` with built-in debounce + stale-discard |
| **Live routes** | `useMikserRoutes({ mapRoute })` → array — pass to `useRoutes()` or `createBrowserRouter()` |
| **Build-time routes** | `generateMikserRoutes()` for Vite SSG / Next static export |

**Augment, don't own.** Your app stays yours. Routes are data — mikser produces them, you decide how they're mounted. Compose with your auth-gated routes, admin layouts, dashboard, anything else you already wire by hand.

**One mental model across every rendering shape** — runtime-everything SPA, hybrid (prerendered public + live admin), or mikser-rendered HTML with React islands mounted into specific DOM nodes. Same hooks, different mount. See [`examples/`](./examples) for the three patterns side-by-side.

**Typed at the seam.** Pair with [`mikser-io-schemas`](https://github.com/almero-digital-marketing/mikser-io-schemas) to author Zod schemas alongside your content; `useDocument<{ meta: MetaByLayout<'article'> }>(id)` then carries the front-matter shape straight into your JSX.

Pairs with [`mikser-io-sdk-api`](https://github.com/almero-digital-marketing/mikser-io-sdk-api) — that package handles transport (HTTP + SSE); this one wraps it in React idioms.

## Install

```bash
npm install mikser-io-sdk-react mikser-io-sdk-api
```

Peer deps: `react` ^18 or ^19. `react-router-dom` is optional — needed only if you use `useMikserRoutes`.

## Quick start

```jsx
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider, useDocument } from 'mikser-io-sdk-react'

const documents = createClient({ baseUrl: 'http://localhost:3001' })
    .entities('public')

function App() {
    return (
        <MikserProvider client={documents}>
            <Article id="/content/blog/launch" />
        </MikserProvider>
    )
}

function Article({ id }) {
    const { document, loading } = useDocument(id)
    if (loading) return 'Loading…'
    if (!document) return 'Not found'
    return (
        <article>
            <h1>{document.meta.title}</h1>
            <div dangerouslySetInnerHTML={{ __html: document.content }} />
        </article>
    )
}
```

## Surface

| Hook / component | What it does |
|---|---|
| `<MikserProvider client>` | Context provider — every hook below reads the client from here. |
| `useMikserClient()` | Direct access to the client for ad-hoc calls (`urlFor`, `render`, etc.). |
| `useDocument<T>(id, options?)` | Live single-document hook. Re-subscribes when `id` changes between renders. |
| `useDocuments<T>(query, options?)` | Live list hook. Re-subscribes when the query shape changes. |
| `useDocumentByRoute<T>(path, options?)` | Live single-document lookup by URL route — for catch-all views in dynamic-routes SPAs. See Scenario D. |
| `<CurrentDocumentProvider route expand?>` + `useCurrentDocument()` | One shared current-route document for the subtree — provide once, read anywhere. References resolve by default (`$` wildcard); `expand={[]}` opts out. |
| `useMikserRoutes({ mapRoute, ... })` | Live array of React Router route objects. Pass to `useRoutes()` or `createBrowserRouter()`. |
| `generateMikserRoutes({ mapRoute, ... })` | Build-time one-shot enumerator. Right for Vite SSG / Next static export. |
| `useMikserStatus({ timeoutMs? })` | Reactive backend status — `'connecting' \| 'ready' \| 'unreachable'`. Use for connection guards. |
| `<HrefIndexProvider>` + `useHref(lang?)` | Multilingual href abstraction — logical references resolve to per-locale URLs. |
| `useAlternates({ route, languages? })` | Alternates for hreflang tags and language switchers. |
| `<AssetIndexProvider>` + `useAsset()` | Build preset-derivative URLs; look up managed asset entities. |
| `createCache(entities)` | Framework-agnostic load-once request cache — dedupe + memoize over `list()`, keyed by the whole query (`expand` included). Create one, share it. |
| `useCached(cache, query)` / `useCachedDocument(cache, href, { expand })` | Reactive reads of a `createCache` instance. The lightweight tier next to `useDocument` — load-once for content read often, changed rarely. |
| `<MikserVectorProvider client>` + `useMikserVectorClient()` | Bridges `mikser-io-sdk-vector` into React context. |
| `useSimilar<T>(store, query, options?)` | Live semantic search with debounce + stale-result discard. |

## Scenarios — picking the right shape for your project

Four common shapes. Each makes a different trade between SEO, build complexity, and catalog scale. Pick before you start; mixing them mid-project is painful.

> ### 📦 Runnable starter projects
>
> Each scenario ships as a complete starter under [`examples/`](./examples) — Vite config, `package.json`, full source tree, its own README explaining how to run it. Clone and modify rather than translate the snippets below into project structure.
>
> | Folder | What's in it |
> |---|---|
> | **[`examples/mikser-content`](./examples/mikser-content)** | **The shared content server** — a standalone mikser project that supplies the catalog to the three React apps below. Start it first. |
> | **[`examples/pure-spa`](./examples/pure-spa)** (scenario A) | Vite + React + `useMikserRoutes` against your own router |
> | **[`examples/dynamic-spa`](./examples/dynamic-spa)** (scenario D) | Same shape as `pure-spa` but with a catch-all `<Route path="*">` + `useDocumentByRoute` |
> | **[`examples/hybrid-ssg`](./examples/hybrid-ssg)** (scenario B) | Manifest-based public build (`generateMikserRoutes`) + a live editor SPA from one catalog |
> | **[`examples/islands`](./examples/islands)** (scenario C) | Multi-entry Vite build, React islands mounting onto mikser-rendered HTML |

### A) Pure SPA — runtime everything, live everywhere

**When:** Editor UIs, admin dashboards, internal apps. SEO doesn't matter. You want the fastest dev loop and the lowest build complexity.

**How it works:** No build-time route enumeration. The app constructs its own router (React Router), then wires `useMikserRoutes` against it to slot catalog routes in alongside the hand-coded ones. Editing a document → SSE event → routes array re-renders → UI updates. No rebuild ever.

Two integration patterns, both supported by the same `useMikserRoutes` hook:

#### `useRoutes` (recommended — no router teardown on catalog changes)

```jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider, useMikserRoutes } from 'mikser-io-sdk-react'
import DocumentPage from './DocumentPage'
import NotFound from './NotFound'

// One client. data.catalog pulls the static snapshot the data plugin
// writes (out/data/sitemap.json) on first paint, then live SSE keeps
// it current. No second API endpoint.
const documents = createClient({ baseUrl: import.meta.env.VITE_MIKSER_URL })
    .entities('public', { data: { catalog: 'sitemap', entities: 'page' } })

function Routes() {
    // Reads the default client from MikserProvider. First paint loads
    // from the static snapshot; SSE deltas keep it current.
    const routes = useMikserRoutes({
        mapRoute: document => ({
            path: document.meta.route,
            element: <DocumentPage entityId={document.id} />,
        }),
        notFoundElement: <NotFound />,
    })
    return useRoutes(routes)
}

createRoot(document.getElementById('root')).render(
    <MikserProvider client={documents}>
        <BrowserRouter>
            <Routes />
        </BrowserRouter>
    </MikserProvider>,
)
```

#### `createBrowserRouter` (data routers — loaders, actions)

```jsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useMemo } from 'react'
import { useMikserRoutes } from 'mikser-io-sdk-react'

function Routes() {
    const routes = useMikserRoutes({ mapRoute: document => ({ /* ... */ }) })
    const router = useMemo(() => createBrowserRouter(routes), [routes])
    return <RouterProvider router={router} />
}
```

Note: the data-router variant tears down router state on every catalog change. Prefer the first pattern unless you specifically need loaders / actions on dynamic routes.

#### The matching server config

The `out/data/sitemap.json` snapshot is produced by the `data` plugin's `catalog` config on the mikser side:

```js
// mikser-content/mikser.config.js  (server side)
{
    plugins: ['documents', 'front-matter', 'plugin-schemas', 'data', 'api'],
    data: {
        catalog: {
            // out/data/sitemap.json — every published, component-having
            // document, projected to just the routing fields.
            sitemap: {
                query: e =>
                    e.type === 'document' &&
                    e.meta?.published &&
                    e.meta?.component,
                pick: ['id', 'destination', 'meta.component', 'meta.route', 'meta.title'],
            },
        },
        entities: {
            // out/data/<entity.name>.page.json — one file per published
            // document, with full content. useDocument(id) reads from
            // these on first paint; live updates still flow over SSE.
            page: {
                query: e => e.type === 'document' && e.meta?.published,
                pick: ['id', 'meta', 'content'],
            },
        },
    },
    api: {
        endpoints: {
            public: {
                query: e => e.type === 'document' && e.meta?.published,
                operations: ['list', 'subscribe'],
                cache: true,
            },
        },
    },
}
```

Dispatch in `mapRoute` is on `meta.component`, not `meta.layout` — `layout` stays reserved for mikser's SSG render pipeline so the two never collide.

**Trade-offs:** Fastest to set up. Worst for SEO (the public-facing HTML is empty until JS loads). Initial boot pays the snapshot fetch (~50-200ms typical, CDN-cacheable).

> **📦 Full starter project:** **[`examples/pure-spa`](./examples/pure-spa)** — clone, `npm install`, set `VITE_MIKSER_URL`, `npm run dev`.

---

### B) Hybrid — SSG for public, SPA-with-live for editor

**When:** Marketing sites, blogs, documentation, any content site that needs SEO. The typical agency project.

**The idea:** Two builds from the same content. The public deploy is a manifest-driven SPA (one JS bundle that reads `routes.json` and renders client-side) or full-HTML prerender via [`vite-react-ssg`](https://github.com/kingyue737/vite-react-ssg). The editor / admin app is the SPA from scenario A, talking to the same mikser server. Both share the same `mapRoute` function, so they agree on what a route is.

**Build script** — runs in CI before the production build:

```js
// scripts/generate-routes.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from 'mikser-io-sdk-api'
import { generateMikserRoutes } from 'mikser-io-sdk-react'

const MIKSER_URL = process.env.MIKSER_URL || 'http://localhost:3001'

// Same single client as the runtime editor. data.catalog points at the
// static snapshot the data plugin writes — generateMikserRoutes
// consults it before falling back to a fresh list() call.
const client = createClient({ baseUrl: MIKSER_URL })
    .entities('public', { data: { catalog: 'sitemap', entities: 'page' } })

const routes = (await generateMikserRoutes({
    client,
    mapRoute: document => ({
        path:      document.meta.route,
        component: document?.meta?.component ?? 'page',
        id:        document.id,
        title:     document?.meta?.title ?? '',
    }),
})).filter(Boolean)

mkdirSync(resolve('src/generated'), { recursive: true })
writeFileSync(
    resolve('src/generated/routes.json'),
    JSON.stringify(routes, null, 2),
)

console.log(`Generated ${routes.length} routes → src/generated/routes.json`)
```

**Public entry** — reads the manifest, no `list()` call at boot:

```jsx
// src/main.public.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import routesManifest from './generated/routes.json'
import { viewForComponent } from './route-mapping.jsx'

const documents = createClient({ baseUrl: import.meta.env.VITE_MIKSER_URL })
    .entities('public')

function PublicRoutes() {
    const routes = routesManifest.map(r => {
        const View = viewForComponent[r.component] ?? viewForComponent.page
        return { path: r.path, element: <View id={r.id} /> }
    })
    return useRoutes(routes)
}

createRoot(document.getElementById('app')).render(
    <MikserProvider client={documents}>
        <BrowserRouter>
            <PublicRoutes />
        </BrowserRouter>
    </MikserProvider>,
)
```

**Editor app** — separate entry point, uses scenario A (`useMikserRoutes` + live composables). Mounted under `/admin/*` or on a different domain. Stays live always.

```
project/
  src/
    main.public.jsx    ← reads generated/routes.json, no SSE
    main.editor.jsx    ← uses createMikserRoutes (live)
    route-mapping.jsx  ← shared viewForComponent + mapRoute
  scripts/
    generate-routes.mjs ← run before vite build
```

**Trade-offs:** Two entry points, two build steps, slightly more wiring. In exchange: SEO-correct, CDN-friendly public deploy + live editor preview from the same content source. For full HTML prerender (not just manifest-driven SPA), swap the public side to `vite-react-ssg` — the manifest + route-mapping pieces stay the same.

> **📦 Full starter project:** **[`examples/hybrid-ssg`](./examples/hybrid-ssg)** — the load-bearing file is `src/route-mapping.jsx`, shared between three consumers (build script, public entry, editor entry).

---

### C) Mikser-rendered HTML + React islands

**When:** Content-heavy sites where most pages are pure content (mikser renders them perfectly) but a few features need interactivity (search box, contact form, filters, live counts).

**The idea:** Mikser is responsible for the HTML. React is just an enhancement layer that mounts onto specific DOM nodes the server-rendered HTML emits. No React Router involved — the URLs are real URLs served as static files.

**Public site:** `mikser build` produces `out/`. Deploy `out/` as static. The HTML includes mount points for the React islands:

```html
<!-- documents/en/search.md → rendered via layouts/page.html.hbs -->
<article>
    <h1>{{meta.title}}</h1>
    <div id="search-island" data-endpoint="public"></div>
</article>
```

**Island bundle:** A tiny multi-entry Vite build, one entry per island. Each entry finds its mount node, reads `data-*` attributes for config, mounts React:

```jsx
// src/islands/search.jsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider, useDocuments } from 'mikser-io-sdk-react'

function Search({ endpoint }) {
    const [q, setQ] = React.useState('')
    const { documents } = useDocuments({
        filter: q ? { 'meta.title': { $regex: q, $options: 'i' } } : {},
        fields: ['id', 'meta.title', 'meta.summary', 'meta.route'],
        limit: 10,
    })
    return (
        <div>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" />
            <ul>
                {documents.map(d => (
                    <li key={d.id}><a href={d.meta?.route}>{d.meta?.title}</a></li>
                ))}
            </ul>
        </div>
    )
}

// Mount on every #search-island the page has
document.querySelectorAll('[id^="search-island"]').forEach(el => {
    const documents = createClient({ baseUrl: '/' })   // same-origin
        .entities(el.dataset.endpoint)
    createRoot(el).render(
        <MikserProvider client={documents}>
            <Search endpoint={el.dataset.endpoint} />
        </MikserProvider>,
    )
})
```

**Trade-offs:** Best performance (static HTML + small React bundle, lazy-loaded). Simplest deployment (just files). But React doesn't own routing — the URL structure is mikser's responsibility.

> **📦 Full starter project:** **[`examples/islands`](./examples/islands)** — search, booking, cart-counter islands plus a simulated mikser-rendered HTML page showing where they mount.

---

### D) Dynamic routes — for catalogs too big to enumerate

**When:** A content catalog past the ~5k–10k route mark where loading every route into a snapshot at boot stops making sense — large blogs, e-commerce catalogs, knowledge bases, document archives.

**The idea:** Stop enumerating routes. Install **one** catch-all pattern in React Router; resolve the document at navigation time via `useDocumentByRoute(path)`. The api plugin's per-query disk cache turns each unique route into an on-demand static file: the first user hits mikser, subsequent users get the cached response served by the reverse proxy. Effectively per-route ISR with no extra config.

```jsx
// main.jsx — note no data.catalog, no useMikserRoutes
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider } from 'mikser-io-sdk-react'
import App from './App.jsx'

const documents = createClient({ baseUrl: import.meta.env.VITE_MIKSER_URL })
    .entities('public')

createRoot(document.getElementById('root')).render(
    <MikserProvider client={documents}>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </MikserProvider>,
)
```

```jsx
// App.jsx
import { Routes, Route } from 'react-router-dom'
import Home from './views/Home.jsx'
import Search from './views/Search.jsx'
import DocumentResolver from './views/DocumentResolver.jsx'

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            {/* Single catch-all for everything content-backed */}
            <Route path="*" element={<DocumentResolver />} />
        </Routes>
    )
}
```

```jsx
// views/DocumentResolver.jsx
import { useLocation } from 'react-router-dom'
import { useDocumentByRoute } from 'mikser-io-sdk-react'
import ArticleView from './ArticleView.jsx'
import ProductView from './ProductView.jsx'
import PageView    from './PageView.jsx'
import NotFound    from './NotFound.jsx'

const views = { article: ArticleView, product: ProductView, page: PageView }

export default function DocumentResolver() {
    const { pathname } = useLocation()
    const { document, loading } = useDocumentByRoute(pathname)

    if (loading) return <p>Loading…</p>
    if (!document) return <NotFound />
    const View = views[document.meta?.component] ?? PageView
    return <View entityId={document.id} />
}
```

**How the caching works.** `useDocumentByRoute` issues a request like `GET /api/public/entities?meta.route=/en/about&meta.published=true&limit=1&cache=4f3a2c1d8e9b6f7a`. The SDK appends `cache=<sha256-prefix>` automatically — the same hash the server uses for the on-disk filename. With `cache: true` on the public endpoint, mikser writes the response to `out/api/public/entities/4f3a2c1d8e9b6f7a.json`. The standard nginx config (`try_files /api/public/entities/$arg_cache.json @proxy`; see [mikser-io's caching docs](https://github.com/almero-digital-marketing/mikser-io/blob/main/documentation/caching.md)) serves the file directly on subsequent requests via the client-provided hint, no Lua needed:

- **First visitor to a route:** SDK → mikser → response served + written to disk
- **Every subsequent visitor:** SDK → proxy serves the cached file (mikser idle)
- **Catalog change:** entire cache directory cleared, re-warms on demand

Effectively per-route ISR — the cache is built by real user traffic.

**Trade-offs:** First paint on a cold route pays one API roundtrip — slower than scenario A's pre-loaded snapshot for routes you've never visited, faster than A's initial snapshot fetch for repeat visits to cached routes. Doesn't scale down well to small catalogs (you're paying the resolver tax for routes you could have enumerated for free) but scales up beautifully — works the same at 10k routes as at 10M.

When to pick D over A: roughly when `/data/sitemap.json` would emit more than ~1–2 MB, or you have more than ~5k routes. The snapshot is dragging first paint down more than the resolver does.

> **📦 Full starter project:** **[`examples/dynamic-spa`](./examples/dynamic-spa)** — same shape as `pure-spa` but with the catch-all pattern wired up. Compare them side-by-side to see the diff.

---

### Picking between them

| Question | A (SPA) | B (Hybrid SSG) | C (Islands) | D (Dynamic SPA) |
|---|---|---|---|---|
| Do you need SEO? | No | **Yes** | **Yes** | No |
| Is most of the page interactive? | **Yes** | Maybe | No | **Yes** |
| Is content mostly static? | No | Yes | **Yes** | No |
| Editor + admin in same app? | **Yes** | Editor is the SPA half | Separate admin app | **Yes** |
| Build complexity tolerance | Low | Medium | Low | Low |
| Mikser plugins (post-pdf, post-mjml) used? | No | Maybe | **Yes** | No |
| Catalog size | < 5k routes | any | any | > 5k routes |

**Rule of thumb for an agency client site:** start with **C** (islands) for the public site if the content is mostly static, **B** (hybrid SSG) if there's significant interactivity, **A** (pure SPA) only for the admin app. Pick **D** when A would otherwise be your choice but the catalog is past the snapshot ceiling. A/D and B/C often coexist in the same project — the admin is always SPA-shaped; the public face is the project-by-project decision.

### When to use which hook

| Hook | Best for | Avoid when |
|---|---|---|
| `client.list()` directly | Build-time, SSR (no live updates needed) | Component that needs to react to changes |
| `useDocument()` / `useDocuments()` | Components in any scenario | Plain Node scripts (use the SDK directly) |
| `useCached()` / `useCachedDocument()` | Read-often, change-rarely content — system docs, nav, settings. Load-once, expand-capable | Anything that has to stay live (use `useDocument` / `useDocuments`) |
| `useDocumentByRoute()` | Scenario D catch-all view — resolve the current path to a document | Scenarios A/B (you have the entity id; use `useDocument`) |
| `<CurrentDocumentProvider>` / `useCurrentDocument()` | Scenario A — share the current route's document across a view's subtree (head + body + media) | A single catch-all view (use `useDocumentByRoute`) |
| `live()` underneath all three | Always — they wrap it | — |
| `useMikserRoutes` | Scenarios A or B (editor app) — your router, mikser slots in | Scenarios C (no router), D (catch-all only) |
| `generateMikserRoutes` | Scenario B (build step) | Scenarios A, C, D |
| `useHref` + `useAsset` | Any scenario with React components | Mikser-rendered HTML (use the render-href plugin server-side instead) |

## The current-route document

In a per-route SPA (Scenario A) most routes render one document end-to-end — the `<head>`, the body, the media. `<CurrentDocumentProvider>` loads it once for the current route and shares it with the subtree; any child reads it with `useCurrentDocument()`. (This is the per-route-components counterpart to `useDocumentByRoute`, which serves the single catch-all view of Scenario D.)

```jsx
import { useLocation } from 'react-router-dom'
import { CurrentDocumentProvider, useCurrentDocument } from 'mikser-io-sdk-react'

function App() {
  const location = useLocation()          // inside <BrowserRouter>
  return (
    <CurrentDocumentProvider route={location.pathname} expand={[]}>
      <Head />        {/* reads document.meta.head — plain fields, no refs */}
      <Routes>{/* … */}</Routes>
    </CurrentDocumentProvider>
  )
}

function Head() {
  const { document } = useCurrentDocument()
  // …
}
```

### Who owns the references

A document carries `$`-keyed references — a `$video`, a `$hero`, a list of `$related`. Resolving them is [`expand`'s](#references--inline-expansion) job, and **the default is the `$` wildcard**: omit `expand` and the document arrives with every reference resolved. But the root provider serves the `<head>` and plain-field readers and wraps *every* route — resolving there makes the login form expand the product videos it never renders. So the root opts **out** with `expand={[]}`, and each view that renders references provides its **own** current-route document (default `['$']`), which shadows the root for its subtree:

```jsx
function Home() {                     // renders the presentation + FAQ videos
  const location = useLocation()
  return (
    <CurrentDocumentProvider route={location.pathname}>   {/* default expand: ['$'] */}
      <HomeContent />
    </CurrentDocumentProvider>
  )
}
```

The principle: **a document doesn't know its consumers, so the consumer declares what to resolve** — not the document (different views of the same doc want different shapes), not the route table, not one app-level provider (it resolves for routes that render nothing). The view that renders the references owns the `expand`. `['$']` is the default because *resolved* is the common case; `[]` is the opt-out for the plain-field path.

A one-line wrapper keeps the `useLocation` plumbing out of every view:

```jsx
// RouteDocument.jsx
import { useLocation } from 'react-router-dom'
import { CurrentDocumentProvider } from 'mikser-io-sdk-react'

export const RouteDocument = ({ expand, children }) => {
  const location = useLocation()
  return (
    <CurrentDocumentProvider route={location.pathname} expand={expand}>
      {children}
    </CurrentDocumentProvider>
  )
}
// <RouteDocument expand={[]}> at the root; <RouteDocument> around a ref-rendering view.
```

## Multilingual `useHref` / `useAlternates`

### The pattern, and why it matters

In a multilingual site the *same* logical page exists at different URLs per language: `/about` is served at `/en/about` and `/fr/a-propos`. Hard-coding those URLs into links couples every component to the routing scheme and breaks the moment a translation's slug changes.

`useHref` decouples the two. You link to a **logical reference** (`/about`) and the SDK resolves it to the **deployed URL** for the current (or requested) language. The mapping comes from three front-matter fields on each document:

| Front-matter field | Meaning | Example |
|---|---|---|
| `meta.href` | The logical reference — identical across all translations of a page | `/about` |
| `meta.lang` | Which language this particular document represents | `en` |
| `meta.route` | The actual deployed URL — what `useHref` returns | `/en/about` |

`<HrefIndexProvider>` builds a live `href → { lang → url }` index from the catalog (kept current via SSE). `useHref(lang)` reads it. Resolution falls back gracefully: requested language → `default` bucket → any available language → the input reference unchanged (so a broken reference stays visible rather than silently becoming `undefined`).

```jsx
import { HrefIndexProvider, useHref, useAlternates } from 'mikser-io-sdk-react'
import { useLocation, Link } from 'react-router-dom'

function App() {
    return (
        <MikserProvider client={documents}>
            <HrefIndexProvider defaultLang="en">
                <Nav />
            </HrefIndexProvider>
        </MikserProvider>
    )
}

function Nav() {
    const { href } = useHref('en')
    return <Link to={href('/about')}>About</Link>
}

function LanguageSwitcher() {
    const { pathname } = useLocation()
    const { alternates } = useAlternates({
        route: pathname,
        languages: ['en', 'fr', 'bg'],
    })
    return alternates.map(({ lang, url }) =>
        <a key={lang} href={url}>{lang}</a>
    )
}

function Hreflang() {
    const { pathname } = useLocation()
    const { alternates } = useAlternates({ route: pathname })   // no `languages` → only real translations
    return alternates.map(({ lang, url }) =>
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
    )
}
```

The `languages` option toggles two behaviours:

- **Omitted** — `alternates` contains only languages that *actually exist* for the current page. Right for SEO `hreflang` tags: don't advertise translations you don't have.
- **Provided** (an array) — `alternates` contains one entry per requested language, falling back through `href()`'s resolution chain when a real translation is missing. Right for a language switcher: show every locale the app supports, even if a given page isn't translated yet.

In both cases the current page's own language is excluded from `alternates` (it's what `current` is for).

## Asset resolution

mikser's `assets()` plugin is a *preset transcoder* (video, image, pdf, audio…), not an image pipeline — so the SDK's asset helpers are format-neutral. `useAsset()` returns `{ url, asset, index }`.

### `url(ref)` — the primary helper

Joins a deployed served path to the client base. The engine stamps URLs into entity meta — a served file carries its path at `meta.url`, a media source carries its transcoded-derivative paths at `meta.presets.<name>` — and the catalog surfaces them via `expand`. `url(ref)` takes one of those base-relative served paths and joins it to the base, bound automatically from the installed client. One rule for files and derivatives alike: no client-side `/assets/<preset>/<source>` construction. It's pure: no `<AssetIndexProvider>` needed, just call `useAsset().url(...)`.

`watchAssetFallbacks()` is also re-exported here — a dev-mode detector that flags served URLs which resolve to the SPA index fallback (a typo'd path, a missing derivative) instead of failing loudly. Call it once at boot, guarded so it ships nothing to production: `if (import.meta.env.DEV) watchAssetFallbacks()`.

`useUnmatchedRouteWarning({ routes, pathname, matched })` is the routing-side detector: when `useRoutes` returns null the page goes blank with only a terse react-router warning. Catalog routes live at their (often localized) `meta.route`, so reaching for the canonical href as a path misses — pass the routing signals and it warns with the path, resolving the real route when a route carries `id: document.meta.href`. Decoupled from react-router (kept an optional peer), so you hand it `pathname` (from `useLocation`) and `matched` (e.g. `useRoutes(routes) != null`) rather than the SDK importing the router.

```jsx
import { useAsset } from 'mikser-io-sdk-react'

function Clip({ clip }) {
    const { url } = useAsset()
    return (
        <video
            src={url(clip.meta.url)}
            poster={url(clip.meta.presets.poster)}
        />
    )
}
```

### `asset(ref)` — managed-entity lookup

Format-neutral: returns `{ url, meta } | null` for a managed asset *entity* looked up by id. `meta` is the entity's raw meta block (opaque: mime, dimensions, duration — whatever the preset emitted). It only resolves inside `<AssetIndexProvider>` (otherwise returns null).

```jsx
import { AssetIndexProvider, useAsset } from 'mikser-io-sdk-react'

function App() {
    return (
        <MikserProvider client={documents}>
            <AssetIndexProvider>
                <Hero />
            </AssetIndexProvider>
        </MikserProvider>
    )
}

function Hero() {
    const { asset } = useAsset()
    const hero = asset('/assets/hero.jpg')
    if (!hero) return null
    return <img src={hero.url} alt={hero.meta?.alt} />
}
```

Image-specific rendering (`srcSet`, `<img>` props) is a consumer concern: read `meta` where you actually know an asset is an image. `<AssetIndexProvider>` is needed **only** for `asset(ref)` entity lookups — `url()` works without it.

## References & inline expansion

Reference fields written as `$author: /authors/dick` (per [ADR-0007](https://github.com/almero-digital-marketing/mikser-io/blob/main/documentation/decisions/0007-references-declaration-and-expansion.md)) arrive on the wire as bare href strings — `document.meta.author === '/authors/dick'`. Two ways to turn them into entity objects, picked by whether you want the deep data to stay live.

**Chained `useDocument`** — each level stays live independently. Updates to the author propagate without re-fetching the article. Best when both layers update independently.

```jsx
const { document: article } = useDocument(id)
const { document: author }  = useDocument(article?.meta.author)
// article.meta.author → '/authors/dick'  (string)
// author.meta.name    → 'Dick Marinov'
```

**`expand` on `useDocument` / `useDocuments`** — the initial snapshot arrives with refs already resolved to entity objects. Best when you'd otherwise pay N round-trips on first paint (a multi-hop chain like `author.organization`, or arrays of refs like `sections.*.image`).

```jsx
import { useDocument } from 'mikser-io-sdk-react'

function ArticleWithAuthor({ id }) {
    // One round-trip: article + author + author.organization + hero,
    // all inlined and ready to render.
    const { document: article } = useDocument(id, {
        expand: ['author.organization', 'hero'],
    })
    if (!article) return null

    return (
        <article>
            <h1>{article.meta.title}</h1>
            <p>
                By {article.meta.author.meta.name}
                {' — '}
                {article.meta.author.meta.organization.meta.name}
            </p>
            <img src={article.meta.hero.meta.url} alt={article.meta.hero.meta.alt} />
        </article>
    )
}
```

For lists:

```jsx
import { useDocuments } from 'mikser-io-sdk-react'

function ArticlesByAuthor({ authorId }) {
    // All articles by this author with each article's hero inlined.
    const { documents: articles } = useDocuments({
        filter: { 'meta.component': 'article', 'meta.author': authorId },
        sort:   { 'meta.date': -1 },
        expand: ['hero'],
    })

    return (
        <ul>
            {articles.map(a => (
                <li key={a.id}>
                    {a.meta.hero && (
                        <img src={a.meta.hero.meta.url} alt={a.meta.hero.meta.alt} />
                    )}
                    <h2>{a.meta.title}</h2>
                </li>
            ))}
        </ul>
    )
}
```

**Path forms:** dot-notation walks expanded entities (`author.organization`); `*` iterates `$`-keyed arrays (`sections.*.image`); both canonical (`$author`) and normalized (`author`) segments are accepted.

**Server caps** default to `maxDepth: 5`, `maxPaths: 20`, `maxResolved: 100` per request — configurable via `catalog.expand.{...}` in `mikser.config.js`. Exceeding any cap surfaces as a `MikserError` with `status === 422` on the underlying call.

**SSE deltas stay expanded.** Both the initial snapshot AND every forward update emit fully-expanded entities. The api plugin's subscribe handler registers an engine-level `runtime.refs.subscribeGraph` against the subscription's filter + expand; mutations to *any* entity within the expansion graph (the root, the author, the author's organization, …) trigger a re-emit with the freshly-resolved tree. Reactive consumers see consistent expanded data across the lifetime of the subscription.

For ad-hoc one-shot reads that don't need to participate in the SSE subscription — sitemap builders, SSG enumeration, AI agent calls — drop to the underlying `mikser-io-sdk-api` client:

```jsx
import { useMikserClient } from 'mikser-io-sdk-react'
const client = useMikserClient()
const { items } = await client.entities('public').list({
    filter: { id },
    expand: ['author.organization', 'hero'],
})
```

Missing targets or cycles silently leave the ref as a string at the deepest position — same convention as the underlying api, per ADR-0007 B6.

## Cached reads — `createCache` + `useCached` / `useCachedDocument`

`useDocument` / `useCurrentDocument` are the always-fresh tier: every hook holds an SSE subscription, every upstream edit re-renders. That's the right default for content that changes while someone's looking at it — articles, lists, anything an editor is touching.

For content that's read on every page but changes rarely — system docs, nav, settings, a footer block — the live tier is overkill. `createCache` is the lightweight tier next to it: load each query **once**, memoize the result, dedupe concurrent calls. No subscription, no re-fetch until you explicitly `invalidate`.

The cache instance is framework-agnostic — it's `createCache` re-exported straight from `mikser-io-sdk-api`, a dedupe + memoize layer over `list()` with `get` / `peek` / `has` / `invalidate` / `subscribe`. You create **one** and share it (module scope, or React context). React reads state through hooks, so the reactive surface is `useCached` / `useCachedDocument` — they trigger the load once per query and re-render when the entry lands or is invalidated (built on `useSyncExternalStore`).

```jsx
import { createCache, useCachedDocument } from 'mikser-io-sdk-react'

// Once — module scope (or a context value). Pass the entities client.
const content = createCache(client.entities('public'))

function Products() {
    const doc = useCachedDocument(content, '/system/products', {
        expand: ['products.*.video'],
    })
    if (!doc) return null
    return <ProductGrid items={doc.meta.products} />
}
```

- **`useCached(cache, query)`** — the general form. Pass any `list()` query; returns the envelope (`{ items, ... }`) or `undefined` until the first load resolves. Triggers the load once per distinct query.
- **`useCachedDocument(cache, href, { expand } = {})`** — convenience for doc-by-logical-ref: queries `meta.href === href` with `limit: 1` and returns the doc (`items[0]`) or `null`.
- **The cache key folds in `expand`.** A doc fetched with `expand` is a *distinct* entry from the same doc fetched without — they don't collide, and the expanded one stays expanded for the life of the cache. `cacheKey(query)` is exported if you need the key directly.

Because there's no subscription, the cache is the cheaper tier when both would work. Reach for `useDocument` / `useDocuments` when the data has to stay live; reach for `createCache` when "load it once and keep it" is the honest description of the access pattern. When the underlying content does change, call `content.invalidate(query)` (or `invalidate()` for everything) and the next read re-fetches.

## Semantic search — `MikserVectorProvider` + `useSimilar`

Bridges `mikser-io-sdk-vector` into React. Separate provider from `MikserProvider` so projects that don't need search don't have to install `mikser-io-sdk-vector`. The hook handles debounce + stale-result discard so a fast-typing user doesn't see older results clobber newer ones.

```jsx
// main.jsx — install the vector provider alongside the documents one
import { createClient as createVectorClient } from 'mikser-io-sdk-vector'
import { MikserVectorProvider } from 'mikser-io-sdk-react'

const similar = createVectorClient({ url: 'http://localhost:3001' })

function App() {
    return (
        <MikserProvider client={docs}>
            <MikserVectorProvider client={similar}>
                <SearchBox />
            </MikserVectorProvider>
        </MikserProvider>
    )
}
```

```jsx
// SearchBox.jsx
import { useState } from 'react'
import { useSimilar } from 'mikser-io-sdk-react'

function SearchBox() {
    const [query, setQuery] = useState('')
    const { results, loading } = useSimilar('documents', query, {
        limit:     10,
        debounce:  200,    // ms after the last keystroke before firing
        minLength: 2,      // skip the request below this length
    })

    return (
        <div>
            <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
            />
            {loading && <p>Searching…</p>}
            <ul>
                {results.map((hit) => (
                    <li key={hit.id}>
                        <a href={hit.id}>{hit.data?.title}</a>
                        <small>distance: {hit.distance.toFixed(3)}</small>
                    </li>
                ))}
            </ul>
        </div>
    )
}
```

- **`loading`** flips true only while a request is in flight, not during the debounce wait. Right for spinner state, not placeholder state.
- **`error`** is populated when `findSimilar()` rejects. Branch on it for a fallback UI.
- **`refresh()`** forces a fresh request against the current query — useful after the vector store has been updated server-side.

`mikser-io-sdk-vector` is an **optional** runtime dependency — this SDK doesn't import it. Install only if you use semantic search:

```bash
npm install mikser-io-sdk-vector
```

The hit shape is generic on the embedded payload:

```ts
type ProductHit = { title: string; sku: string; price: number }
const { results } = useSimilar<ProductHit>('products', query)
//        ↑ results[0].data is typed ProductHit
```

## TypeScript

The hooks are generic on the entity type:

```ts
import type { MetaByLayout } from '../mikser-content/entities'   // emitted by mikser-io-schemas

type Article = { id: string; meta: MetaByLayout<'article'> }

const { document } = useDocument<Article>(id)
// document.meta.title  ← typed
```

`mikser-io-sdk-api` provides the `EntitiesClient`, `Filter`, and `ListQuery` types out of the box. Pair with [`mikser-io-schemas`](https://github.com/almero-digital-marketing/mikser-io-schemas) for entity meta types generated from Zod schemas.

## Design notes

A few React-specific choices worth knowing:

- **`useDocument(id)` takes a raw value, not a getter.** React re-runs hooks on every render, so the current `id` value is always fresh — pass `useDocument(props.id)` directly. The subscription re-establishes via a `useEffect` dependency on `id`.
- **`useDocuments(query)` keys re-subscription on the query *shape*, not identity.** The hook computes a stable signature from `filter` / `sort` / `fields` / `limit` / `skip`, so passing a freshly-constructed object literal each render doesn't churn the SSE subscription. You don't need to `useMemo` the query.
- **`useMikserRoutes` returns an array, not a router.** React Router v7 consumes a routes array (`useRoutes(routes)`), so the SDK hands you exactly that and lets you decide how to mount it. With `useRoutes` there's no router teardown when the catalog changes — routes are added and removed in place.

## Examples

Full runnable examples live in [`examples/`](./examples):

| Example | Shows |
|---|---|
| [`mikser-content/`](./examples/mikser-content) | The shared mikser server that feeds the apps. Run it first. |
| [`pure-spa/`](./examples/pure-spa) | Runtime-everything SPA — `useMikserRoutes`, `useDocuments`, live updates. |
| [`hybrid-ssg/`](./examples/hybrid-ssg) | Static public build (`generateMikserRoutes`) + a live editor SPA from one catalog. |
| [`islands/`](./examples/islands) | mikser owns the HTML; React mounts into specific DOM nodes. |

See [`examples/README.md`](./examples/README.md) for the run order.

## License

MIT
