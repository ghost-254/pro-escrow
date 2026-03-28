import { NextResponse } from "next/server"
import { Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusDepositApi } from "@/lib/cryptomusDeposit"
import { startDepositCronJob } from "@/lib/depositCronJob"
import { assertSameOrigin, requireSessionUser, SessionAuthError } from "@/lib/serverAuth"

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()
    const { amount } = await request.json()

    if (!amount) {
      return NextResponse.json(
        { success: false, error: "Missing deposit amount." },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive number." },
        { status: 400 }
      )
    }

    const depositRef = await adminDb.collection("deposits").add({
      uid: sessionUser.uid,
      method: "crypto",
      amount: numericAmount,
      status: "pending",
      transactionType: "Deposit",
      balanceCredited: false,
      createdAt: Timestamp.now(),
    })

    const depositId = depositRef.id
    const payload = {
      amount: numericAmount.toFixed(2),
      currency: "USD",
      order_id: depositId,
      url_callback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/depositCrypto/webhook` || "",
      url_return: process.env.NEXT_SERVER_CRYPTOMUS_RETURN_URL || "",
      url_success: process.env.NEXT_SERVER_CRYPTOMUS_SUCCESS_URL || "",
    }

    const cryptomusData = await callCryptomusDepositApi("payment", payload)

    if (cryptomusData.state !== 0) {
      await depositRef.update({
        status: "failed",
        updatedAt: Timestamp.now(),
      })

      return NextResponse.json(
        { success: false, error: cryptomusData.message || "Cryptomus invoice creation failed" },
        { status: 400 }
      )
    }

    await depositRef.update({
      cryptomusInvoice: cryptomusData.result,
      updatedAt: Timestamp.now(),
    })

    startDepositCronJob(depositId, sessionUser.uid, numericAmount)

    return NextResponse.json({
      success: true,
      depositId,
      invoice: cryptomusData.result,
    })
  } catch (error: Error | unknown) {
    const status = error instanceof SessionAuthError ? error.status : 500

    return NextResponse.json(
      { success: false, error: error.message || "Deposit creation failed" },
      { status }
    )
  }
}
