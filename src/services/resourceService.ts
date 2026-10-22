import { collection, getDocs } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type { BookableResource } from '../types/booking'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseResource(id: string, value: unknown): BookableResource | null {
  if (
    !isRecord(value) ||
    (value.name !== undefined && typeof value.name !== 'string') ||
    (value.type !== undefined && typeof value.type !== 'string') ||
    (value.active !== undefined && typeof value.active !== 'boolean')
  ) return null

  const name = typeof value.name === 'string' ? value.name.trim() : ''
  return {
    id,
    name: name || `Unnamed barber (${id})`,
    type: typeof value.type === 'string' ? value.type : 'BARBER',
    active: typeof value.active === 'boolean' ? value.active : true,
  }
}

export async function getBookableResources() {
  const snapshot = await getDocs(collection(firestore, 'BookableResource'))
  const resources = snapshot.docs.map((document) => parseResource(document.id, document.data()))
  const malformedRecords = snapshot.docs.flatMap((document, index) => {
    if (resources[index]) return []
    const data = document.data()
    const problems = []
    if (data.name !== undefined && typeof data.name !== 'string') problems.push('name must be a string')
    if (data.type !== undefined && typeof data.type !== 'string') problems.push('type must be a string')
    if (data.active !== undefined && typeof data.active !== 'boolean') problems.push('active must be a boolean')
    return [`${document.id}: ${problems.join(', ')}`]
  })

  return {
    resources: resources.filter((resource): resource is BookableResource => resource !== null),
    isEmpty: snapshot.empty,
    malformedRecords,
  }
}
