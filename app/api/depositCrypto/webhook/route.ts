import { NextResponse } from "next/server"
import crypto from "crypto"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { getErrorDetails } from "@/lib/serverErrors"

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const data = JSON.parse(rawBody)
    const receivedSign = data.sign
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const { sign: _sign, ...payload } = data

    if (!payload.order_id || !payload.status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields in payload" },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 500 }
      )
    }

    const generatedSign = crypto
      .createHash("md5")
      .update(Buffer.from(JSON.stringify(payload)).toString("base64") + apiKey)
      .digest("hex")

    if (generatedSign !== receivedSign) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      )
    }

    const depositRef = adminDb.collection("deposits").doc(payload.order_id)
    const depositSnapshot = await depositRef.get()

    if (!depositSnapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404 }
      )
    }

    const depositData = depositSnapshot.data() ?? {}

    if (
      (payload.status === "paid" || payload.status === "paid_over") &&
      !depositData.balanceCredited
    ) {
      await adminDb.runTransaction(async (transaction) => {
        const latestDepositSnapshot = await transaction.get(depositRef)
        const latestDepositData = latestDepositSnapshot.data() ?? {}

        if (latestDepositData.balanceCredited) {
          transaction.update(depositRef, {
            status: payload.status,
            cryptomusInvoice: { ...payload },
            updatedAt: Timestamp.now(),
          })
          return
        }

        const userRef = adminDb.collection("users").doc(depositData.uid)
        const userSnapshot = await transaction.get(userRef)

        if (!userSnapshot.exists) {
          transaction.set(
            userRef,
            {
              userKesBalance: 0,
              userUsdBalance: Number(payload.amount || 0),
              frozenUserKesBalance: 0,
              frozenUserUsdBalance: 0,
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          )
        } else {
          transaction.update(userRef, {
            userUsdBalance: FieldValue.increment(Number(payload.amount || 0)),
            updatedAt: Timestamp.now(),
          })
        }

        transaction.update(depositRef, {
          status: payload.status,
          balanceCredited: true,
          cryptomusInvoice: { ...payload },
          updatedAt: Timestamp.now(),
        })
      })
    } else {
      await depositRef.update({
        status: payload.status,
        cryptomusInvoice: { ...payload },
        updatedAt: Timestamp.now(),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, "Webhook processing failed", 500)

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
