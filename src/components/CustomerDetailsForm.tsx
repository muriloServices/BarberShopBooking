import { useState, type FormEvent } from 'react'
import { createConfirmedBooking, validateCustomerDetails } from '../services/bookingService'
import { getTimeSlotAvailability } from '../services/timeSlotService'
import type { TimeSlot } from '../types/booking'

type CustomerDetailsFormProps = {
  date: string
  barberName: string
  resourceId: string
  resourceEmail?: string
  businessId?: string
  timeZone: string
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
  resourceId,
  resourceEmail,
  businessId,
  timeZone,
  slot,
  onBack,
}: CustomerDetailsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!businessId) {
      setError('This barber is not linked to a business and cannot accept bookings yet.')
      return
    }
    const form = new FormData(event.currentTarget)
    const customerName = String(form.get('name') ?? '')
    const customerEmail = String(form.get('email') ?? '')
    const customerPhone = String(form.get('phone') ?? '')
    try {
      setIsSubmitting(true)
      validateCustomerDetails(customerName, customerEmail, customerPhone)
      const availability = await getTimeSlotAvailability(date, resourceId, timeZone)
      if (availability.status !== 'available') {
        setError(availability.message || 'Could not check this appointment time.')
        return
      }
      if (!availability.slots.some((candidate) => candidate.startAt === slot.startAt && candidate.available)) {
        setError('That time is no longer available. Please choose another time.')
        return
      }
      const id = await createConfirmedBooking({
        resourceId,
        resourceEmail,
        BusinessId: businessId,
        customerName,
        customerEmail,
        customerPhone,
        startAt: slot.startAt,
        endAt: slot.endAt,
      })
      setBookingId(id)
    } catch (submitError) {
      const code = typeof submitError === 'object' && submitError !== null && 'code' in submitError
        ? submitError.code
        : undefined
      setError(code === 'already-exists'
        ? 'That time has just been booked. Please choose another time.'
        : code === 'permission-denied'
          ? 'Firestore denied this booking. Confirm the deployed rules allow public Booking reads and creates.'
          : submitError instanceof Error ? submitError.message : 'Could not create the booking.')
    } finally {
      setIsSubmitting(false)
    }
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

        {bookingId ? (
          <div className="success-message" role="status">
            <h3>Booking confirmed</h3>
          </div>
        ) : (
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
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              maxLength={40}
              inputMode="tel"
              placeholder="+351 912 345 678"
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="submit-booking" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </form>
        )}
      </div>
    </section>
  )
}
