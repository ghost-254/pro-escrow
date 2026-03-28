import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

const projectId =
  process.env.NEXT_SERVER_FIREBASE_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  ''

const clientEmail = process.env.NEXT_SERVER_FIREBASE_CLIENT_EMAIL ?? ''
const privateKey = (process.env.NEXT_SERVER_FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
const storageBucket =
  process.env.NEXT_SERVER_FIREBASE_STORAGE_BUCKET ??
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
  ''

const hasServiceAccountCredentials = Boolean(projectId && clientEmail && privateKey)

const firebaseAdminApp = getApps().length
  ? getApp()
  : initializeApp(
      hasServiceAccountCredentials
        ? {
            credential: cert({
              projectId,
              clientEmail,
              privateKey,
            }),
            projectId,
            storageBucket,
          }
        : {
            projectId,
            storageBucket,
          }
    )

export const adminAuth = getAuth(firebaseAdminApp)
export const adminDb = getFirestore(firebaseAdminApp)

export function assertFirebaseAdminConfigured() {
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin SDK credentials. Set NEXT_SERVER_FIREBASE_PROJECT_ID, NEXT_SERVER_FIREBASE_CLIENT_EMAIL, and NEXT_SERVER_FIREBASE_PRIVATE_KEY.'
    )
  }
}
