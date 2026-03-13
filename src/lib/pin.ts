import { doc, getDoc, setDoc } from 'firebase/firestore'
import { signInAnonymously, signOut } from 'firebase/auth'
import { db, auth } from './firebase'

const PIN_DOC = doc(db, 'config', 'pin')
const PBKDF2_ITERATIONS = 100_000

function hexEncode(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

async function hashPinPbkdf2(pin: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial, 256,
  )
  return hexEncode(derived)
}

/** Legacy SHA-256 hash for migration */
async function hashPinLegacy(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return hexEncode(hashBuffer)
}

export async function getPinHash(): Promise<string | null> {
  const snap = await getDoc(PIN_DOC)
  if (!snap.exists()) return null
  return snap.data().hash as string
}

export async function verifyPin(pin: string): Promise<boolean> {
  const snap = await getDoc(PIN_DOC)
  if (!snap.exists()) return false
  const data = snap.data()
  const storedHash = data.hash as string

  if (data.salt) {
    // New salted PBKDF2 format
    const salt = hexDecode(data.salt as string)
    const hash = await hashPinPbkdf2(pin, salt)
    return hash === storedHash
  }

  // Legacy unsalted SHA-256 — verify and auto-migrate
  const legacyHash = await hashPinLegacy(pin)
  if (legacyHash === storedHash) {
    // Re-save with salt to upgrade
    await savePin(pin)
    return true
  }
  return false
}

export async function savePin(pin: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await hashPinPbkdf2(pin, salt)
  await setDoc(PIN_DOC, { hash, salt: hexEncode(salt.buffer) })
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const valid = await verifyPin(currentPin)
  if (!valid) return false
  await savePin(newPin)
  return true
}

export async function signInAfterPin(): Promise<void> {
  await signInAnonymously(auth)
}

export async function lockApp(): Promise<void> {
  await signOut(auth)
}
