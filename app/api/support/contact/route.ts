import { NextResponse } from 'next/server'
import { Timestamp } from 'firebase-admin/firestore'

import { validateEmailAddress } from '@/lib/authValidation'
import { adminDb } from '@/lib/firebaseAdmin'
import { sendSupportContactEmails } from '@/lib/emailService'
import { assertSameOrigin } from '@/lib/serverAuth'

function trimValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)

    const body = await request.json()
    const name = trimValue(body.name)
    const email = trimValue(body.email).toLowerCase()
    const message = trimValue(body.message)

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required.' },
        { status: 400 }
      )
    }

    const emailError = validateEmailAddress(email)
    if (emailError) {
      return NextResponse.json(
        { success: false, error: emailError },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required.' },
        { status: 400 }
      )
    }

    const supportRequestRef = await adminDb.collection('supportRequests').add({
      type: 'contact_form',
      name,
      email,
      message,
      createdAt: Timestamp.now(),
    })

    await sendSupportContactEmails({
      requestId: supportRequestRef.id,
      name,
      email,
      message,
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully.',
    })
  } catch (error: Error | unknown) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'We could not send your message right now.',
      },
      { status: error?.status || 500 }
    )
  }
}
