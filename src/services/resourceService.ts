import type { DocumentData } from 'firebase/firestore'
import type { BookableResource } from '../types/booking'
import {
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  updateRecord,
} from './firestoreCrud'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseResource(id: string, value: unknown): BookableResource | null {
  if (!isRecord(value) ||
    (value.name !== undefined && typeof value.name !== 'string') ||
    (value.BusinessId !== undefined && typeof value.BusinessId !== 'string') ||
    (value.type !== undefined && typeof value.type !== 'string') ||
    (value.active !== undefined && typeof value.active !== 'boolean')) return null
  const rawName = typeof value.name === 'string' ? value.name.trim() : ''
  return {
    id,
    name: rawName || `Unnamed barber (${id})`,
    ...(typeof value.BusinessId === 'string' ? { BusinessId: value.BusinessId } : {}),
    type: typeof value.type === 'string' ? value.type : 'BARBER',
    active: typeof value.active === 'boolean' ? value.active : true,
  }
}

export async function getBookableResources() {
  const documents = await listRecords('BookableResource', (id, value) => ({
    value,
    parsed: parseResource(id, value),
    id,
  }))
  const resources = documents.map(({ parsed }) => parsed)
  const malformedRecords = documents.flatMap(({ parsed, id, value }) => {
    if (parsed) return []
    if (!isRecord(value)) return [`${id}: document must be an object`]
    const data = value
    const problems = [
      typeof data.name !== 'string' ? 'name must be a string' : '',
      data.BusinessId !== undefined && typeof data.BusinessId !== 'string' ? 'BusinessId must be a string' : '',
      data.type !== undefined && typeof data.type !== 'string' ? 'type must be a string' : '',
      data.active !== undefined && typeof data.active !== 'boolean' ? 'active must be a boolean' : '',
    ].filter(Boolean)
    return [`${id}: ${problems.join(', ')}`]
  })

  return {
    resources: resources.filter((resource): resource is BookableResource => resource !== null),
    isEmpty: documents.length === 0,
    malformedRecords,
  }
}

export async function getBookableResource(id: string) {
  return getRecord('BookableResource', id, parseResource)
}

export async function createBookableResource(input: {
  name: string
  BusinessId?: string
  type?: string
  active?: boolean
}) {
  const name = input.name.trim()
  if (!name) throw new Error('Barber name is required.')
  if (input.BusinessId !== undefined && !input.BusinessId.trim()) {
    throw new Error('BusinessId cannot be empty when provided.')
  }
  if (input.type !== undefined && input.type !== 'BARBER') {
    throw new Error('Only BARBER resources are supported.')
  }
  const value: DocumentData = {
    name,
    type: input.type ?? 'BARBER',
    active: input.active ?? true,
  }
  if (input.BusinessId !== undefined) value.BusinessId = input.BusinessId
  return createRecord('BookableResource', value)
}

export function updateBookableResource(
  id: string,
  input: Partial<{ name: string; BusinessId: string; type: string; active: boolean }>,
) {
  const updates = { ...input }
  if (updates.name !== undefined && !updates.name.trim()) throw new Error('Barber name is required.')
  if (updates.BusinessId !== undefined && !updates.BusinessId.trim()) {
    throw new Error('BusinessId cannot be empty when provided.')
  }
  if (updates.type !== undefined && updates.type !== 'BARBER') {
    throw new Error('Only BARBER resources are supported.')
  }
  return updateRecord('BookableResource', id, updates)
}

export function deleteBookableResource(id: string) {
  return deleteRecord('BookableResource', id)
}
