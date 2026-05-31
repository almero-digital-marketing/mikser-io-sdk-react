import { useState } from 'react'

export default function CartCounter({ initial = '0' }) {
  const [count, setCount] = useState(Number(initial) || 0)

  return (
    <div className="cart">
      <button className="cart__btn" onClick={() => setCount((prev) => prev + 1)}>
        Add to cart
      </button>
      <span className="cart__count">{count} item(s)</span>
    </div>
  )
}
