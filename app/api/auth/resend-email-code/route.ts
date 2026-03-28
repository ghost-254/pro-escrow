import { NextResponse } from 'next/server'

import { normalizeEmail, validateEmailAddress } from '@/lib/authValidation'
import { adminAuth, assertFirebaseAdminConfigured } from '@/lib/firebaseAdmin'
import {
  assertEmailVerificationConfigured,
  issueEmailVerificationCode,
} from '@/lib/serverEmailVerification'
import { AuthFlowError, getSafeAuthFlowError } from '@/lib/serverAuthFlow'
import { assertSameOrigin } from '@/lib/serverAuth'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    assertFirebaseAdminConfigured()
    assertEmailVerificationConfigured()

    const body = await request.json()
    const email = normalizeEmail(body.email)
    const validationError = validateEmailAddress(email)

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError,
        },
        { status: 400 }
      )
    }

    const userRecord = await adminAuth.getUserByEmail(email)

    if (userRecord.emailVerified) {
      throw new AuthFlowError('This email address is already verified. Please sign in.', 400)
    }

    await issueEmailVerificationCode({
      email,
      userId: userRecord.uid,
      firstName: userRecord.displayName?.split(' ')[0],
    })

    return NextResponse.json({
      success: true,
      message: 'A fresh 6-digit verification code has been sent to your email.',
    })
  } catch (error) {
    const { message, status } = getSafeAuthFlowError(
      error,
      'We could not resend the verification code right now. Please try again.'
    )

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    )
  }
}
