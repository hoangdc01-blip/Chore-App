import { useFirebase } from './firebase-flag'
import { getEnv } from './env'

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID'),
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let auth: any = null

async function ensureApp() {
  if (app) return app
  const { initializeApp } = await import('firebase/app')
  app = initializeApp(firebaseConfig)
  return app
}

export async function getFirebaseDb() {
  if (!useFirebase) return null
  if (db) return db
  const firebaseApp = await ensureApp()
  const { getFirestore } = await import('firebase/firestore')
  db = getFirestore(firebaseApp)
  return db
}

export async function getFirebaseAuth() {
  if (!useFirebase) return null
  if (auth) return auth
  await ensureApp()
  const { getAuth } = await import('firebase/auth')
  auth = getAuth(app)
  return auth
}

// Legacy synchronous exports for backward compatibility during migration
// These will be null until getFirebaseDb()/getFirebaseAuth() are called
export { db, auth }
