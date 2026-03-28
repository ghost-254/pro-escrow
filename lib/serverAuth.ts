import { cookies } from 'next/headers'
import { type DecodedIdToken } from 'firebase-admin/auth'

import { adminAuth, assertFirebaseAdminConfigured } from '@/lib/firebaseAdmin'

export const SESSION_COOKIE_NAME = 'xcrow_session'
export const COOKIE_CONSENT_NAME = 'xcrow_cookie_consent'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180

export class SessionAuthError extends Error {
  status: number

  constructor(message = 'Unauthorized', status = 401) {
    super(message)
    this.status = status
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function getConsentCookieOptions() {
  return {
    httpOnly: false,
    maxAge: COOKIE_CONSENT_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('origin')

  if (!origin) {
    return
  }

  const requestOrigin = new URL(request.url).origin

  if (origin !== requestOrigin) {
    throw new SessionAuthError('Cross-site request blocked.', 403)
  }
}

export async function createSessionCookie(idToken: string) {
  assertFirebaseAdminConfigured()
  return adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  })
}

export async function verifySessionCookieValue(sessionCookie: string) {
  assertFirebaseAdminConfigured()
  return adminAuth.verifySessionCookie(sessionCookie, true)
}

export async function getOptionalSessionUser(): Promise<DecodedIdToken | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return null
  }

  try {
    return await verifySessionCookieValue(sessionCookie)
  } catch {
    return null
  }
}

export async function requireSessionUser(): Promise<DecodedIdToken> {
  const decodedToken = await getOptionalSessionUser()

  if (!decodedToken) {
    throw new SessionAuthError()
  }

  return decodedToken
}

export async function revokeSessionCookieIfPresent() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) {
    return
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie)
    await adminAuth.revokeRefreshTokens(decodedToken.sub)
  } catch {
    // Ignore invalid or already-cleared sessions during logout.
  }
}
