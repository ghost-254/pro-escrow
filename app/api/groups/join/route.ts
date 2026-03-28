import { NextResponse } from 'next/server'

import { getErrorDetails } from '@/lib/serverErrors'
import { joinSecureGroup } from '@/lib/serverGroups'
import { assertSameOrigin, requireSessionUser } from '@/lib/serverAuth'

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const sessionUser = await requireSessionUser()
    const payload = await request.json()
    const result = await joinSecureGroup(sessionUser, payload)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, 'Failed to join the secure group.')

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    )
  }
}
