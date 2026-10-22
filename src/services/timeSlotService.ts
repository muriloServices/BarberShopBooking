import { collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { businessDateTimeToEpoch, parseCanonicalInstant } from './dateTimeService'
import { getBusinessHoursRecords } from './businessHoursService'
import { getBookableResource } from './resourceService'
import { getBookedIntervals } from './bookingService'
import type { TimeSlot, TimeSlotAvailability } from '../types/booking'

export async function getTimeSlotAvailability(
  date: string,
  resourceId: string,
  timeZone: string,
): Promise<TimeSlotAvailability> {
  try {
    const [snapshot, resource, hours, bookedIntervals] = await Promise.all([
      getDocs(query(
        collection(firestore, 'AvailabilityException'),
        where('resourceId', '==', resourceId),
      )),
      getBookableResource(resourceId),
      getBusinessHoursRecords(),
      getBookedIntervals(resourceId, date, timeZone),
    ])
    if (!resource?.BusinessId) {
      return { slots: [], status: 'unresolved', message: 'This barber is not linked to a business.' }
    }
    const businessHours = hours.find((record) => record.businessShopId === resource.BusinessId)
    if (!businessHours) {
      return { slots: [], status: 'unresolved', message: 'Business hours are not configured for this barber.' }
    }
    const dayOfWeek = new Date(`${date}T12:00:00.000Z`).getUTCDay()
    if (businessHours.closedDays.includes(dayOfWeek)) {
      return { slots: [], status: 'available', warning: 'The shop is closed on this day.' }
    }

    const exceptions: Array<{ start: number; end: number }> = []
    for (const document of snapshot.docs) {
      const exception = document.data()
      const start = typeof exception.startAt === 'string' ? parseCanonicalInstant(exception.startAt) : null
      const end = typeof exception.endAt === 'string' ? parseCanonicalInstant(exception.endAt) : null
      if (start === null || end === null || end <= start) continue
      exceptions.push({ start, end })
    }

    const now = Date.now()
    const slots: TimeSlot[] = []
    const [openingHour, openingMinute] = businessHours.openingTime.split(':').map(Number)
    const [closingHour, closingMinute] = businessHours.closingTime.split(':').map(Number)
    const openingMinutes = openingHour * 60 + openingMinute
    const closingMinutes = closingHour * 60 + closingMinute
    for (let startMinutes = openingMinutes; startMinutes + 60 <= closingMinutes; startMinutes += 60) {
      const endMinutes = startMinutes + 60
      const startTime = `${String(Math.floor(startMinutes / 60)).padStart(2, '0')}:${String(startMinutes % 60).padStart(2, '0')}`
      const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
      const start = businessDateTimeToEpoch(date, startTime, timeZone)
      const end = businessDateTimeToEpoch(date, endTime, timeZone)
      if (start === null || end === null || end - start !== 60 * 60 * 1000) continue
      const blocked = exceptions.some(
        (exception) => exception.start < end && exception.end > start,
      )
      slots.push({
        hour: Math.floor(startMinutes / 60),
        label: `${startTime}–${endTime}`,
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
        available: start > now && !blocked && !bookedIntervals.some(
          (booking) => booking.startAt < end && booking.endAt > start,
        ),
      })
    }

    return {
      slots,
      status: 'available',
      warning: 'A reservation is confirmed immediately when you select an available time.',
    }
  } catch {
    return {
      slots: [],
      status: 'unresolved',
      message: 'Could not load business hours, availability exceptions, or existing bookings. Check Firestore read rules.',
    }
  }
}
