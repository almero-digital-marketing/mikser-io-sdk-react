# hybrid-ssg

Static public site + live editor SPA, both built from a single mikser catalog using **`mikser-io-sdk-react`**.

This shows how one content source can power two very different delivery modes:

- **Public**: pre-generated static routes for fast, cacheable delivery.
- **Editor**: a runtime SPA that resolves everything live for instant preview while editing.

## What it shows

- `generateMikserRoutes` to produce a static route manifest at build time
- A runtime editor app that uses `useMikserRoutes` + `useRoutes` for live preview
- Sharing views between the static build and the live editor
- One catalog, two delivery strategies

## Layout

```
scripts/generate-routes.mjs   # build-time route generation (generateMikserRoutes)
src/main.public.jsx           # public entry (static-oriented)
src/main.editor.jsx           # editor entry (runtime SPA)
src/App.public.jsx            # public shell (rehydrates the manifest)
src/App.editor.jsx            # editor shell (live updates via useMikserRoutes)
src/route-mapping.jsx         # layout → view component
src/views/                    # shared views (ArticleView, PageView)
vite.config.public.js
vite.config.editor.js
index.html                    # public entry html
index.editor.html             # editor entry html
```

## Run

```bash
# Generate the static route manifest from the catalog
npm run generate

# Public static build
npm run build:public

# Editor SPA (live)
npm run dev:editor
```

## Env

`MIKSER_URL` (build/scripts) and `VITE_MIKSER_URL` (runtime), default `http://localhost:3001`.

## Takeaway

The public build freezes the route list at build time for cacheable, fast delivery, while the editor resolves routes live for instant feedback. Both share the same views and the same catalog — only the route source differs.
