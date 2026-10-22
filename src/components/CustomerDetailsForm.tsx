import type { FormEvent } from 'react'
import type { TimeSlot } from '../types/booking'

type CustomerDetailsFormProps = {
  date: string
  barberName: string
  slot: TimeSlot
  onBack: () => void
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

export function CustomerDetailsForm({
  date,
  barberName,
  slot,
  onBack,
}: CustomerDetailsFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <section className="barber-card" aria-labelledby="customer-title">
      <div className="selected-date-bar">
        <div>
          <p className="section-kicker">APPOINTMENT DETAILS</p>
          <h2>{formatDate(date)} · {slot.label}</h2>
        </div>
        <button className="text-button" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Go back
        </button>
      </div>
      <div className="barber-body">
        <p className="section-kicker">STEP 4 OF 4</p>
        <h2 id="customer-title">Your contact details</h2>
        <p className="availability-note">{barberName} · 1-hour appointment</p>

        <form className="customer-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="name" type="text" autoComplete="name" required maxLength={120} />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required maxLength={254} />
          </label>
          <label>
            Phone number
            <input name="phone" type="tel" autoComplete="tel" required maxLength={40} />
          </label>
          <p className="form-error" role="status">
            Booking submission is disabled until secure Firestore rules and a trusted booking backend are configured.
          </p>
          <button className="submit-booking" type="submit" disabled>
            Booking request unavailable
          </button>
        </form>
      </div>
    </section>
  )
}
