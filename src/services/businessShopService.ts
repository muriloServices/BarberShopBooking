import type { BusinessShop } from '../types/firestore'
import {
  asFirestoreRecord,
  listRecords,
  requiredString,
} from './firestoreCrud'

const COLLECTION = 'BusinessShop'

function parseBusinessShop(id: string, value: unknown): BusinessShop {
  const path = `${COLLECTION}/${id}`
  const data = asFirestoreRecord(value, COLLECTION, id)
  const slug = data.slug
  const imageUrl = data.imageUrl
  if (slug !== undefined && typeof slug !== 'string') {
    throw new Error(`${path}.slug must be a string when present.`)
  }
  if (imageUrl !== undefined && typeof imageUrl !== 'string') {
    throw new Error(`${path}.imageUrl must be a string when present.`)
  }
  return {
    id,
    name: requiredString(data, 'name', path),
    ...(typeof slug === 'string' ? { slug } : {}),
    ...(typeof imageUrl === 'string' ? { imageUrl } : {}),
  }
}

export function getBusinessShops() {
  return listRecords(COLLECTION, parseBusinessShop)
}

