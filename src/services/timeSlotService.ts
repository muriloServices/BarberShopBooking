import { collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { hourlyInterval, parseCanonicalInstant } from './dateTimeService'
import type { TimeSlot, TimeSlotAvailability } from '../types/booking'

export async function getTimeSlotAvailability(
  date: string,
  resourceId: string,
  timeZone: string,
): Promise<TimeSlotAvailability> {
  try {
    const snapshot = await getDocs(query(
      collection(firestore, 'AvailabilityException'),
      where('resourceId', '==', resourceId),
    ))
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
    for (let hour = 9; hour <= 19; hour += 1) {
      const interval = hourlyInterval(date, hour, timeZone)
      if (!interval) continue
      const blocked = exceptions.some(
        (exception) => exception.start < interval.end && exception.end > interval.start,
      )
      slots.push({
        hour,
        label: `${String(hour).padStart(2, '0')}:00–${String((hour + 1) % 24).padStart(2, '0')}:00`,
        startAt: new Date(interval.start).toISOString(),
        endAt: new Date(interval.end).toISOString(),
        available: interval.start > now && !blocked,
      })
    }

    return {
      slots,
      status: 'available',
      warning: 'Existing bookings cannot be checked in the browser. These hours are requests only and are not confirmed.',
    }
  } catch {
    return {
      slots: [],
      status: 'unresolved',
      message: 'Could not read AvailabilityException. Check the Firestore read rules.',
    }
  }
}
