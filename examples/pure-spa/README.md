# pure-spa

Runtime-everything single-page app built on **`mikser-io-sdk-react`**.

Routes, views, and content are all resolved in the browser at runtime. There is no build step that bakes in content; everything comes live from the mikser backend.

## What it shows

- `useMikserRoutes` to build a live React Router route array from the mikser catalog
- `useRoutes` (React Router v6) to render the live route array
- A `route-mapping` module that maps `meta.layout` to a view component
- Views for each layout: `page`, `article`, `product`, `landing`
- Live updates: edit content in mikser and the SPA reflects it without a reload

## Run

```bash
npm install
npm run dev
```

The app reads `VITE_MIKSER_URL` (default `http://localhost:3001`).

## How it works

1. `main.jsx` creates a mikser client and wraps the app in `MikserProvider` and `BrowserRouter`.
2. `App.jsx` calls `useMikserRoutes` to get a live route array and renders it with `useRoutes`.
3. Each catalog entry's `meta.layout` selects a view via `route-mapping.jsx`, which returns `{ path, element }`.
4. Layout views receive the document `id` as a prop and use `useDocument(id)` to fetch and subscribe.
5. Index views (`Home`, `ArticleIndex`, `ProductIndex`) use `useDocuments` to query collections.
6. When content changes in mikser, the SDK pushes updates and the views re-render.

## Takeaway

A SPA can defer everything — routing and content — to runtime. The mikser catalog is the single source of truth, and the SDK keeps the browser in sync live.
