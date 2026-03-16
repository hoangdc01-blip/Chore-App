import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
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

const app = useFirebase ? initializeApp(firebaseConfig) : null
const db = app ? getFirestore(app) : null
const auth = app ? getAuth(app) : null

export { db, auth, useFirebase }

// Async getters for backward compat with code that was updated to use them
export async function getFirebaseDb() { return db }
export async function getFirebaseAuth() { return auth }
