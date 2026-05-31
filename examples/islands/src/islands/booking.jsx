import { createRoot } from 'react-dom/client'
import BookingForm from '../components/BookingForm.jsx'

// The booking island is a self-contained form — no mikser provider
// needed.
export function mountBooking(selector = '[data-island="booking"]') {
  for (const el of document.querySelectorAll(selector)) {
    const props = { ...el.dataset }
    createRoot(el).render(<BookingForm {...props} />)
  }
}
