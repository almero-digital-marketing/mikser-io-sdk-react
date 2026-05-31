import { createRoot } from 'react-dom/client'
import CartCounter from '../components/CartCounter.jsx'

// The cart island is a self-contained interactive widget — it doesn't
// read from mikser, so no provider is needed. Just mount.
export function mountCart(selector = '[data-island="cart"]') {
  for (const el of document.querySelectorAll(selector)) {
    const props = { ...el.dataset }
    createRoot(el).render(<CartCounter {...props} />)
  }
}
