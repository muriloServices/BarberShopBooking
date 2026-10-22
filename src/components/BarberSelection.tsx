import type { Barber, DateAvailability } from '../types/booking'

type BarberSelectionProps = {
  date: string
  availability: DateAvailability | null
  isLoading: boolean
  selectedBarberId: string | null
  onChangeDate: () => void
  onSelectBarber: (id: string) => void
  onContinue: () => void
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

export function BarberSelection({
  date,
  availability,
  isLoading,
  selectedBarberId,
  onChangeDate,
  onSelectBarber,
  onContinue,
}: BarberSelectionProps) {
  const chosenBarber: Barber | undefined = availability?.barbers.find(
    (barber) => barber.id === selectedBarberId,
  )

  return (
    <section className="barber-card" aria-labelledby="barber-title">
      <div className="selected-date-bar">
        <div>
          <p className="section-kicker">YOUR SELECTED DATE</p>
          <h2>{formatDate(date)}</h2>
        </div>
        <button className="text-button" type="button" onClick={onChangeDate}>
          <span aria-hidden="true">←</span> Go back
        </button>
      </div>
      <div className="barber-body">
        <p className="section-kicker">STEP 2 OF 3</p>
        <h2 id="barber-title">Which barber would you like to book?</h2>

        {isLoading && (
          <div className="status-panel" role="status">
            <span className="loader" aria-hidden="true" />
            Checking the studio schedule…
          </div>
        )}
        {!isLoading && availability?.status === 'unresolved' && (
          <div className="status-panel status-warning" role="status">
            <span className="status-icon" aria-hidden="true">!</span>
            <span>{availability.message}</span>
          </div>
        )}
        {!isLoading && availability?.status === 'available' && availability.barbers.length === 0 && (
          <div className="status-panel" role="status">
            <span className="status-icon" aria-hidden="true">–</span>
            <span>No bookable barbers are available on this date. Choose another day to keep looking.</span>
          </div>
        )}
        {!isLoading && availability?.status === 'available' && availability.barbers.length > 0 && (
          <div className="barber-list" aria-label="Bookable barbers">
            {availability.barbers.map((barber) => (
              <button
                type="button"
                className={`barber-option ${selectedBarberId === barber.id ? 'barber-selected' : ''}`}
                key={barber.id}
                aria-pressed={selectedBarberId === barber.id}
                onClick={() => onSelectBarber(barber.id)}
              >
                <span className="barber-avatar" aria-hidden="true">{barber.name.slice(0, 1).toUpperCase()}</span>
                <span className="barber-details">
                  <strong>{barber.name}</strong>
                  <span>No blocking exception for your selected date</span>
                </span>
                <span className="selection-indicator" aria-hidden="true">
                  {selectedBarberId === barber.id ? '✓' : ''}
                </span>
              </button>
            ))}
          </div>
        )}
        {chosenBarber && (
          <p className="selection-confirmation" role="status">
            {chosenBarber.name} selected.
          </p>
        )}
        {chosenBarber && (
          <button className="submit-booking" type="button" onClick={onContinue}>
            Choose a time
          </button>
        )}
        {availability?.status === 'available' && availability.warning && (
          <p className="data-warning">{availability.warning}</p>
        )}
      </div>
    </section>
  )
}
