import { NextResponse } from "next/server"
import crypto from "crypto"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"

const FINAL_FAILURE_STATUSES = ["fail", "cancel", "system_fail"]

const getPayoutApiKey = () => {
  const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_PAYOUT_API_KEY

  if (!apiKey) {
    throw new Error("Cryptomus payout configuration missing")
  }

  return apiKey
}

const generateSignature = (data: Record<string, unknown>) => {
  const apiKey = getPayoutApiKey()
  const jsonData = JSON.stringify(data)
  const base64Data = Buffer.from(jsonData).toString("base64")
  return crypto.createHash("md5").update(base64Data + apiKey).digest("hex")
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const receivedSign = payload.sign
    const calculatedSign = generateSignature(payload)

    if (receivedSign !== calculatedSign) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      )
    }

    const withdrawalRef = adminDb.collection("withdrawals").doc(payload.order_id)
    const withdrawalSnapshot = await withdrawalRef.get()

    if (!withdrawalSnapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Withdrawal not found" },
        { status: 404 }
      )
    }

    const withdrawalData = withdrawalSnapshot.data() ?? {}
    const status = payload.status || "processing"

    await adminDb.runTransaction(async (transaction) => {
      const userRef = adminDb.collection("users").doc(withdrawalData.uid)

      if (
        FINAL_FAILURE_STATUSES.includes(status) &&
        withdrawalData.balanceDeducted &&
        !withdrawalData.balanceRefunded
      ) {
        transaction.update(userRef, {
          userUsdBalance: FieldValue.increment(Number(withdrawalData.amount || 0)),
          updatedAt: Timestamp.now(),
        })
      }

      transaction.update(withdrawalRef, {
        status,
        balanceRefunded:
          FINAL_FAILURE_STATUSES.includes(status) || Boolean(withdrawalData.balanceRefunded),
        webhookPayload: payload,
        updatedAt: Timestamp.now(),
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: Error | unknown) {
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing failed" },
      { status: 500 }
    )
  }
}
