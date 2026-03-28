import { NextResponse } from "next/server"
import { Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null)

    await adminDb.collection("kopokopo_events").add({
      category: "withdrawal_callback",
      payload,
      contentType: request.headers.get("content-type"),
      userAgent: request.headers.get("user-agent"),
      receivedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error: Error | unknown) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process withdrawal callback." },
      { status: 500 }
    )
  }
}
