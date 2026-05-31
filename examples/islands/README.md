# islands

mikser owns the HTML; **`mikser-io-sdk-react`** mounts interactive React components into specific DOM nodes ("islands").

This is the progressive-enhancement model: the page is server-rendered HTML from mikser, and you sprinkle interactivity only where you need it.

## What it shows

- Mounting React roots into arbitrary DOM nodes (`createRoot` per node, not a single app root)
- Multiple independent islands on one page
- Reading mikser content from inside an island
- Passing data from HTML (`data-*` attributes) into a React island as props

## Islands

| Mount point | Component | What it does |
| --- | --- | --- |
| `[data-island="search"]` | `SearchBox` | Live search over mikser documents |
| `[data-island="cart"]` | `CartCounter` | Client-side cart counter (reads `data-initial`) |
| `[data-island="booking"]` | `BookingForm` | Booking form with validation |

## Run

```bash
npm install
npm run dev
```

Open the example page that mikser would serve:

```
http://localhost:5173/example-page.html
```

The app reads `VITE_MIKSER_URL` (default `http://localhost:3001`).

## How it works

1. `main.jsx` calls the per-island mount functions in `src/islands/`.
2. Each mount function finds its `[data-island]` nodes and calls `createRoot(el).render(...)`.
3. Islands that need the catalog (`SearchBox`) get wrapped in their own `MikserProvider` with a dedicated mikser client. Islands that don't (`CartCounter`, `BookingForm`) skip the provider entirely.
4. HTML `data-*` attributes are spread onto the component as props.

## Takeaway

You do not need to own the whole page. mikser renders the document; React enhances just the interactive nodes. Each island is isolated, with its own root and (only when needed) its own client.
