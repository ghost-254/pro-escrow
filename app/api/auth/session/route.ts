import { NextResponse } from 'next/server'

import { adminAuth, adminDb, assertFirebaseAdminConfigured } from '@/lib/firebaseAdmin'
import {
  assertSameOrigin,
  createSessionCookie,
  getSessionCookieOptions,
  revokeSessionCookieIfPresent,
  SESSION_COOKIE_NAME,
  SessionAuthError,
} from '@/lib/serverAuth'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    assertFirebaseAdminConfigured()

    const { idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json(
        { success: false, error: 'Missing Firebase ID token.' },
        { status: 400 }
      )
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken)

    if (!decodedToken.email_verified) {
      return NextResponse.json(
        { success: false, error: 'Complete your email verification before signing in.' },
        { status: 403 }
      )
    }

    const userSnapshot = await adminDb.collection('users').doc(decodedToken.uid).get()
    const signupStatus = userSnapshot.data()?.signupStatus

    if (!userSnapshot.exists || signupStatus === 'pending_verification') {
      return NextResponse.json(
        { success: false, error: 'Complete your signup before signing in.' },
        { status: 403 }
      )
    }

    const sessionCookie = await createSessionCookie(idToken)
    const response = NextResponse.json({ success: true })

    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions())

    return response
  } catch (error: Error | unknown) {
    let statusCode = 401
    let errorMessage = 'Failed to establish session.'
    if (error instanceof SessionAuthError) {
      statusCode = error.status
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request)
    await revokeSessionCookieIfPresent()

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      ...getSessionCookieOptions(),
      maxAge: 0,
    })

    return response
  } catch (error: Error | unknown) {
    let statusCode = 400
    let errorMessage = 'Failed to clear session.'
    if (error instanceof SessionAuthError) {
      statusCode = error.status
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    )
  }
}
