import { useEffect, useState } from 'react'
import { getTimeSlotAvailability } from '../services/timeSlotService'
import type { TimeSlot, TimeSlotAvailability } from '../types/booking'

type TimeSlotSelectionProps = {
  date: string
  resourceId: string
  timeZone: string
  onBack: () => void
  onChooseSlot: (slot: TimeSlot) => void
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

export function TimeSlotSelection({
  date,
  resourceId,
  timeZone,
  onBack,
  onChooseSlot,
}: TimeSlotSelectionProps) {
  const [availability, setAvailability] = useState<TimeSlotAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getTimeSlotAvailability(date, resourceId, timeZone)
      .then((result) => {
        if (!cancelled) setAvailability(result)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [date, resourceId, timeZone])

  return (
    <section className="barber-card" aria-labelledby="time-title">
      <div className="selected-date-bar">
        <div>
          <p className="section-kicker">YOUR SELECTED DATE</p>
          <h2>{formatDate(date)}</h2>
        </div>
        <button className="text-button" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Go back
        </button>
      </div>
      <div className="barber-body">
        <p className="section-kicker">STEP 3 OF 4</p>
        <h2 id="time-title">Choose a time</h2>
        <p className="availability-note">
          One-hour appointments. Last reservation starts at 19:00 (finishes at 20:00).
        </p>

        {isLoading && (
          <div className="status-panel" role="status">
            <span className="loader" aria-hidden="true" />
            Checking available hours…
          </div>
        )}
        {!isLoading && availability?.status === 'unresolved' && (
          <div className="status-panel status-warning" role="alert">{availability.message}</div>
        )}
        {!isLoading && availability?.status === 'available' && (
          <>
            <div className="time-slot-grid" aria-label="Appointment start times">
              {availability.slots.map((slot) => (
                <button
                  type="button"
                  className="time-slot"
                  key={slot.startAt}
                  disabled={!slot.available}
                  aria-label={`${slot.label}${slot.available ? ', available' : ', unavailable'}`}
                  onClick={() => onChooseSlot(slot)}
                >
                  {slot.label}
                </button>
              ))}
            </div>
            {availability.slots.every((slot) => !slot.available) && (
              <div className="status-panel" role="status">
                No hours are available for this barber on the selected date. Choose another date or barber.
              </div>
            )}
            {availability.warning && <p className="data-warning">{availability.warning}</p>}
          </>
        )}
      </div>
    </section>
  )
}
