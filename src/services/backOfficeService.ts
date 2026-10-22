import { getBookings } from './bookingService'
import {
  createAvailabilityException,
  deleteAvailabilityException,
  getAvailabilityExceptions,
} from './availabilityExceptionService'
import { getBookableResource, getBookableResources } from './resourceService'
import { businessDateTimeToEpoch } from './dateTimeService'
import { getBusinessShops } from './businessShopService'

export type ReservationRecord = {
  id: string
  resourceId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  startAt: string
  endAt: string
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
  const [bookings, unavailability, resourceResult, businesses] = await Promise.all([
    getBookings(),
    getAvailabilityExceptions(),
    getBookableResources(),
    getBusinessShops(),
  ])

  return {
    reservations: bookings
      .map((booking) => toReservation(booking.id, booking))
      .sort((left, right) => right.startAt.localeCompare(left.startAt)),
    unavailability: unavailability.map((record) => toUnavailability(record.id, record)),
    resources: resourceResult.resources.filter((resource) => resource.type === 'BARBER' && resource.active),
    businesses,
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
  const resource = await getBookableResource(input.resourceId)
  if (!resource?.BusinessId) {
    throw new Error('The selected barber must be linked to a business before adding unavailability.')
  }
  const start = businessDateTimeToEpoch(input.startDate, input.startTime, input.timeZone)
  const end = businessDateTimeToEpoch(input.endDate, input.endTime, input.timeZone)
  if (start === null || end === null || end <= start) {
    throw new Error('Enter a valid start and end time. The end must be after the start; daylight-saving transition times are not accepted.')
  }
  await createAvailabilityException({
    startAt: new Date(start).toISOString(),
    endAt: new Date(end).toISOString(),
    resourceId: input.resourceId,
    reason: input.reason.trim(),
    BusinessId: resource.BusinessId,
  })
}

export async function deleteUnavailability(id: string) {
  await deleteAvailabilityException(id)
}
