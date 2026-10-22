import type { AvailabilityException } from '../types/firestore'
import {
  asFirestoreRecord,
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  optionalString,
  requiredString,
  updateRecord,
} from './firestoreCrud'

const COLLECTION = 'AvailabilityException'
type ExceptionInput = Omit<AvailabilityException, 'id'>

function parseException(id: string, value: unknown): AvailabilityException {
  const path = `${COLLECTION}/${id}`
  const data = asFirestoreRecord(value, COLLECTION, id)
  return {
    id,
    startAt: requiredString(data, 'startAt', path),
    endAt: requiredString(data, 'endAt', path),
    reason: requiredString(data, 'reason', path),
    resourceId: requiredString(data, 'resourceId', path),
    BusinessId: optionalString(data, 'BusinessId', path),
  }
}

function validateException(input: ExceptionInput) {
  const start = Date.parse(input.startAt)
  const end = Date.parse(input.endAt)
  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    new Date(start).toISOString() !== input.startAt ||
    new Date(end).toISOString() !== input.endAt ||
    end <= start
  ) {
    throw new Error('Use valid canonical UTC ISO timestamps with endAt after startAt.')
  }
  if (!input.resourceId.trim() || !input.reason.trim()) {
    throw new Error('A resource and reason are required for an availability exception.')
  }
  if (input.BusinessId !== undefined && !input.BusinessId.trim()) {
    throw new Error('BusinessId cannot be empty when provided.')
  }
}

export function getAvailabilityExceptions() {
  return listRecords(COLLECTION, parseException)
}

export function getAvailabilityException(id: string) {
  return getRecord(COLLECTION, id, parseException)
}

export function createAvailabilityException(input: ExceptionInput) {
  validateException(input)
  return createRecord(COLLECTION, input)
}

export async function updateAvailabilityException(id: string, input: Partial<ExceptionInput>) {
  const current = await getAvailabilityException(id)
  if (!current) throw new Error(`AvailabilityException/${id} does not exist.`)
  const merged = { ...current, ...input }
  validateException(merged)
  await updateRecord(COLLECTION, id, input)
}

export function deleteAvailabilityException(id: string) {
  return deleteRecord(COLLECTION, id)
}
