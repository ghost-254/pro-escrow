import { NextResponse } from 'next/server'

import {
  normalizeEmail,
  normalizeVerificationCode,
  validateEmailAddress,
  validateVerificationCode,
} from '@/lib/authValidation'
import { verifyEmailVerificationCode } from '@/lib/serverEmailVerification'
import { getSafeAuthFlowError } from '@/lib/serverAuthFlow'
import { assertSameOrigin } from '@/lib/serverAuth'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const body = await request.json()
    const email = normalizeEmail(body.email)
    const code = normalizeVerificationCode(body.code)
    const validationError = validateEmailAddress(email) || validateVerificationCode(code)

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError,
        },
        { status: 400 }
      )
    }

    await verifyEmailVerificationCode({
      email,
      code,
    })

    return NextResponse.json({
      success: true,
      message: 'Your email has been verified successfully.',
    })
  } catch (error) {
    const { message, status } = getSafeAuthFlowError(
      error,
      'We could not verify that code right now. Please try again.'
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
