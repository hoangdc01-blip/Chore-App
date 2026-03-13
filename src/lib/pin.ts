import { useFirebase } from './firebase-flag'

const PBKDF2_ITERATIONS = 100_000
const LOCAL_PIN_KEY = 'family-chores-pin'

/** Check if crypto.subtle is available (requires secure context: HTTPS or localhost) */
const hasSubtle = typeof crypto !== 'undefined' && !!crypto.subtle

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

/**
 * Software SHA-256 fallback for insecure contexts (HTTP over LAN).
 * Only used when crypto.subtle is unavailable.
 */
async function sha256Fallback(data: Uint8Array): Promise<ArrayBuffer> {
  // Try crypto.subtle first
  if (hasSubtle) {
    return crypto.subtle.digest('SHA-256', data as unknown as BufferSource)
  }
  // Software implementation of SHA-256
  const K = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ])
  const rr = (x: number, n: number) => (x >>> n) | (x << (32 - n))
  const padded = new Uint8Array(Math.ceil((data.length + 9) / 64) * 64)
  padded.set(data)
  padded[data.length] = 0x80
  const dv = new DataView(padded.buffer)
  dv.setUint32(padded.length - 4, data.length * 8, false)
  let [h0,h1,h2,h3,h4,h5,h6,h7] = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]
  const w = new Uint32Array(64)
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false)
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i-15],7) ^ rr(w[i-15],18) ^ (w[i-15]>>>3)
      const s1 = rr(w[i-2],17) ^ rr(w[i-2],19) ^ (w[i-2]>>>10)
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0
    }
    let [a,b,c,d,e,f,g,h] = [h0,h1,h2,h3,h4,h5,h6,h7]
    for (let i = 0; i < 64; i++) {
      const S1 = rr(e,6) ^ rr(e,11) ^ rr(e,25)
      const ch = (e & f) ^ (~e & g)
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0
      const S0 = rr(a,2) ^ rr(a,13) ^ rr(a,22)
      const maj = (a & b) ^ (a & c) ^ (b & c)
      const t2 = (S0 + maj) | 0
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0
    }
    h0 = (h0+a)|0; h1 = (h1+b)|0; h2 = (h2+c)|0; h3 = (h3+d)|0
    h4 = (h4+e)|0; h5 = (h5+f)|0; h6 = (h6+g)|0; h7 = (h7+h)|0
  }
  const result = new ArrayBuffer(32)
  const rv = new DataView(result)
  ;[h0,h1,h2,h3,h4,h5,h6,h7].forEach((v, i) => rv.setUint32(i * 4, v, false))
  return result
}

async function hashPinPbkdf2(pin: string, salt: Uint8Array): Promise<string> {
  if (hasSubtle) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']
    )
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial, 256,
    )
    return hexEncode(derived)
  }
  // Software PBKDF2-SHA256 fallback for insecure contexts
  const enc = new TextEncoder()
  const pinBytes = enc.encode(pin)
  // HMAC-SHA256 helper
  const hmacSha256 = async (key: Uint8Array, msg: Uint8Array): Promise<Uint8Array> => {
    const bs = 64
    let k = key
    if (k.length > bs) k = new Uint8Array(await sha256Fallback(k))
    const padded = new Uint8Array(bs)
    padded.set(k)
    const ipad = new Uint8Array(bs + msg.length)
    const opad = new Uint8Array(bs + 32)
    for (let i = 0; i < bs; i++) { ipad[i] = padded[i] ^ 0x36; opad[i] = padded[i] ^ 0x5c }
    ipad.set(msg, bs)
    const inner = new Uint8Array(await sha256Fallback(ipad))
    opad.set(inner, bs)
    return new Uint8Array(await sha256Fallback(opad))
  }
  // PBKDF2 with single block (256-bit output = 1 block)
  const intBlock = new Uint8Array(salt.length + 4)
  intBlock.set(salt)
  intBlock[salt.length + 3] = 1 // block index = 1
  let u = await hmacSha256(pinBytes, intBlock)
  const result = new Uint8Array(u)
  for (let i = 1; i < PBKDF2_ITERATIONS; i++) {
    u = await hmacSha256(pinBytes, u)
    for (let j = 0; j < 32; j++) result[j] ^= u[j]
  }
  return hexEncode(result.buffer)
}

/** Legacy SHA-256 hash for migration */
async function hashPinLegacy(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin)
  const hashBuffer = await sha256Fallback(data)
  return hexEncode(hashBuffer)
}

// ── localStorage helpers for offline PIN storage ──

function getLocalPinData(): { hash: string; salt?: string } | null {
  try {
    const raw = localStorage.getItem(LOCAL_PIN_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setLocalPinData(data: { hash: string; salt: string }): void {
  localStorage.setItem(LOCAL_PIN_KEY, JSON.stringify(data))
}

// ── Firestore helpers (lazy-loaded) ──

async function getFirestorePinDoc() {
  const { doc, getDoc, setDoc } = await import('firebase/firestore')
  const { db } = await import('./firebase')
  const PIN_DOC = doc(db, 'config', 'pin')
  return { PIN_DOC, getDoc, setDoc }
}

// ── Public API ──

export async function getPinHash(): Promise<string | null> {
  if (!useFirebase) {
    const data = getLocalPinData()
    return data?.hash ?? null
  }
  const { PIN_DOC, getDoc } = await getFirestorePinDoc()
  const snap = await getDoc(PIN_DOC)
  if (!snap.exists()) return null
  return snap.data().hash as string
}

export async function verifyPin(pin: string): Promise<boolean> {
  if (!useFirebase) {
    const data = getLocalPinData()
    if (!data) return false

    if (data.salt) {
      const salt = hexDecode(data.salt)
      const hash = await hashPinPbkdf2(pin, salt)
      return hash === data.hash
    }

    // Legacy unsalted SHA-256 — verify and auto-migrate
    const legacyHash = await hashPinLegacy(pin)
    if (legacyHash === data.hash) {
      await savePin(pin)
      return true
    }
    return false
  }

  const { PIN_DOC, getDoc } = await getFirestorePinDoc()
  const snap = await getDoc(PIN_DOC)
  if (!snap.exists()) return false
  const snapData = snap.data()
  const storedHash = snapData.hash as string

  if (snapData.salt) {
    // New salted PBKDF2 format
    const salt = hexDecode(snapData.salt as string)
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
  const saltHex = hexEncode(salt.buffer as ArrayBuffer)

  if (!useFirebase) {
    setLocalPinData({ hash, salt: saltHex })
    return
  }

  const { PIN_DOC, setDoc } = await getFirestorePinDoc()
  await setDoc(PIN_DOC, { hash, salt: saltHex })
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const valid = await verifyPin(currentPin)
  if (!valid) return false
  await savePin(newPin)
  return true
}

export async function signInAfterPin(): Promise<void> {
  if (!useFirebase) return
  const { signInAnonymously } = await import('firebase/auth')
  const { auth } = await import('./firebase')
  await signInAnonymously(auth)
}

export async function lockApp(): Promise<void> {
  if (!useFirebase) return
  const { signOut } = await import('firebase/auth')
  const { auth } = await import('./firebase')
  await signOut(auth)
}
