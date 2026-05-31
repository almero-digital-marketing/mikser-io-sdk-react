# mikser-io-sdk-react

React 18+ / 19+ hooks and router integration for a [mikser-io](https://github.com/almero-digital-marketing/mikser-io) server. Pairs with [`mikser-io-sdk-api`](https://github.com/almero-digital-marketing/mikser-io-sdk-api) — that package handles the transport (HTTP + SSE); this one wraps it in React idioms.

## Install

```bash
npm install mikser-io-sdk-react mikser-io-sdk-api
```

Peer deps: `react` ^18 or ^19. `react-router-dom` is optional — needed only if you use `useMikserRoutes`.

## Quick start

```jsx
import { createClient } from 'mikser-io-sdk-api'
import { MikserProvider, useDocument } from 'mikser-io-sdk-react'

const docs = createClient({ url: 'http://localhost:3001' }).entities('public')

function App() {
    return (
        <MikserProvider client={docs}>
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
| `<HrefIndexProvider>` + `useHref(lang?)` | Multilingual href abstraction — same pattern as `mikser-io-sdk-vue`. |
| `useAlternates({ route, languages? })` | Alternates for hreflang tags and language switchers. |
| `<AssetIndexProvider>` + `useAsset()` | Resolve asset references to URL + dimensions + srcset. |

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
        mapRoute: doc => ({
            path: doc.meta.route,
            element: <DocumentPage entityId={doc.id} />,
        }),
        notFoundElement: <NotFound />,
    })
    return useRoutes(routes)
}

export default function App() {
    return (
        <MikserProvider client={docs}>
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
    const routes = useMikserRoutes({ mapRoute: doc => ({ /* ... */ }) })
    const router = useMemo(() => createBrowserRouter(routes), [routes])
    return <RouterProvider router={router} />
}
```

Note: the data-router variant tears down router state on every catalog change. Prefer the first pattern unless you specifically need loaders / actions on dynamic routes.

## Multilingual `useHref` / `useAlternates`

Same pattern as `mikser-io-sdk-vue`'s [`useHref()`](https://github.com/almero-digital-marketing/mikser-io-sdk-vue#multilingual-href--providehrefindex--usehref) — front-matter convention identical (`meta.href`, `meta.lang`, `meta.route`), resolution identical, fallback chain identical.

```jsx
import { HrefIndexProvider, useHref, useAlternates } from 'mikser-io-sdk-react'
import { useLocation, Link } from 'react-router-dom'

function App() {
    return (
        <MikserProvider client={docs}>
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

The `languages` option is the same toggle as in the Vue SDK: omitted means "only languages that actually exist" (right for SEO tags); provided means "every language in the list, falling back via href()" (right for switchers).

## Asset resolution

```jsx
import { AssetIndexProvider, useAsset } from 'mikser-io-sdk-react'

function App() {
    return (
        <MikserProvider client={docs}>
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

## TypeScript

The hooks are generic on the entity type:

```ts
import type { MetaByLayout } from '../mikser-content/entities'   // emitted by mikser-io-schemas

type Article = { id: string; meta: MetaByLayout<'article'> }

const { document } = useDocument<Article>(id)
// document.meta.title  ← typed
```

`mikser-io-sdk-api` provides the `EntitiesClient`, `Filter`, and `ListQuery` types out of the box. Pair with [`mikser-io-schemas`](https://github.com/almero-digital-marketing/mikser-io-schemas) for entity meta types generated from Zod schemas.

## Differences from `mikser-io-sdk-vue`

The shape is intentionally parallel, with three React-idiomatic deltas:

1. **`<MikserProvider>` replaces `app.use(createMikserPlugin(...))`** — React Context instead of Vue's provide/inject. Same role, idiomatic shape.
2. **`useMikserRoutes` replaces `createMikserRouter`** — React Router v6+ takes a routes array and `useRoutes(routes)` does the matching. No need for an imperative router instance with `addRoute` / `removeRoute`; the array IS the router input. Cleaner integration; no teardown on catalog changes.
3. **`useDocument(id)` takes a raw `id`, not a Ref / getter** — React re-runs hooks on render, so passing the current id value works the same way a Vue `Ref` would. Pass `useDocument(props.id)` directly.

Everything else — `useDocument`, `useDocuments`, `useHref`, `useAlternates`, `useAsset` — has the same return shape and the same options as the Vue SDK.

## License

MIT
