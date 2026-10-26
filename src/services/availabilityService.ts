import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { businessDayBounds, parseCanonicalInstant } from './dateTimeService'
import { getBookableResources } from './resourceService'
import type { Barber, DateAvailability } from '../types/booking'
import type { TimeInterval } from './dateTimeService'

type AvailabilityException = {
  startAt: string
  endAt: string
  resourceId: string
  reason: string
}

function firestoreReadErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : undefined

  if (code === 'permission-denied') {
    return 'Firestore denied access to BookableResource or AvailabilityException. Check the Firestore security rules for read access.'
  }
  if (code === 'unavailable' || code === 'network-request-failed') {
    return 'Firestore is currently unreachable. Check your internet connection and try again.'
  }

  const detail =
    typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
      ? error.message
      : undefined
  return detail
    ? `Could not read BookableResource or AvailabilityException from Firestore: ${detail}`
    : 'Could not read BookableResource or AvailabilityException from Firestore.'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseException(value: unknown): AvailabilityException | null {
  if (!isRecord(value)) return null
  if (
    typeof value.startAt !== 'string' ||
    typeof value.endAt !== 'string' ||
    typeof value.resourceId !== 'string' ||
    typeof value.reason !== 'string'
  ) return null
  return {
    startAt: value.startAt,
    endAt: value.endAt,
    resourceId: value.resourceId,
    reason: value.reason,
  }
}

/**
 * A resource is selectable unless a valid, resource-matched exception overlaps
 * the selected business day. This does not confirm that a time slot is free.
 */
export async function getDateAvailability(
  date: string,
  businessId: string,
  timeZone?: string,
): Promise<DateAvailability> {
  try {
    const [resourceResult, exceptionSnapshot] = await Promise.all([
      getBookableResources(),
      getDocs(collection(firestore, 'AvailabilityException')),
    ])

    if (resourceResult.isEmpty) {
      return {
        barbers: [],
        status: 'unresolved',
        message: 'The studio’s bookable resources are not available yet.',
      }
    }

    const resources = resourceResult.resources
      .filter((resource) =>
        resource.BusinessId === businessId &&
        resource.type === 'BARBER' &&
        resource.active,
      )
    const exceptionsByResource = new Map<string, Array<{ start: number; end: number }>>()
    const malformedExceptions: string[] = []

    for (const document of exceptionSnapshot.docs) {
      const raw = document.data()
      const exception = parseException(raw)
      if (!exception || !exception.resourceId.trim()) {
        const problems = []
        if (typeof raw.resourceId !== 'string' || !raw.resourceId.trim()) problems.push('resourceId is missing or empty')
        if (typeof raw.startAt !== 'string' || !raw.startAt.trim()) problems.push('startAt is missing or empty')
        if (typeof raw.endAt !== 'string' || !raw.endAt.trim()) problems.push('endAt is missing or empty')
        if (typeof raw.reason !== 'string') problems.push('reason must be a string')
        malformedExceptions.push(`${document.id}: ${problems.join(', ')}`)
        continue
      }
      const start = parseCanonicalInstant(exception.startAt)
      const end = parseCanonicalInstant(exception.endAt)
      if (start === null || end === null || end <= start) {
        const problems = []
        if (start === null) problems.push('startAt must be a valid UTC ISO timestamp')
        if (end === null) problems.push('endAt must be a valid UTC ISO timestamp')
        if (start !== null && end !== null && end <= start) problems.push('endAt must be after startAt')
        malformedExceptions.push(`${document.id} (${exception.resourceId}): ${problems.join(', ')}`)
        continue
      }
      const records = exceptionsByResource.get(exception.resourceId) ?? []
      records.push({ start, end })
      exceptionsByResource.set(exception.resourceId, records)
    }

    const warnings = []
    if (resourceResult.malformedRecords.length > 0) {
      warnings.push(`Invalid BookableResource documents were excluded: ${resourceResult.malformedRecords.join('; ')}.`)
    }
    if (malformedExceptions.length > 0) {
      warnings.push(`Invalid AvailabilityException documents were ignored: ${malformedExceptions.join('; ')}.`)
    }

    let effectiveTimeZone = timeZone || 'Europe/Lisbon'
    if (!timeZone) {
      warnings.push('Using the default studio timezone Europe/Lisbon. Override it with VITE_BUSINESS_TIME_ZONE if needed.')
    } else {
      try {
        new Intl.DateTimeFormat('en', { timeZone }).format()
      } catch {
        effectiveTimeZone = 'UTC'
        warnings.push('The studio timezone is invalid; exceptions are compared using UTC dates.')
      }
    }

    const day: TimeInterval | null =
      businessDayBounds(date, effectiveTimeZone) ?? businessDayBounds(date, 'UTC')
    const available: Barber[] = []

    for (const resource of resources) {
      const resourceExceptions = exceptionsByResource.get(resource.id) ?? []
      const hasAnyAvailableTime = day !== null && (
        resourceExceptions.length === 0 ||
        !resourceExceptions.some(
          (exception) => exception.start <= day.start && exception.end >= day.end,
        )
      )
      if (hasAnyAvailableTime) {
        available.push({
          id: resource.id,
          name: resource.name,
          ...(resource.BusinessId ? { BusinessId: resource.BusinessId } : {}),
          ...(resource.emailResource ? { emailResource: resource.emailResource } : {}),
        })
      }
    }

    return {
      barbers: available,
      status: 'available',
      ...(warnings.length ? { warning: warnings.join(' ') } : {}),
    }
  } catch (error) {
    return {
      barbers: [],
      status: 'unresolved',
      message: firestoreReadErrorMessage(error),
    }
  }
}
