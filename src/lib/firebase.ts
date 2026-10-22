import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Keep the existing Firebase project configuration; no new backend is assumed.
const firebaseConfig = {
  apiKey: 'AIzaSyDW6_2ntwzVgWz9OEPtY5xh7yix_Ec0y28',
  authDomain: 'barbershopbooking-ff17d.firebaseapp.com',
  projectId: 'barbershopbooking-ff17d',
  storageBucket: 'barbershopbooking-ff17d.firebasestorage.app',
  messagingSenderId: '248162139374',
  appId: '1:248162139374:web:faabba98a417c14e8d87ff',
  measurementId: 'G-WH0ZE5HF0L',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const firestore = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
