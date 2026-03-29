import { NextResponse } from "next/server"
import { Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { getErrorDetails } from "@/lib/serverErrors"
import {
  applyCryptomusPayoutUpdate,
  verifyCryptomusWebhookSignature,
} from "@/lib/serverPayments"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const { payload, unsignedPayload } = verifyCryptomusWebhookSignature(
      rawBody,
      process.env.NEXT_SERVER_CRYPTOMUS_PAYOUT_API_KEY,
      "Cryptomus payout configuration"
    )

    if (!unsignedPayload.order_id || !unsignedPayload.status) {
      return NextResponse.json(
        { success: false, error: "Missing required payout fields." },
        { status: 400 }
      )
    }

    await adminDb.collection("cryptomus_events").add({
      category: "payout_callback",
      payload,
      receivedAt: Timestamp.now(),
    })

    await applyCryptomusPayoutUpdate({
      withdrawalId: String(unsignedPayload.order_id),
      payload: unsignedPayload,
      providerStatus: unsignedPayload.status,
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
