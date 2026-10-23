import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'
import type { Booking } from '../types/firestore'
import { firestore } from '../lib/firebase'
import {
  asFirestoreRecord,
  createRecord,
  getRecord,
  listRecords,
  optionalString,
  requiredString,
  updateRecord,
  deleteRecord,
} from './firestoreCrud'
import { businessDayBounds } from './dateTimeService'

const COLLECTION = 'Booking'
type BookingInput = Omit<Booking, 'id'>

function parseBooking(id: string, value: unknown): Booking {
  const path = `${COLLECTION}/${id}`
  const data = asFirestoreRecord(value, COLLECTION, id)
  const durationMinutes = data.durationMinutes
  if (typeof durationMinutes !== 'string' && typeof durationMinutes !== 'number') {
    throw new Error(`${path}.durationMinutes must be a string or number.`)
  }
  return {
    id,
    resourceId: requiredString(data, 'resourceId', path),
    durationMinutes,
    BusinessId: optionalString(data, 'BusinessId', path),
    customerName: requiredString(data, 'customerName', path),
    startAt: optionalString(data, 'startAt', path),
    endAt: optionalString(data, 'endAt', path),
    customerEmail: optionalString(data, 'customerEmail', path),
    customerPhone: optionalString(data, 'customerPhone', path),
    resourceEmail: optionalString(data, 'resourceEmail', path),
  }
}

function validateBooking(input: BookingInput) {
  if (!input.resourceId.trim() || !input.customerName.trim()) {
    throw new Error('Select a barber and enter the customer name.')
  }
  if (input.BusinessId !== undefined && !input.BusinessId.trim()) {
    throw new Error('BusinessId cannot be empty when provided.')
  }
  if (
    typeof input.durationMinutes === 'number' &&
    (!Number.isInteger(input.durationMinutes) || input.durationMinutes <= 0)
  ) {
    throw new Error('Duration must be a positive whole number of minutes.')
  }
  if ((input.startAt === undefined) !== (input.endAt === undefined)) {
    throw new Error('Both startAt and endAt must be provided together.')
  }
  if (input.startAt !== undefined && input.endAt !== undefined) {
    const start = Date.parse(input.startAt)
    const end = Date.parse(input.endAt)
    if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
      throw new Error('Enter valid booking times with endAt after startAt.')
    }
  }
}

export function getBookings() {
  return listRecords(COLLECTION, parseBooking)
}

export async function getBookedIntervals(resourceId: string, date: string, timeZone: string) {
  const bounds = businessDayBounds(date, timeZone)
  if (!bounds) throw new Error(`Could not determine business-day boundaries for ${date}.`)
  const snapshot = await getDocs(query(
    collection(firestore, COLLECTION),
    where('resourceId', '==', resourceId),
  ))
  return snapshot.docs.flatMap((document) => {
    const data = document.data()
    const startAt = typeof data.startAt === 'string' ? Date.parse(data.startAt) : Number.NaN
    const endAt = typeof data.endAt === 'string' ? Date.parse(data.endAt) : Number.NaN
    if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || endAt <= startAt) return []
    return startAt < bounds.end && endAt > bounds.start ? [{ startAt, endAt }] : []
  })
}

export function getBooking(id: string) {
  return getRecord(COLLECTION, id, parseBooking)
}

function bookingDocumentId(resourceId: string, startAt: string) {
  return `${resourceId}_${startAt}`
}

export function validateCustomerDetails(name: string, email: string, phone: string) {
  const normalizedName = name.trim()
  const normalizedEmail = email.trim()
  const normalizedPhone = phone.trim()
  const nameParts = normalizedName.match(/\p{L}[\p{L}\p{M}]*/gu) ?? []
  if (
    normalizedName.length > 120 ||
    nameParts.length === 0 ||
    nameParts.join('').length < 2 ||
    !/^\p{L}[\p{L}\p{M}]*(?:[ '\u2019.-]\p{L}[\p{L}\p{M}]*)*$/u.test(normalizedName)
  ) {
    throw new Error('Enter a valid name using letters, spaces, apostrophes, periods, or hyphens.')
  }
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    throw new Error('Enter a valid email address.')
  }
  const phoneDigits = normalizedPhone.replace(/\D/g, '')
  if (
    normalizedPhone.length > 40 ||
    !/^\+?[0-9().\s-]+$/.test(normalizedPhone) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    throw new Error('Enter a valid phone number with 7 to 15 digits.')
  }
}

export async function createConfirmedBooking(input: {
  resourceId: string
  resourceEmail?: string
  BusinessId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  startAt: string
  endAt: string
}) {
  const booking: BookingInput = {
    resourceId: input.resourceId.trim(),
    ...(input.resourceEmail?.trim() ? { resourceEmail: input.resourceEmail.trim() } : {}),
    durationMinutes: '60',
    BusinessId: input.BusinessId.trim(),
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerPhone: input.customerPhone.trim(),
    startAt: input.startAt,
    endAt: input.endAt,
  }
  validateBooking(booking)
  validateCustomerDetails(booking.customerName, booking.customerEmail!, booking.customerPhone!)
  if (Date.parse(booking.endAt!) - Date.parse(booking.startAt!) !== 60 * 60 * 1000) {
    throw new Error('The selected appointment must be exactly one hour long.')
  }

  const bookingId = bookingDocumentId(booking.resourceId, booking.startAt!)
  const bookingRef = doc(firestore, COLLECTION, bookingId)
  const existingBooking = await getDoc(bookingRef)
  if (existingBooking.exists()) {
    throw new Error('That time has just been booked. Please choose another time.')
  }
  try {
    await setDoc(bookingRef, booking)
  } catch (error) {
    const slotAfterFailure = await getDoc(bookingRef)
    if (slotAfterFailure.exists()) {
      throw new Error('That time has just been booked. Please choose another time.')
    }
    throw error
  }
  return bookingId
}

export function createBooking(input: BookingInput) {
  validateBooking(input)
  validateCustomerDetails(input.customerName, input.customerEmail ?? '', input.customerPhone ?? '')
  return createRecord(COLLECTION, input)
}

export async function updateBooking(
  id: string,
  input: Partial<Pick<BookingInput, 'customerName' | 'customerEmail' | 'customerPhone'>>,
) {
  const current = await getBooking(id)
  if (!current) throw new Error(`Booking/${id} does not exist.`)
  if (input.customerName !== undefined && !input.customerName.trim()) {
    throw new Error('Customer name is required.')
  }
  const customerName = input.customerName ?? current.customerName
  const customerEmail = input.customerEmail ?? current.customerEmail ?? ''
  const customerPhone = input.customerPhone ?? current.customerPhone ?? ''
  validateCustomerDetails(customerName, customerEmail, customerPhone)
  if (Object.keys(input).length === 0) throw new Error('Provide at least one booking detail to update.')
  await updateRecord(COLLECTION, id, {
    ...input,
    ...(input.customerName !== undefined ? { customerName: customerName.trim() } : {}),
    ...(input.customerEmail !== undefined ? { customerEmail: customerEmail.trim().toLowerCase() } : {}),
    ...(input.customerPhone !== undefined ? { customerPhone: customerPhone.trim() } : {}),
  })
}

export function deleteBooking(id: string) {
  return deleteRecord(COLLECTION, id)
}
