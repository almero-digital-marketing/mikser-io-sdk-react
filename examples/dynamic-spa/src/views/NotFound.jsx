import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="not-found">
      <h1>404</h1>
      <p>This page does not exist.</p>
      <Link to="/">Go home</Link>
    </section>
  )
}
