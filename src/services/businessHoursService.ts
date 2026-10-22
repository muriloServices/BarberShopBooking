import type { BusinessHours } from '../types/firestore'
import {
  asFirestoreRecord,
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  requiredString,
  updateRecord,
} from './firestoreCrud'

const COLLECTION = 'BusinessHours'
type BusinessHoursInput = Omit<BusinessHours, 'id'>

function parseBusinessHours(id: string, value: unknown): BusinessHours {
  const path = `${COLLECTION}/${id}`
  const data = asFirestoreRecord(value, COLLECTION, id)
  if (!Array.isArray(data.closedDays) || data.closedDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) {
    throw new Error(`${path}.closedDays must contain weekday numbers from 0 through 6.`)
  }
  return {
    id,
    closedDays: data.closedDays,
    openingTime: requiredString(data, 'openingTime', path),
    closingTime: requiredString(data, 'closingTime', path),
    businessShopId: requiredString(data, 'businessShopId', path),
  }
}

function validateBusinessHours(input: BusinessHoursInput) {
  if (
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.openingTime) ||
    !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(input.closingTime) ||
    input.openingTime >= input.closingTime
  ) {
    throw new Error('Enter valid opening and closing times, with closing after opening.')
  }
  if (
    input.closedDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) ||
    new Set(input.closedDays).size !== input.closedDays.length
  ) {
    throw new Error('Closed days must be unique weekday numbers from 0 through 6.')
  }
  if (!input.businessShopId.trim()) throw new Error('A business shop must be selected.')
}

export function getBusinessHoursRecords() {
  return listRecords(COLLECTION, parseBusinessHours)
}

export function getBusinessHours(id: string) {
  return getRecord(COLLECTION, id, parseBusinessHours)
}

export function createBusinessHours(input: BusinessHoursInput) {
  validateBusinessHours(input)
  return createRecord(COLLECTION, input)
}

export async function updateBusinessHours(id: string, input: Partial<BusinessHoursInput>) {
  const updates = { ...input }
  const current = await getBusinessHours(id)
  if (!current) throw new Error(`BusinessHours/${id} does not exist.`)
  const merged = { ...current, ...updates }
  validateBusinessHours(merged)
  await updateRecord(COLLECTION, id, updates)
}

export function deleteBusinessHours(id: string) {
  return deleteRecord(COLLECTION, id)
}
