import { useEffect, useState, type FormEvent } from 'react'
import { observeAdminAuth, signInAdmin, signOutAdmin } from '../services/adminAuthService'
import {
  createUnavailability,
  deleteUnavailability,
  getBackOfficeData,
  type ReservationRecord,
  type UnavailabilityRecord,
} from '../services/backOfficeService'
import type { BookableResource } from '../types/booking'

type BackOfficeData = {
  reservations: ReservationRecord[]
  unavailability: UnavailabilityRecord[]
  resources: BookableResource[]
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
  const timeZone = import.meta.env.VITE_BUSINESS_TIME_ZONE || 'Europe/Lisbon'

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

  return (
    <main className="backoffice-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Return to booking">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>BARBER<span className="brand-subtitle">BACK OFFICE</span></span>
        </a>
        <a className="text-button" href="/">← Customer booking</a>
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

            <section className="backoffice-card">
              <h2>Reservations ({data?.reservations.length ?? 0})</h2>
              {data?.reservations.length === 0 && <p>No reservations found.</p>}
              <div className="reservation-list">
                {data?.reservations.map((reservation) => {
                  const barber = data.resources.find((resource) => resource.id === reservation.resourceId)
                  return (
                    <article className="reservation-item" key={reservation.id}>
                      <div>
                        <strong>{reservation.customerName || 'Unknown customer'}</strong>
                        <span>{barber?.name ?? (reservation.resourceId || 'No barber assigned')}</span>
                      </div>
                      <div>
                        <span>{formatDateTime(reservation.startAt)}</span>
                        {reservation.endAt && <span>until {formatDateTime(reservation.endAt)}</span>}
                      </div>
                      <div>
                        {reservation.customerEmail && <span>{reservation.customerEmail}</span>}
                        {reservation.customerPhone && <span>{reservation.customerPhone}</span>}
                      </div>
                      <span className="reservation-status">{reservation.status}</span>
                    </article>
                  )
                })}
              </div>
            </section>

            <section className="backoffice-card">
              <h2>Set barber unavailability</h2>
              <p>Add a date/time block. Times are interpreted in {timeZone}.</p>
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
                  {isSavingBlock ? 'Saving…' : 'Save unavailability'}
                </button>
              </form>
            </section>

            <section className="backoffice-card">
              <h2>Current unavailability ({data?.unavailability.length ?? 0})</h2>
              {data?.unavailability.length === 0 && <p>No unavailability blocks found.</p>}
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
                          if (!window.confirm('Remove this unavailability block?')) return
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
          </>
        )}
      </div>
    </main>
  )
}
