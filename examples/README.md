# Examples

This folder contains runnable examples that show how to use **`mikser-io-sdk-react`** end to end, from a running mikser backend to three different rendering strategies.

## Projects

| Project | What it shows |
| --- | --- |
| [`mikser-content/`](./mikser-content/) | The shared mikser backend: documents, schemas, layouts, and lifecycle. Run this first. |
| [`pure-spa/`](./pure-spa/) | Runtime-everything SPA. Routes, views, and live updates all resolved in the browser. |
| [`hybrid-ssg/`](./hybrid-ssg/) | Static public build + live editor SPA from one catalog. |
| [`islands/`](./islands/) | mikser owns the HTML; React mounts into specific DOM nodes. |

## Prerequisites

- Node 18+
- A running mikser backend (see [`mikser-content/`](./mikser-content/)) on `http://localhost:3001`

## Run order

```bash
# 1. Start the mikser backend (shared content)
cd mikser-content
npm install
npm run dev

# 2. In another terminal, run any of the example apps
cd pure-spa      # or hybrid-ssg, or islands
npm install
npm run dev
```

For `hybrid-ssg`, generate the static route manifest first, then run the public build or the live editor:

```bash
cd hybrid-ssg
npm install
npm run generate      # build the route manifest from the catalog
npm run build:public  # static public build
npm run dev:editor    # live editor SPA
```

## Environment

All apps read the mikser backend URL from `VITE_MIKSER_URL` (and `MIKSER_URL` for build scripts), defaulting to `http://localhost:3001`.

Each app is independent: its own `package.json`, its own `vite.config.js`, its own `README.md`.

## Notes

- The examples import from the local `mikser-io-sdk-react` package (workspace), so changes to the SDK are reflected immediately.
- The shared content lives in `mikser-content/` and is consumed by all three apps.
