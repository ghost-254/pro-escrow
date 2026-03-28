import type { DecodedIdToken } from "firebase-admin/auth"

import { adminDb } from "@/lib/firebaseAdmin"

export interface UserProfileSnapshot {
  uid: string
  displayName: string
  email: string
  firstName: string
  lastName: string
  photoURL: string
}

export async function getUserProfileSnapshot(
  uid: string,
  fallback: Partial<UserProfileSnapshot> = {}
): Promise<UserProfileSnapshot> {
  const userSnapshot = await adminDb.collection("users").doc(uid).get()
  const userData = userSnapshot.data() ?? {}

  const firstName = userData.firstName || fallback.firstName || ""
  const lastName = userData.lastName || fallback.lastName || ""
  const displayName =
    userData.displayName ||
    fallback.displayName ||
    `${firstName} ${lastName}`.trim() ||
    fallback.email ||
    uid

  return {
    uid,
    displayName,
    email: userData.email || fallback.email || "",
    firstName,
    lastName,
    photoURL: userData.photoURL || fallback.photoURL || "",
  }
}

export async function getSessionUserProfile(
  sessionUser: DecodedIdToken
): Promise<UserProfileSnapshot> {
  return getUserProfileSnapshot(sessionUser.uid, {
    displayName: typeof sessionUser.name === "string" ? sessionUser.name : "",
    email: typeof sessionUser.email === "string" ? sessionUser.email : "",
  })
}
