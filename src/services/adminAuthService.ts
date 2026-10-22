import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from '../lib/firebase'

export function observeAdminAuth(
  onChange: (user: User | null, isAdmin: boolean) => void,
  onError: (error: Error) => void,
) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      onChange(null, false)
      return
    }
    try {
      const token = await user.getIdTokenResult()
      onChange(user, token.claims.admin === true)
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Could not verify administrator access.'))
    }
  }, onError)
}

export async function signInAdmin(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  const token = await credential.user.getIdTokenResult(true)
  if (token.claims.admin !== true) {
    await signOut(auth)
    throw new Error('This account is signed in but does not have the administrator role.')
  }
  return credential.user
}

export function signOutAdmin() {
  return signOut(auth)
}
