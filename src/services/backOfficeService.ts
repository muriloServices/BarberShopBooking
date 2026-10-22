import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { getBookableResources } from './resourceService'
import { businessDateTimeToEpoch } from './dateTimeService'

export type ReservationRecord = {
  id: string
  resourceId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  startAt: string
  endAt: string
  status: string
}

export type UnavailabilityRecord = {
  id: string
  resourceId: string
  startAt: string
  endAt: string
  reason: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(data: Record<string, unknown>, key: string, fallback = '') {
  return typeof data[key] === 'string' ? data[key] as string : fallback
}

function toReservation(id: string, value: unknown): ReservationRecord {
  const data = isRecord(value) ? value : {}
  return {
    id,
    resourceId: stringField(data, 'resourceId'),
    customerName: stringField(data, 'customerName', stringField(data, 'name', stringField(data, 'customerId', 'Unknown customer'))),
    customerEmail: stringField(data, 'customerEmail', stringField(data, 'email')),
    customerPhone: stringField(data, 'customerPhone', stringField(data, 'phone')),
    startAt: stringField(data, 'startAt'),
    endAt: stringField(data, 'endAt'),
    status: stringField(data, 'status', 'UNKNOWN'),
  }
}

function toUnavailability(id: string, value: unknown): UnavailabilityRecord {
  const data = isRecord(value) ? value : {}
  return {
    id,
    resourceId: stringField(data, 'resourceId'),
    startAt: stringField(data, 'startAt'),
    endAt: stringField(data, 'endAt'),
    reason: stringField(data, 'reason'),
  }
}

export async function getBackOfficeData() {
  const [bookingSnapshot, exceptionSnapshot, resourceResult] = await Promise.all([
    getDocs(collection(firestore, 'Booking')),
    getDocs(collection(firestore, 'AvailabilityException')),
    getBookableResources(),
  ])

  return {
    reservations: bookingSnapshot.docs
      .map((document) => toReservation(document.id, document.data()))
      .sort((left, right) => right.startAt.localeCompare(left.startAt)),
    unavailability: exceptionSnapshot.docs.map((document) => toUnavailability(document.id, document.data())),
    resources: resourceResult.resources.filter((resource) => resource.type === 'BARBER' && resource.active),
  }
}

export async function createUnavailability(input: {
  resourceId: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  reason: string
  timeZone: string
}) {
  const start = businessDateTimeToEpoch(input.startDate, input.startTime, input.timeZone)
  const end = businessDateTimeToEpoch(input.endDate, input.endTime, input.timeZone)
  if (start === null || end === null || end <= start) {
    throw new Error('Enter a valid start and end time. The end must be after the start; daylight-saving transition times are not accepted.')
  }
  await addDoc(collection(firestore, 'AvailabilityException'), {
    startAt: new Date(start).toISOString(),
    endAt: new Date(end).toISOString(),
    resourceId: input.resourceId,
    reason: input.reason.trim(),
  })
}

export async function deleteUnavailability(id: string) {
  await deleteDoc(doc(firestore, 'AvailabilityException', id))
}
