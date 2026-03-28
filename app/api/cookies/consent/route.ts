import { NextResponse } from 'next/server'

import { getErrorDetails } from '@/lib/serverErrors'
import {
  assertSameOrigin,
  COOKIE_CONSENT_NAME,
  getConsentCookieOptions,
} from '@/lib/serverAuth'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const { consent } = await request.json()

    if (consent !== 'essential' && consent !== 'all') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid cookie preference.',
        },
        { status: 400 }
      )
    }

    const response = NextResponse.json({ success: true, consent })
    response.cookies.set(COOKIE_CONSENT_NAME, consent, getConsentCookieOptions())

    return response
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, 'Failed to store cookie preferences.')

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    )
  }
}
