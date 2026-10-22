import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'

export function asFirestoreRecord(value: unknown, collectionName: string, id: string) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${collectionName}/${id} is not a valid Firestore document.`)
  }
  return value as Record<string, unknown>
}

export function requiredString(data: Record<string, unknown>, field: string, path: string) {
  const value = data[field]
  if (typeof value !== 'string') {
    throw new Error(`${path}.${field} must be a string.`)
  }
  return value
}

export function optionalString(data: Record<string, unknown>, field: string, path: string) {
  const value = data[field]
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new Error(`${path}.${field} must be a string when present.`)
  }
  return value
}

export async function listRecords<T>(
  collectionName: string,
  parse: (id: string, value: unknown) => T,
): Promise<T[]> {
  const snapshot = await getDocs(collection(firestore, collectionName))
  return snapshot.docs.map((document) => parse(document.id, document.data()))
}

export async function getRecord<T>(
  collectionName: string,
  id: string,
  parse: (id: string, value: unknown) => T,
): Promise<T | null> {
  const snapshot = await getDoc(doc(firestore, collectionName, id))
  return snapshot.exists() ? parse(snapshot.id, snapshot.data()) : null
}

export async function createRecord<T extends DocumentData>(
  collectionName: string,
  value: T,
): Promise<string> {
  const reference = await addDoc(collection(firestore, collectionName), value)
  return reference.id
}

export async function updateRecord(
  collectionName: string,
  id: string,
  value: DocumentData,
) {
  if (Object.keys(value).length === 0) {
    throw new Error(`No fields were provided to update ${collectionName}/${id}.`)
  }
  await updateDoc(doc(firestore, collectionName, id), value)
}

export async function deleteRecord(collectionName: string, id: string) {
  await deleteDoc(doc(firestore, collectionName, id))
}
