type BookingCalendarProps = {
  today: string
  visibleMonth: Date
  canGoBack: boolean
  closedDays: number[] | null
  workingDaysError: string | null
  onChangeMonth: (offset: number) => void
  onChooseDate: (date: string) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const SUNDAY_FIRST_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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

export function BookingCalendar({
  today,
  visibleMonth,
  canGoBack,
  closedDays,
  workingDaysError,
  onChangeMonth,
  onChooseDate,
}: BookingCalendarProps) {
  const year = visibleMonth.getUTCFullYear()
  const month = visibleMonth.getUTCMonth()
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const calendarDays = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => dateKey(year, month, index + 1)),
  ]

  return (
    <section className="calendar-card" aria-labelledby="calendar-title">
      <div className="calendar-header">
        <div>
          <p className="section-kicker">YOUR VISIT</p>
          <h2 id="calendar-title">Choose a date</h2>
        </div>
        <div className="month-controls" aria-label="Calendar month navigation">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous month"
            disabled={!canGoBack}
            onClick={() => onChangeMonth(-1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <p className="month-label" aria-live="polite">
            {MONTHS[month]} {year}
          </p>
          <button
            type="button"
            className="icon-button"
            aria-label="Next month"
            onClick={() => onChangeMonth(1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <div className="calendar-grid" role="group" aria-label="Choose an appointment date">
        {WEEKDAYS.map((day) => <div className="weekday" key={day}>{day}</div>)}
        {calendarDays.map((date, index) => {
          if (!date) return <span className="calendar-blank" aria-hidden="true" key={`blank-${index}`} />
          const isPast = date < today
          const isToday = date === today
          const dayOfWeek = new Date(`${date}T12:00:00.000Z`).getUTCDay()
          const isClosed = closedDays === null || closedDays.includes(dayOfWeek)
          const unavailable = isPast || isClosed
          return (
            <button
              type="button"
              className={`date-cell ${isToday ? 'date-today' : ''} ${isClosed && closedDays !== null ? 'date-closed' : ''}`}
              key={date}
              disabled={unavailable}
              aria-label={`${formatDate(date)}${isPast ? ', unavailable' : isClosed && closedDays !== null ? ', shop closed' : ''}`}
              aria-disabled={unavailable}
              onClick={() => onChooseDate(date)}
            >
              <span>{Number(date.slice(-2))}</span>
              {isToday && !isClosed && <span className="today-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      <div className="calendar-footer">
        {workingDaysError ? (
          <p role="alert">{workingDaysError}</p>
        ) : closedDays === null ? (
          <p role="status">Loading shop working days…</p>
        ) : (
          <>
            <span className="legend-dot" aria-hidden="true" />
            <span>Today</span>
            <p>
              Closed: {closedDays.length
                ? closedDays.map((day) => SUNDAY_FIRST_WEEKDAYS[day]).join(', ')
                : 'none'}.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
