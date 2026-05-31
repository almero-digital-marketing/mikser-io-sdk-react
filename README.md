# mikser-io-sdk-react

**Wire a React app to a [mikser-io](https://github.com/almero-digital-marketing/mikser-io) content backend in ~10 lines.** Content stays as `.md` and `.yml` files on disk — diffable, grep-able, copy-anywhere. The hooks below give you live updates over SSE, typed access to layout-shaped front-matter, multilingual URL resolution, asset metadata, and semantic search.

| What you get | Reads as |
|---|---|
| **Live content** | `const { document } = useDocument(id)` — re-renders as the file changes |
| **Live lists** | `const { documents } = useDocuments({ filter, sort, fields })` |
| **Multilingual URLs** | `href('/about')` → `/en/about` or `/fr/a-propos` per locale |
| **Hreflang + switchers** | `useAlternates({ route })` |
| **Asset metadata** | `image('/assets/hero.jpg')` → `{ src, srcSet, width, height, alt }` |
| **Semantic search** | `useSimilar(store, query)` with built-in debounce + stale-discard |
| **Live routes** | `useMikserRoutes({ mapRoute })` → array — pass to `useRoutes()` or `createBrowserRouter()` |
| **Build-time routes** | `generateMikserRoutes()` for Vite SSG / Next static export |

**Augment, don't own.** Your app stays yours. Routes are data — mikser produces them, you decide how they're mounted. Compose with your auth-gated routes, admin layouts, dashboard, anything else you already wire by hand.

**One mental model across every rendering shape** — runtime-everything SPA, hybrid (prerendered public + live admin), or mikser-rendered HTML with React islands mounted into specific DOM nodes. Same hooks, different mount. See [`examples/`](./examples) for the three patterns side-by-side.

**Typed at the seam.** Pair with [`mikser-io-plugin-schemas`](https://github.com/almero-digital-marketing/mikser-io-plugin-schemas) to author Zod schemas alongside your content; `useDocument<{ meta: MetaByLayout<'article'> }>(id)` then carries the front-matter shape straight into your JSX.

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

const documents = createClient({ url: 'http://localhost:3001' }).entities('public')

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
| `useMikserRoutes({ mapRoute, ... })` | Live array of React Router route objects. Pass to `useRoutes()` or `createBrowserRouter()`. |
| `generateMikserRoutes({ mapRoute, ... })` | Build-time one-shot enumerator. Right for Vite SSG / Next static export. |
| `<HrefIndexProvider>` + `useHref(lang?)` | Multilingual href abstraction — logical references resolve to per-locale URLs. |
| `useAlternates({ route, languages? })` | Alternates for hreflang tags and language switchers. |
| `<AssetIndexProvider>` + `useAsset()` | Resolve asset references to URL + dimensions + srcset. |
| `<MikserVectorProvider client>` + `useMikserVectorClient()` | Bridges `mikser-io-sdk-vector` into React context. |
| `useSimilar<T>(store, query, options?)` | Live semantic search with debounce + stale-result discard. |

## Router integration

Two patterns, both supported by the same `useMikserRoutes` hook:

### `useRoutes` (recommended — no router teardown on catalog changes)

```jsx
import { BrowserRouter, useRoutes } from 'react-router-dom'
import { useMikserRoutes } from 'mikser-io-sdk-react'
import DocumentPage from './DocumentPage'
import NotFound from './NotFound'

function Routes() {
    const routes = useMikserRoutes({
        mapRoute: document => ({
            path: document.meta.route,
            element: <DocumentPage entityId={document.id} />,
        }),
        notFoundElement: <NotFound />,
    })
    return useRoutes(routes)
}

export default function App() {
    return (
        <MikserProvider client={documents}>
            <BrowserRouter>
                <Routes />
            </BrowserRouter>
        </MikserProvider>
    )
}
```

### `createBrowserRouter` (data routers — loaders, actions)

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
    const { image } = useAsset()
    const props = image('/assets/hero.jpg')
    if (!props) return null
    return <img {...props} />
}
```

`image()` returns `{ src, width, height, srcSet, alt }` — React JSX prop names, so it spreads onto `<img>` directly.

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
import type { MetaByLayout } from '../mikser-content/entities'   // emitted by mikser-io-plugin-schemas

type Article = { id: string; meta: MetaByLayout<'article'> }

const { document } = useDocument<Article>(id)
// document.meta.title  ← typed
```

`mikser-io-sdk-api` provides the `EntitiesClient`, `Filter`, and `ListQuery` types out of the box. Pair with [`mikser-io-plugin-schemas`](https://github.com/almero-digital-marketing/mikser-io-plugin-schemas) for entity meta types generated from Zod schemas.

## Design notes

A few React-specific choices worth knowing:

- **`useDocument(id)` takes a raw value, not a getter.** React re-runs hooks on every render, so the current `id` value is always fresh — pass `useDocument(props.id)` directly. The subscription re-establishes via a `useEffect` dependency on `id`.
- **`useDocuments(query)` keys re-subscription on the query *shape*, not identity.** The hook computes a stable signature from `filter` / `sort` / `fields` / `limit` / `skip`, so passing a freshly-constructed object literal each render doesn't churn the SSE subscription. You don't need to `useMemo` the query.
- **`useMikserRoutes` returns an array, not a router.** React Router v6+ consumes a routes array (`useRoutes(routes)`), so the SDK hands you exactly that and lets you decide how to mount it. With `useRoutes` there's no router teardown when the catalog changes — routes are added and removed in place.
- **`useAsset().image()` returns `srcSet` (camelCase).** That's React's JSX prop name, so the result spreads straight onto `<img>`.

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
