import { NextResponse } from 'next/server'

import { getErrorDetails } from '@/lib/serverErrors'
import { applySecureGroupAction } from '@/lib/serverGroups'
import { assertSameOrigin, requireSessionUser } from '@/lib/serverAuth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    assertSameOrigin(request)

    const sessionUser = await requireSessionUser()
    const payload = await request.json()
    const { groupId } = await params
    const result = await applySecureGroupAction(sessionUser, groupId, payload)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, 'Failed to update the secure group action.')

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    )
  }
}
