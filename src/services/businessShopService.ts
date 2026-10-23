import type { BusinessShop } from '../types/firestore'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
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

export async function getBusinessShopBySlug(slug: string) {
  const snapshot = await getDocs(query(
    collection(firestore, COLLECTION),
    where('slug', '==', slug),
  ))
  const matches = snapshot.docs.map((document) =>
    parseBusinessShop(document.id, document.data()),
  )
  if (matches.length > 1) {
    throw new Error(`More than one ${COLLECTION} document uses the slug "${slug}".`)
  }
  return matches[0] ?? null
}
