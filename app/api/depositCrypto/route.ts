import { NextResponse } from "next/server"
import { Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusDepositApi } from "@/lib/cryptomusDeposit"
import { startDepositCronJob } from "@/lib/depositCronJob"
import { assertSameOrigin, requireSessionUser } from "@/lib/serverAuth"
import { getErrorDetails } from "@/lib/serverErrors"
import { parseMoneyAmount, resolveCallbackUrl } from "@/lib/serverPayments"

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()
    const { amount } = await request.json()

    const numericAmount = parseMoneyAmount(amount, "Deposit amount")

    const depositRef = await adminDb.collection("deposits").add({
      uid: sessionUser.uid,
      method: "crypto",
      currency: "USD",
      provider: "cryptomus",
      amount: numericAmount,
      status: "pending",
      providerStatus: "pending",
      transactionType: "Deposit",
      balanceCredited: false,
      createdAt: Timestamp.now(),
    })

    const depositId = depositRef.id
    const payload = {
      amount: numericAmount.toFixed(2),
      currency: "USD",
      order_id: depositId,
      url_callback: resolveCallbackUrl(request, "/api/depositCrypto/webhook"),
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
      providerStatus: String(cryptomusData.result?.status || "pending"),
      updatedAt: Timestamp.now(),
    })

    startDepositCronJob(depositId)

    return NextResponse.json({
      success: true,
      depositId,
      status: "pending",
      invoice: cryptomusData.result,
    })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, "Deposit creation failed", 500)

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
