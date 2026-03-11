import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAXwR_fU_rjkpaL8yMpCSWHGfMhvtu8k7Q",
  authDomain: "chore-app-5be59.firebaseapp.com",
  projectId: "chore-app-5be59",
  storageBucket: "chore-app-5be59.firebasestorage.app",
  messagingSenderId: "976598532541",
  appId: "1:976598532541:web:4ee4c1398517766c06d2d4"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)