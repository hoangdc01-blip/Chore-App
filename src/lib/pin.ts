import { doc, getDoc, setDoc } from 'firebase/firestore'
import { signInAnonymously, signOut } from 'firebase/auth'
import { db, auth } from './firebase'

const PIN_DOC = doc(db, 'config', 'pin')

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getPinHash(): Promise<string | null> {
  const snap = await getDoc(PIN_DOC)
  if (!snap.exists()) return null
  return snap.data().hash as string
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await getPinHash()
  if (!stored) return false
  const hash = await hashPin(pin)
  return hash === stored
}

export async function savePin(pin: string): Promise<void> {
  const hash = await hashPin(pin)
  console.log('Saving PIN to Firestore...')
  await setDoc(PIN_DOC, { hash })
  console.log('PIN saved successfully')
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const valid = await verifyPin(currentPin)
  if (!valid) return false
  await savePin(newPin)
  return true
}

export async function signInAfterPin(): Promise<void> {
  console.log('Starting anonymous sign-in...')
  const cred = await signInAnonymously(auth)
  console.log('Anonymous sign-in successful, UID:', cred.user.uid)
}

export async function lockApp(): Promise<void> {
  await signOut(auth)
}
