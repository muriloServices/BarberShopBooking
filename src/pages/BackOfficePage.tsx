import { useEffect, useState, type FormEvent } from 'react'
import { observeAdminAuth, signInAdmin, signOutAdmin } from '../services/adminAuthService'
import {
  createUnavailability,
  deleteUnavailability,
  getBackOfficeData,
  type ReservationRecord,
  type UnavailabilityRecord,
} from '../services/backOfficeService'
import { createBookableResource } from '../services/resourceService'
import type { BookableResource } from '../types/booking'
import type { BusinessShop } from '../types/firestore'

type BackOfficeData = {
  reservations: ReservationRecord[]
  unavailability: UnavailabilityRecord[]
  resources: BookableResource[]
  businesses: BusinessShop[]
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return value || 'Not provided'
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: import.meta.env.VITE_BUSINESS_TIME_ZONE || 'Europe/Lisbon',
  }).format(date)
}

function dateInTimeZone(date: Date, timeZone: string) {
  if (!Number.isFinite(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return `${values.year}-${values.month}-${values.day}`
}

function shiftDate(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`
}

function formatSelectedDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

function firestoreError(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined
  if (code === 'permission-denied') {
    return 'Firestore denied access. Confirm this account has the admin custom claim and that your rules grant admin access.'
  }
  return error instanceof Error ? error.message : 'The backoffice request failed.'
}

export function BackOfficePage() {
  const [authState, setAuthState] = useState<'checking' | 'signed-out' | 'not-admin' | 'admin'>('checking')
  const [authError, setAuthError] = useState<string | null>(null)
  const [data, setData] = useState<BackOfficeData | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingBlock, setIsSavingBlock] = useState(false)
  const [blockMessage, setBlockMessage] = useState<string | null>(null)
  const [blockError, setBlockError] = useState<string | null>(null)
  const [isSavingBarber, setIsSavingBarber] = useState(false)
  const [barberMessage, setBarberMessage] = useState<string | null>(null)
  const [barberError, setBarberError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'reservations' | 'barbers' | 'blocking'>('reservations')
  const [reservationBarberFilter, setReservationBarberFilter] = useState('')
  const timeZone = import.meta.env.VITE_BUSINESS_TIME_ZONE || 'Europe/Lisbon'
  const [today] = useState(() => dateInTimeZone(new Date(), timeZone))
  const [reservationDate, setReservationDate] = useState(today)

  useEffect(() => observeAdminAuth((user, isAdmin) => {
    setAuthState(!user ? 'signed-out' : isAdmin ? 'admin' : 'not-admin')
  }, (error) => {
    setAuthError(error.message)
    setAuthState('signed-out')
  }), [])

  async function loadData() {
    setIsLoading(true)
    setDataError(null)
    try {
      setData(await getBackOfficeData())
    } catch (error) {
      setDataError(firestoreError(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (authState !== 'admin') return
    let cancelled = false
    getBackOfficeData()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((error: unknown) => {
        if (!cancelled) setDataError(firestoreError(error))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authState])

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthError(null)
    const form = new FormData(event.currentTarget)
    try {
      await signInAdmin(String(form.get('email') ?? ''), String(form.get('password') ?? ''))
      setAuthState('admin')
    } catch (error) {
      setAuthError(firestoreError(error))
    }
  }

  async function handleCreateBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBlockError(null)
    setBlockMessage(null)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      setIsSavingBlock(true)
      await createUnavailability({
        resourceId: String(form.get('resourceId') ?? ''),
        startDate: String(form.get('startDate') ?? ''),
        startTime: String(form.get('startTime') ?? ''),
        endDate: String(form.get('endDate') ?? ''),
        endTime: String(form.get('endTime') ?? ''),
        reason: String(form.get('reason') ?? ''),
        timeZone,
      })
      formElement.reset()
      setBlockMessage('Unavailability block saved.')
      await loadData()
    } catch (error) {
      setBlockError(firestoreError(error))
    } finally {
      setIsSavingBlock(false)
    }
  }

  async function handleCreateBarber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBarberError(null)
    setBarberMessage(null)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      setIsSavingBarber(true)
      await createBookableResource({
        name: String(form.get('name') ?? ''),
        BusinessId: String(form.get('BusinessId') ?? ''),
      })
      formElement.reset()
      setBarberMessage('Barber added successfully.')
      await loadData()
    } catch (error) {
      setBarberError(firestoreError(error))
    } finally {
      setIsSavingBarber(false)
    }
  }

  const filteredReservations = (data?.reservations ?? [])
    .filter((reservation) =>
      dateInTimeZone(new Date(reservation.startAt), timeZone) === reservationDate &&
      (!reservationBarberFilter || reservation.resourceId === reservationBarberFilter),
    )
    .sort((left, right) => left.startAt.localeCompare(right.startAt))
  const selectedDateLabel = reservationDate === today
    ? 'Today'
    : reservationDate === shiftDate(today, 1)
      ? 'Tomorrow'
      : formatSelectedDate(reservationDate)

  return (
    <main className="backoffice-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Simple Booking home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SIMPLE<span className="brand-subtitle">BACK OFFICE</span></span>
        </a>
        <a className="text-button" href="/ringbarbershop">← Customer booking</a>
      </header>

      <div className="backoffice-content">
        <p className="eyebrow">STAFF AREA · {timeZone}</p>
        <h1>Back office</h1>

        {authState === 'checking' && <p role="status">Checking administrator access…</p>}
        {authState === 'signed-out' && (
          <section className="backoffice-card">
            <h2>Administrator sign in</h2>
            <p>Use a Firebase Authentication account with the admin custom claim.</p>
            <form className="customer-form" onSubmit={handleSignIn}>
              <label>Email<input name="email" type="email" autoComplete="username" required /></label>
              <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
              {authError && <p className="form-error" role="alert">{authError}</p>}
              <button className="submit-booking" type="submit">Sign in</button>
            </form>
          </section>
        )}
        {authState === 'not-admin' && (
          <section className="backoffice-card" role="alert">
            <h2>Administrator access required</h2>
            <p>This Firebase account does not have the `admin: true` custom claim.</p>
            <button className="submit-booking" type="button" onClick={() => void signOutAdmin()}>Sign out</button>
          </section>
        )}
        {authState === 'admin' && (
          <>
            <div className="backoffice-toolbar">
              <p>Signed in as administrator</p>
              <div>
                <button className="backoffice-button" type="button" onClick={() => void loadData()} disabled={isLoading}>
                  {isLoading ? 'Refreshing…' : 'Refresh'}
                </button>
                <button className="backoffice-button" type="button" onClick={() => void signOutAdmin()}>Sign out</button>
              </div>
            </div>

            {dataError && <p className="form-error" role="alert">{dataError}</p>}
            {isLoading && !data && <p role="status">Loading backoffice data…</p>}

            <nav className="backoffice-tabs" role="tablist" aria-label="Back office sections">
              <button type="button" role="tab" aria-selected={activeTab === 'reservations'} onClick={() => setActiveTab('reservations')}>
                Reservations
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'barbers'} onClick={() => setActiveTab('barbers')}>
                Barbers
              </button>
              <button type="button" role="tab" aria-selected={activeTab === 'blocking'} onClick={() => setActiveTab('blocking')}>
                Block slots
              </button>
            </nav>

            {activeTab === 'reservations' && (
              <section className="backoffice-card" role="tabpanel">
                <h2>Reservations</h2>
                <div className="reservation-day-nav">
                  <button
                    className="backoffice-button"
                    type="button"
                    aria-label="Previous day"
                    onClick={() => setReservationDate((date) => shiftDate(date, -1))}
                  >
                    ←
                  </button>
                  <div className="reservation-day-heading">
                    <strong>{selectedDateLabel}</strong>
                    <span>{formatSelectedDate(reservationDate)}</span>
                  </div>
                  <button
                    className="backoffice-button"
                    type="button"
                    aria-label="Next day"
                    onClick={() => setReservationDate((date) => shiftDate(date, 1))}
                  >
                    →
                  </button>
                  <label className="reservation-date-picker">
                    <span className="visually-hidden">Choose reservation date</span>
                    <input
                      type="date"
                      value={reservationDate}
                      onChange={(event) => setReservationDate(event.target.value)}
                    />
                  </label>
                  {reservationDate !== today && (
                    <button className="backoffice-button" type="button" onClick={() => setReservationDate(today)}>
                      Today
                    </button>
                  )}
                </div>
                <p className="reservation-day-count">
                  {filteredReservations.length} {filteredReservations.length === 1 ? 'booking' : 'bookings'}
                  {reservationBarberFilter
                    ? ` · ${data?.resources.find((resource) => resource.id === reservationBarberFilter)?.name ?? 'Selected barber'}`
                    : ''}
                </p>
                <label className="reservation-filter">
                  Filter by barber
                  <select
                    value={reservationBarberFilter}
                    onChange={(event) => setReservationBarberFilter(event.target.value)}
                  >
                    <option value="">All barbers</option>
                    {data?.resources.map((resource) => (
                      <option value={resource.id} key={resource.id}>{resource.name}</option>
                    ))}
                  </select>
                </label>
                {filteredReservations.length === 0 && <p>No bookings for {selectedDateLabel.toLowerCase()}.</p>}
                <div className="reservation-calendar-list">
                  {filteredReservations.map((reservation) => {
                    const barber = data?.resources.find((resource) => resource.id === reservation.resourceId)
                    const startTime = new Date(reservation.startAt)
                    const endTime = new Date(reservation.endAt)
                    return (
                      <article className="reservation-item" key={reservation.id}>
                        <div className="reservation-time">
                          <strong>{Number.isNaN(startTime.getTime()) ? '—' : new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(startTime)}</strong>
                          <span>{Number.isNaN(endTime.getTime()) ? '' : new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone }).format(endTime)}</span>
                        </div>
                        <div className="reservation-customer">
                          <strong>{reservation.customerName || 'Unknown customer'}</strong>
                          <span>{barber?.name ?? (reservation.resourceId || 'No barber assigned')}</span>
                        </div>
                        <div>
                          {reservation.customerEmail && <span>{reservation.customerEmail}</span>}
                          {reservation.customerPhone && <span>{reservation.customerPhone}</span>}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            {activeTab === 'barbers' && (
              <section className="backoffice-card" role="tabpanel">
                <h2>Barbers ({data?.resources.length ?? 0})</h2>
                <p>Add a barber to make them available for customer bookings.</p>
                {data?.resources.length === 0 && <p>No barbers found.</p>}
                <div className="reservation-list">
                  {data?.resources.map((resource) => (
                    <article className="reservation-item barber-admin-item" key={resource.id}>
                      <div><strong>{resource.name}</strong></div>
                      <div><span>{data.businesses.find((business) => business.id === resource.BusinessId)?.name || 'No business linked'}</span></div>
                    </article>
                  ))}
                </div>
                <h3 className="backoffice-subheading">Add a barber</h3>
                {data?.businesses.length === 0 && <p className="form-error">Create a business before adding a barber.</p>}
                <form className="customer-form" onSubmit={handleCreateBarber}>
                  <label>Barber name<input name="name" type="text" required maxLength={120} /></label>
                  <label>Business
                    <select name="BusinessId" required defaultValue="">
                      <option value="" disabled>Select a business</option>
                      {data?.businesses.map((business) => (
                        <option value={business.id} key={business.id}>{business.name}</option>
                      ))}
                    </select>
                  </label>
                  {barberError && <p className="form-error" role="alert">{barberError}</p>}
                  {barberMessage && <p className="success-message" role="status">{barberMessage}</p>}
                  <button className="submit-booking" type="submit" disabled={isSavingBarber || !data?.businesses.length}>
                    {isSavingBarber ? 'Adding barber…' : 'Add barber'}
                  </button>
                </form>
              </section>
            )}

            {activeTab === 'blocking' && (
              <section className="backoffice-card" role="tabpanel">
                <h2>Block slots</h2>
                <p>Block a barber’s availability for a selected date and time. Times use {timeZone}.</p>
                {data?.resources.length === 0 && <p>No bookable resources were found.</p>}
                <form className="customer-form block-form" onSubmit={handleCreateBlock}>
                  <label>Barber
                    <select name="resourceId" required defaultValue="">
                      <option value="" disabled>Select a barber</option>
                      {data?.resources.map((resource) => (
                        <option value={resource.id} key={resource.id}>{resource.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>Start date<input name="startDate" type="date" required /></label>
                  <label>Start time<input name="startTime" type="time" required /></label>
                  <label>End date<input name="endDate" type="date" required /></label>
                  <label>End time<input name="endTime" type="time" required /></label>
                  <label>Reason<input name="reason" type="text" maxLength={200} required /></label>
                  {blockError && <p className="form-error" role="alert">{blockError}</p>}
                  {blockMessage && <p className="success-message" role="status">{blockMessage}</p>}
                  <button className="submit-booking" type="submit" disabled={isSavingBlock || !data?.resources.length}>
                    {isSavingBlock ? 'Saving…' : 'Block slots'}
                  </button>
                </form>
                <h3 className="backoffice-subheading">Current blocked slots ({data?.unavailability.length ?? 0})</h3>
                {data?.unavailability.length === 0 && <p>No blocked slots found.</p>}
                <div className="reservation-list">
                  {data?.unavailability.map((block) => {
                    const barber = data.resources.find((resource) => resource.id === block.resourceId)
                    return (
                      <article className="reservation-item" key={block.id}>
                        <div><strong>{barber?.name ?? block.resourceId}</strong><span>{block.reason || 'No reason provided'}</span></div>
                        <div><span>{formatDateTime(block.startAt)}</span><span>until {formatDateTime(block.endAt)}</span></div>
                        <button
                          className="backoffice-button"
                          type="button"
                          onClick={async () => {
                            if (!window.confirm('Remove this blocked slot?')) return
                            try {
                              await deleteUnavailability(block.id)
                              await loadData()
                            } catch (error) {
                              setDataError(firestoreError(error))
                            }
                          }}
                        >
                          Remove
                        </button>
                      </article>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
