import { NextResponse } from "next/server"
import { Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { getErrorDetails } from "@/lib/serverErrors"
import { verifyKopoKopoWebhookSignature } from "@/lib/serverPayments"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    verifyKopoKopoWebhookSignature(rawBody, request.headers.get("x-kopokopo-signature"))
    const payload = JSON.parse(rawBody) as Record<string, unknown>

    await adminDb.collection("kopokopo_events").add({
      category: "deposit_polling_callback",
      payload,
      contentType: request.headers.get("content-type"),
      userAgent: request.headers.get("user-agent"),
      receivedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(
      error,
      "Failed to process deposit polling callback.",
      500
    )

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
