import { useState } from 'react'

export default function BookingForm() {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const valid = name.trim() !== '' && date !== ''

  function handleSubmit(event) {
    event.preventDefault()
    if (!valid) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p className="booking__ok">
        Thanks, {name}! Booked for {date}.
      </p>
    )
  }

  return (
    <form className="booking" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          type="text"
        />
      </label>
      <label>
        Date
        <input
          value={date}
          onChange={(event) => setDate(event.target.value)}
          type="date"
        />
      </label>
      <button type="submit" disabled={!valid}>
        Book
      </button>
    </form>
  )
}
