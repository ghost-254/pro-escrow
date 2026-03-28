import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  type Auth,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean)

const createMissingFirebaseService = <T>(serviceName: string) =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(
          `Missing Firebase configuration. Set the NEXT_PUBLIC_FIREBASE_* environment variables before using ${serviceName}.`
        )
      },
    }
  ) as T

const app: FirebaseApp = hasFirebaseConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : createMissingFirebaseService<FirebaseApp>('the Firebase app')

const auth: Auth = hasFirebaseConfig
  ? getAuth(app)
  : createMissingFirebaseService<Auth>('Firebase Auth')

const db: Firestore = hasFirebaseConfig
  ? getFirestore(app)
  : createMissingFirebaseService<Firestore>('Cloud Firestore')

const storage: FirebaseStorage = hasFirebaseConfig
  ? getStorage(app)
  : createMissingFirebaseService<FirebaseStorage>('Firebase Storage')

const firestore = db

if (hasFirebaseConfig && typeof window !== 'undefined') {
  void setPersistence(auth, browserLocalPersistence).catch(() => {
    /* eslint-disable-next-line no-console */
    console.error('Failed to set Firebase auth persistence')
  })
}

export { app, auth, db, storage, firestore }
