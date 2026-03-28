import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'

import { adminDb } from '@/lib/firebaseAdmin'
import { sendGroupSupportEmails } from '@/lib/emailService'
import { assertSameOrigin, requireSessionUser, SessionAuthError } from '@/lib/serverAuth'

function trimValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()

    const body = await request.json()
    const reason = trimValue(body.reason)
    const comments = trimValue(body.comments)
    const groupUrl = trimValue(body.groupUrl)

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required.' },
        { status: 400 }
      )
    }

    const userSnapshot = await adminDb.collection('users').doc(sessionUser.uid).get()
    const userData = userSnapshot.data() ?? {}
    const requesterName =
      trimValue(userData.fullName) ||
      trimValue(userData.firstName) ||
      trimValue(sessionUser.name) ||
      'XcrowTrust User'
    const requesterEmail = trimValue(sessionUser.email)

    if (!requesterEmail) {
      return NextResponse.json(
        { success: false, error: 'Your account email is required before contacting support.' },
        { status: 400 }
      )
    }

    const supportRequestRef = await adminDb.collection('supportRequests').add({
      type: 'group_support',
      userId: sessionUser.uid,
      requesterName,
      requesterEmail,
      reason,
      comments,
      groupUrl,
      createdAt: Timestamp.now(),
    })

    await sendGroupSupportEmails({
      requestId: supportRequestRef.id,
      requesterName,
      requesterEmail,
      userId: sessionUser.uid,
      reason,
      comments,
      groupUrl,
    })

    return NextResponse.json({
      success: true,
      message: 'Support request sent. Please wait for assistance.',
    })
  } catch (error: Error | unknown) {
    const status = error instanceof SessionAuthError ? error.status : error?.status || 500

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'We could not send the support request right now.',
      },
      { status }
    )
  }
}
