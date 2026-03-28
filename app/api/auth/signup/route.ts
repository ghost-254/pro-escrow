import { NextResponse } from 'next/server'

import {
  normalizeEmail,
  normalizePhoneNumber,
  validateEmailAddress,
  validateName,
  validatePasswordStrength,
  validatePhoneNumber,
} from '@/lib/authValidation'
import { adminAuth, adminDb, assertFirebaseAdminConfigured } from '@/lib/firebaseAdmin'
import {
  assertEmailVerificationConfigured,
  issueEmailVerificationCode,
} from '@/lib/serverEmailVerification'
import { getSafeAuthFlowError } from '@/lib/serverAuthFlow'
import { assertSameOrigin } from '@/lib/serverAuth'

export async function POST(request: Request) {
  let createdUserId: string | null = null
  let verificationEmail = ''

  try {
    assertSameOrigin(request)
    assertFirebaseAdminConfigured()
    assertEmailVerificationConfigured()

    const body = await request.json()
    const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : ''
    const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : ''
    const phoneNumber = normalizePhoneNumber(body.phoneNumber)
    const email = normalizeEmail(body.email)
    const password = typeof body.password === 'string' ? body.password : ''
    const displayName = `${firstName} ${lastName}`.trim()

    const validationError =
      validateName(firstName, 'First name') ||
      validateName(lastName, 'Last name') ||
      validatePhoneNumber(phoneNumber) ||
      validateEmailAddress(email) ||
      validatePasswordStrength(password)

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError,
        },
        { status: 400 }
      )
    }

    verificationEmail = email

    try {
      const existingUser = await adminAuth.getUserByEmail(email)

      if (existingUser.emailVerified) {
        return NextResponse.json(
          {
            success: false,
            error: 'An account with this email already exists. Sign in instead.',
          },
          { status: 409 }
        )
      }

      await issueEmailVerificationCode({
        email,
        userId: existingUser.uid,
        firstName,
      })

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        email,
        message:
          'Your account is pending email verification. We sent a fresh 6-digit code to your inbox.',
      })
    } catch (error) {
      const isUserNotFound =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'auth/user-not-found'

      if (!isUserNotFound) {
        throw error
      }
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    })

    createdUserId = userRecord.uid

    const createdAt = new Date().toISOString()

    await adminDb.collection('users').doc(userRecord.uid).set(
      {
        firstName,
        lastName,
        fullName: displayName,
        phoneNumber,
        email,
        countryCode: '',
        photoURL: '',
        cryptoBEP20: '',
        binanceId: '',
        paypal: '',
        mpesa: '',
        userUsdBalance: 0,
        userKesBalance: 0,
        frozenUserUsdBalance: 0,
        frozenUserKesBalance: 0,
        emailVerified: false,
        signupStatus: 'pending_verification',
        createdAt,
        updatedAt: createdAt,
      },
      { merge: true }
    )

    await issueEmailVerificationCode({
      email,
      userId: userRecord.uid,
      firstName,
    })

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email,
      message: 'We sent a 6-digit verification code to your email address.',
    })
  } catch (error) {
    if (createdUserId) {
      await adminAuth.deleteUser(createdUserId).catch(() => null)
      await adminDb.collection('users').doc(createdUserId).delete().catch(() => null)
    }

    const { message, status } = getSafeAuthFlowError(
      error,
      'We could not start signup right now. Please try again.'
    )

    return NextResponse.json(
      {
        success: false,
        error: message,
        email: verificationEmail || undefined,
      },
      { status }
    )
  }
}
