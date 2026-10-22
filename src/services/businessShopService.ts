import type { BusinessShop } from '../types/firestore'
import {
  asFirestoreRecord,
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  requiredString,
  updateRecord,
} from './firestoreCrud'

const COLLECTION = 'BusinessShop'

function parseBusinessShop(id: string, value: unknown): BusinessShop {
  const path = `${COLLECTION}/${id}`
  const data = asFirestoreRecord(value, COLLECTION, id)
  return { id, name: requiredString(data, 'name', path) }
}

export function getBusinessShops() {
  return listRecords(COLLECTION, parseBusinessShop)
}

export function getBusinessShop(id: string) {
  return getRecord(COLLECTION, id, parseBusinessShop)
}

export function createBusinessShop(input: { name: string }) {
  const name = input.name.trim()
  if (!name) throw new Error('Business name is required.')
  return createRecord(COLLECTION, { name })
}

export function updateBusinessShop(id: string, input: Partial<{ name: string }>) {
  const updates: Partial<{ name: string }> = input.name === undefined
    ? {}
    : { name: input.name.trim() }
  if (updates.name !== undefined && !updates.name) throw new Error('Business name is required.')
  return updateRecord(COLLECTION, id, updates)
}

export function deleteBusinessShop(id: string) {
  return deleteRecord(COLLECTION, id)
}
