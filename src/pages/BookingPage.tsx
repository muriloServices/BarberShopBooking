import { useEffect, useState, type CSSProperties } from 'react'
import { getDownloadURL, ref } from 'firebase/storage'
import { BarberSelection } from '../components/BarberSelection'
import { BusinessLoading } from '../components/BusinessLoading'
import { BusinessNotFound } from '../components/BusinessNotFound'
import { BookingCalendar } from '../components/BookingCalendar'
import { CustomerDetailsForm } from '../components/CustomerDetailsForm'
import { TimeSlotSelection } from '../components/TimeSlotSelection'
import { getDateAvailability } from '../services/availabilityService'
import { getBusinessShopBySlug } from '../services/businessShopService'
import { getBusinessHoursRecords } from '../services/businessHoursService'
import { storage } from '../lib/firebase'
import type { DateAvailability, TimeSlot } from '../types/booking'

type BookingPageProps = {
  businessSlug: string
}

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

export function BookingPage({ businessSlug }: BookingPageProps) {
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
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false)
  const [bookingImageUrl, setBookingImageUrl] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [loadedBusinessSlug, setLoadedBusinessSlug] = useState<string | null>(null)
  const isLoadingData = loadedBusinessSlug !== businessSlug
  const [businessLoadError, setBusinessLoadError] = useState<string | null>(null)
  const [closedDays, setClosedDays] = useState<number[] | null>(null)
  const [workingDaysError, setWorkingDaysError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function resolveBusiness() {
      try {
        const businessPromise = getBusinessShopBySlug(businessSlug)
        const hoursPromise = getBusinessHoursRecords()
        const imagePromise = businessPromise.then((business) => {
          if (!business?.imageUrl) return null
          return business.imageUrl.startsWith('gs://')
            ? getDownloadURL(ref(storage, business.imageUrl))
            : business.imageUrl
        })
        const [businessResult, hoursResult, imageResult] = await Promise.allSettled([
          businessPromise,
          hoursPromise,
          imagePromise,
        ])
        if (cancelled) return

        if (businessResult.status === 'rejected') {
          setBusinessId(null)
          setBusinessName(null)
          setBookingImageUrl(null)
          setClosedDays(null)
          setWorkingDaysError(null)
          setBusinessLoadError(`Could not check whether business "${businessSlug}" exists. Please try again.`)
          console.error('Could not resolve the business slug.', businessResult.reason)
          return
        }
        const business = businessResult.value
        if (!business) {
          setBusinessId(null)
          setBusinessName(null)
          setBookingImageUrl(null)
          setClosedDays(null)
          setWorkingDaysError(null)
          setBusinessLoadError(null)
          return
        }

        setBusinessId(business.id)
        setBusinessName(business.name)
        setBusinessLoadError(null)
        if (imageResult.status === 'fulfilled') {
          setBookingImageUrl(imageResult.value)
        } else {
          setBookingImageUrl(null)
          console.error('Could not load the business booking background image.', imageResult.reason)
        }

        if (hoursResult.status === 'fulfilled') {
          const businessHours = hoursResult.value.find((record) => record.businessShopId === business.id)
          if (businessHours) {
            setClosedDays(businessHours.closedDays)
            setWorkingDaysError(null)
          } else {
            setClosedDays(null)
            setWorkingDaysError(`Business hours are not configured for ${business.name}.`)
          }
        } else {
          setClosedDays(null)
          setWorkingDaysError('Could not load shop working days. Date selection is unavailable.')
          console.error('Could not load business working days.', hoursResult.reason)
        }
      } catch (error) {
        if (!cancelled) {
          setBusinessId(null)
          setBusinessName(null)
          setBookingImageUrl(null)
          setClosedDays(null)
          setWorkingDaysError(null)
          setBusinessLoadError(`Could not check whether business "${businessSlug}" exists. Please try again.`)
        }
        console.error('Could not resolve the business slug.', error)
      } finally {
        if (!cancelled) setLoadedBusinessSlug(businessSlug)
      }
    }

    void resolveBusiness()
    return () => {
      cancelled = true
    }
  }, [businessSlug])

  useEffect(() => {
    if (!selectedDate || !businessId) return
    let cancelled = false
    getDateAvailability(selectedDate, businessId, timeZone)
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
        if (!cancelled) setIsLoadingAvailability(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedDate, businessId, timeZone])

  function chooseDate(date: string) {
    if (
      date < today ||
      closedDays === null ||
      closedDays.includes(new Date(`${date}T12:00:00.000Z`).getUTCDay())
    ) return
    setIsLoadingAvailability(true)
    setAvailability(null)
    setSelectedBarberId(null)
    setSelectedSlot(null)
    setFlowStep('barber')
    setSelectedDate(date)
  }

  function showCalendar() {
    setSelectedDate(null)
    setAvailability(null)
    setIsLoadingAvailability(false)
    setSelectedBarberId(null)
    setSelectedSlot(null)
    setFlowStep('date')
  }

  const chosenBarber = availability?.barbers.find((barber) => barber.id === selectedBarberId)

  const currentStep = flowStep === 'date' ? 1
    : flowStep === 'barber' ? 2
      : flowStep === 'time' ? 3
        : 4

  if (isLoadingData) {
    return <BusinessLoading />
  }
  if (businessLoadError) {
    return <main className="booking-shell"><p role="alert">{businessLoadError}</p></main>
  }
  if (!businessId) {
    return <BusinessNotFound businessSlug={businessSlug} />
  }

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
            isLoading={isLoadingAvailability}
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
          <span>Simple Booking · {businessName ?? 'Booking'}</span>
        </footer>
      </div>
    </main>
  )
}
