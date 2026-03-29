import { NextResponse } from "next/server"
import { Timestamp, type DocumentReference } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { assertSameOrigin, requireSessionUser, SessionAuthError } from "@/lib/serverAuth"
import { getErrorDetails } from "@/lib/serverErrors"
import {
  normalizeKenyanPhoneNumber,
  initiateKopoKopoIncomingPayment,
  parseMoneyAmount,
  resolveCallbackUrl,
  sanitizePersonName,
} from "@/lib/serverPayments"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const K2 = require("k2-connect-node")({
  clientId: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_ID,
  clientSecret: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_SECRET,
  apiKey: process.env.NEXT_SERVER_KOPOKOPO_API_KEY,
  baseUrl: process.env.NEXT_SERVER_KOPOKOPO_BASE_URL,
})

const { TokenService } = K2

export async function POST(request: Request) {
  let depositRef: DocumentReference | null = null

  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()
    const payload = await request.json()
    const firstName = sanitizePersonName(payload.firstName, "First name")
    const lastName = sanitizePersonName(payload.lastName, "Last name")
    const phoneNumber = normalizeKenyanPhoneNumber(payload.phoneNumber)
    const numericAmount = parseMoneyAmount(payload.amount, "Deposit amount")

    depositRef = await adminDb.collection("deposits").add({
      uid: sessionUser.uid,
      method: "M-Pesa",
      currency: "KES",
      provider: "kopokopo",
      firstName,
      lastName,
      phoneNumber,
      email: sessionUser.email ?? null,
      amount: numericAmount,
      status: "pending",
      providerStatus: "pending",
      transactionType: "Deposit",
      balanceCredited: false,
      createdAt: Timestamp.now(),
    })

    const depositId = depositRef.id

    const tokenResponse = await TokenService.getToken()
    const accessToken = tokenResponse.access_token
    const tillNumber = process.env.NEXT_SERVER_KOPOKOPO_TILL_NUMBER?.trim()

    if (!tillNumber) {
      throw new Error("KopoKopo till number is not configured.")
    }

    const callbackUrl = resolveCallbackUrl(
      request,
      "/api/deposit/webhook",
      process.env.NEXT_SERVER_KOPOKOPO_CALLBACK_URL
    )
    const { responseLocation, paymentRequestId } = await initiateKopoKopoIncomingPayment({
      accessToken,
      tillNumber,
      firstName,
      lastName,
      phoneNumber,
      email: sessionUser.email,
      amount: numericAmount,
      callbackUrl,
      metadata: {
        customer_id: sessionUser.uid,
        reference: depositId,
        depositId,
        uid: sessionUser.uid,
        notes: "Xcrow Payment Deposit",
      },
    })

    await depositRef.update({
      paymentRequestId,
      providerLocation: responseLocation,
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({
      success: true,
      depositId,
      status: "pending",
      message: "STK push sent. Approve the payment on your phone to complete the deposit.",
    })
  } catch (error: unknown) {
    if (depositRef) {
      await depositRef.update({
        status: "failed",
        providerStatus: "failed",
        failureReason: error instanceof Error ? error.message : "Deposit request failed.",
        updatedAt: Timestamp.now(),
      })
    }

    const sessionStatus = error instanceof SessionAuthError ? error.status : undefined
    const { message, status } = getErrorDetails(
      error,
      "Deposit request failed.",
      sessionStatus ?? 400
    )

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
