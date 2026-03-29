import { NextResponse } from "next/server"
import { Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { getErrorDetails } from "@/lib/serverErrors"
import {
  applyKopoKopoDepositUpdate,
  verifyKopoKopoWebhookSignature,
} from "@/lib/serverPayments"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    verifyKopoKopoWebhookSignature(rawBody, request.headers.get("x-kopokopo-signature"))
    const payload = JSON.parse(rawBody) as Record<string, unknown>
    const data =
      typeof payload.data === "object" && payload.data !== null
        ? (payload.data as Record<string, unknown>)
        : {}
    const attributes =
      typeof data.attributes === "object" && data.attributes !== null
        ? (data.attributes as Record<string, unknown>)
        : {}
    const metadata =
      typeof attributes.metadata === "object" && attributes.metadata !== null
        ? (attributes.metadata as Record<string, unknown>)
        : {}

    await adminDb.collection("kopokopo_events").add({
      category: "deposit_callback",
      payload,
      contentType: request.headers.get("content-type"),
      userAgent: request.headers.get("user-agent"),
      receivedAt: Timestamp.now(),
    })

    const depositId =
      typeof metadata.reference === "string" && metadata.reference.trim()
        ? metadata.reference
        : typeof metadata.depositId === "string"
          ? metadata.depositId
          : ""

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404 }
      )
    }

    await applyKopoKopoDepositUpdate({ depositId, payload })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(
      error,
      "Failed to process deposit callback.",
      500
    )

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
