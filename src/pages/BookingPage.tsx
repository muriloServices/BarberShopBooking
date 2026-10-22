import { useEffect, useState } from 'react'
import { BarberSelection } from '../components/BarberSelection'
import { BookingCalendar } from '../components/BookingCalendar'
import { CustomerDetailsForm } from '../components/CustomerDetailsForm'
import { TimeSlotSelection } from '../components/TimeSlotSelection'
import { getDateAvailability } from '../services/availabilityService'
import type { DateAvailability, TimeSlot } from '../types/booking'

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function todayKey(timeZone?: string) {
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(new Date())
      const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
      return `${values.year}-${values.month}-${values.day}`
    } catch {
      // An invalid timezone is surfaced as unresolved availability below.
    }
  }

  const now = new Date()
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate())
}

export function BookingPage() {
  const timeZone = import.meta.env.VITE_BUSINESS_TIME_ZONE || 'Europe/Lisbon'
  const today = todayKey(timeZone)
  const [todayYear, todayMonth] = today.split('-').map(Number)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [flowStep, setFlowStep] = useState<'date' | 'barber' | 'time' | 'details'>('date')
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const [year, month] = today.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, 1))
  })
  const canGoBack = visibleMonth.getTime() > Date.UTC(todayYear, todayMonth - 1, 1)
  const [availability, setAvailability] = useState<DateAvailability | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!selectedDate) return
    let cancelled = false
    getDateAvailability(selectedDate, timeZone)
      .then((result) => {
        if (!cancelled) setAvailability(result)
      })
      .catch(() => {
        if (!cancelled) {
          setAvailability({
            barbers: [],
            status: 'unresolved',
            message: 'We couldn’t verify availability right now. Please try again later.',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedDate, timeZone])

  function chooseDate(date: string) {
    if (date < today) return
    setIsLoading(true)
    setAvailability(null)
    setSelectedBarberId(null)
    setSelectedSlot(null)
    setFlowStep('barber')
    setSelectedDate(date)
  }

  function showCalendar() {
    setSelectedDate(null)
    setAvailability(null)
    setIsLoading(false)
    setSelectedBarberId(null)
    setSelectedSlot(null)
    setFlowStep('date')
  }

  const chosenBarber = availability?.barbers.find((barber) => barber.id === selectedBarberId)

  const currentStep = flowStep === 'date' ? 1
    : flowStep === 'barber' ? 2
      : flowStep === 'time' ? 3
        : 4

  return (
    <main className="booking-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Barber studio booking home">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>BARBER<span className="brand-subtitle">BOOKING STUDIO</span></span>
        </a>
        <div className="header-actions">
          <span className="header-note">A better cut starts here</span>
          <a className="text-button" href="/backoffice">Staff</a>
        </div>
      </header>

      <div className="booking-content">
        <div className="intro">
          <p className="eyebrow">BOOK AN APPOINTMENT</p>
          <h1>{flowStep === 'date' ? 'Make time for yourself.' : 'Book your appointment.'}</h1>
          <p className="intro-copy">
            {flowStep === 'date' && 'First, choose a day that works for you.'}
            {flowStep === 'barber' && 'Choose a barber for your selected date.'}
            {flowStep === 'time' && 'Choose an available one-hour appointment.'}
            {flowStep === 'details' && 'Add your contact details to request the booking.'}
          </p>
        </div>

        <nav className="steps" aria-label="Booking progress">
          {(['Date', 'Barber', 'Time', 'Details'] as const).map((label, index) => {
            const number = index + 1
            const complete = number < currentStep
            const current = number === currentStep
            return (
              <div className="step-item" key={label}>
                {index > 0 && <span className="step-connector" aria-hidden="true" />}
                <div className={`step ${complete ? 'step-complete' : ''} ${current ? 'step-current' : ''} ${number > currentStep ? 'step-muted' : ''}`} aria-current={current ? 'step' : undefined}>
                  <span className="step-number">{complete ? '✓' : number}</span>
                  <span>{label}</span>
                </div>
              </div>
            )
          })}
        </nav>

        {flowStep === 'date' && (
          <BookingCalendar
            today={today}
            visibleMonth={visibleMonth}
            canGoBack={canGoBack}
            onChangeMonth={(offset) => {
              setVisibleMonth((month) => new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + offset, 1)))
            }}
            onChooseDate={chooseDate}
          />
        )}
        {flowStep === 'barber' && selectedDate && (
          <BarberSelection
            date={selectedDate}
            availability={availability}
            isLoading={isLoading}
            selectedBarberId={selectedBarberId}
            onChangeDate={showCalendar}
            onSelectBarber={(id) => {
              setSelectedBarberId(id)
              setSelectedSlot(null)
            }}
            onContinue={() => {
              if (selectedBarberId) setFlowStep('time')
            }}
          />
        )}
        {flowStep === 'time' && selectedDate && selectedBarberId && (
          <TimeSlotSelection
            date={selectedDate}
            resourceId={selectedBarberId}
            timeZone={timeZone}
            onBack={() => setFlowStep('barber')}
            onChooseSlot={(slot) => {
              setSelectedSlot(slot)
              setFlowStep('details')
            }}
          />
        )}
        {flowStep === 'details' && selectedDate && selectedSlot && chosenBarber && (
          <CustomerDetailsForm
            date={selectedDate}
            barberName={chosenBarber.name}
            slot={selectedSlot}
            onBack={() => setFlowStep('time')}
          />
        )}
      </div>

      <footer className="site-footer">
        <span>Barber Studio</span>
        <span>Good hair days, made simple.</span>
      </footer>
    </main>
  )
}
