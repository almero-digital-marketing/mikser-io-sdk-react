import { mountSearch } from './islands/search.jsx'
import { mountCart } from './islands/cart.jsx'
import { mountBooking } from './islands/booking.jsx'

// mikser owns the page HTML. We find each [data-island] node and mount the
// matching React component into it — independent roots, not one app root.
// Data attributes on the node are passed in as props.
mountSearch()
mountCart()
mountBooking()
