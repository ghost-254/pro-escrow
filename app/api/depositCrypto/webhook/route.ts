import { NextResponse } from "next/server"
import { Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { getErrorDetails } from "@/lib/serverErrors"
import {
  applyCryptomusDepositUpdate,
  verifyCryptomusWebhookSignature,
} from "@/lib/serverPayments"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const { payload, unsignedPayload } = verifyCryptomusWebhookSignature(
      rawBody,
      process.env.NEXT_SERVER_CRYPTOMUS_API_KEY,
      "Cryptomus configuration"
    )

    if (!unsignedPayload.order_id || !unsignedPayload.status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields in payload" },
        { status: 400 }
      )
    }

    await adminDb.collection("cryptomus_events").add({
      category: "deposit_callback",
      payload,
      receivedAt: Timestamp.now(),
    })

    await applyCryptomusDepositUpdate({
      depositId: String(unsignedPayload.order_id),
      payload: unsignedPayload,
      providerStatus: unsignedPayload.status,
      isFinal: unsignedPayload.is_final,
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, "Webhook processing failed", 500)

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
