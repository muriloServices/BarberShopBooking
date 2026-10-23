import { useEffect, useState, type CSSProperties } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { BarberSelection } from '../components/BarberSelection'
import { BookingCalendar } from '../components/BookingCalendar'
import { CustomerDetailsForm } from '../components/CustomerDetailsForm'
import { TimeSlotSelection } from '../components/TimeSlotSelection'
import { getDateAvailability } from '../services/availabilityService'
import { getBusinessShops } from '../services/businessShopService'
import { getBusinessHoursRecords } from '../services/businessHoursService'
import { storage } from '../lib/firebase'
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
  const [bookingImageUrl, setBookingImageUrl] = useState<string | null>(null)
  const [closedDays, setClosedDays] = useState<number[] | null>(null)
  const [workingDaysError, setWorkingDaysError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadBusinessDetails() {
      try {
        const businesses = await getBusinessShops()
        const routeSlug = window.location.pathname.split('/').filter(Boolean).at(-1)?.toLowerCase() ?? ''
        const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')
        const business = businesses.find((candidate) =>
          (candidate.slug && normalize(candidate.slug) === normalize(routeSlug)) ||
          normalize(candidate.name) === normalize(routeSlug),
        ) ?? (businesses.length === 1 ? businesses[0] : undefined)

        if (!business) {
          if (!cancelled) {
            setWorkingDaysError('Could not identify this shop. Date selection is unavailable.')
          }
          console.error('Could not identify the business for this booking page.')
          return
        }

        if (business.imageUrl) {
          try {
            const imageUrl = business.imageUrl.startsWith('gs://')
              ? await getDownloadURL(ref(storage, business.imageUrl))
              : business.imageUrl
            if (!cancelled) setBookingImageUrl(imageUrl)
          } catch (error) {
            console.error('Could not load the business booking background image.', error)
          }
        } else {
          console.warn(`BusinessShop/${business.id} has no imageUrl configured.`)
        }

        try {
          const hours = await getBusinessHoursRecords()
          const businessHours = hours.find((record) => record.businessShopId === business.id)
          if (!businessHours) {
            if (!cancelled) {
              setWorkingDaysError(`Business hours are not configured for ${business.name}.`)
            }
            console.error(`Business hours are not configured for ${business.name}.`)
            return
          }
          if (!cancelled) {
            setClosedDays(businessHours.closedDays)
            setWorkingDaysError(null)
          }
        } catch (error) {
          if (!cancelled) {
            setWorkingDaysError('Could not load shop working days. Date selection is unavailable.')
          }
          console.error('Could not load business working days.', error)
        }
      } catch (error) {
        if (!cancelled) {
          setWorkingDaysError('Could not load shop working days. Date selection is unavailable.')
        }
        console.error('Could not load business booking details.', error)
      }
    }

    void loadBusinessDetails()
    return () => {
      cancelled = true
    }
  }, [])

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
    if (
      date < today ||
      closedDays === null ||
      closedDays.includes(new Date(`${date}T12:00:00.000Z`).getUTCDay())
    ) return
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
    <main
      className="booking-shell"
      style={bookingImageUrl
        ? { '--booking-image': `url("${bookingImageUrl}")` } as CSSProperties
        : undefined}
    >
      <div className="booking-panel">
        <div className="booking-content">
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
            closedDays={closedDays}
            workingDaysError={workingDaysError}
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
            resourceId={chosenBarber.id}
            resourceEmail={chosenBarber.emailResource}
            businessId={chosenBarber.BusinessId}
            timeZone={timeZone}
            slot={selectedSlot}
            onBack={() => setFlowStep('time')}
          />
        )}
        </div>

        <footer className="site-footer">
          <span>Simple Booking · Ring Barber Shop</span>
        </footer>
      </div>
    </main>
  )
}
