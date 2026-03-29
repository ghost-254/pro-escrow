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
  syncMpesaDepositStatusForUser,
} from "@/lib/serverPayments"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const K2 = require("k2-connect-node")({
  clientId: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_ID,
  clientSecret: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_SECRET,
  apiKey: process.env.NEXT_SERVER_KOPOKOPO_API_KEY,
  baseUrl: process.env.NEXT_SERVER_KOPOKOPO_BASE_URL,
})

const { TokenService } = K2
const REUSABLE_MPESA_DEPOSIT_STATUSES = new Set([
  "pending",
  "processing",
  "initiated",
  "sent",
  "confirm_check",
  "queued",
  "submitted",
])
const EXISTING_PENDING_MPESA_MESSAGE =
  "You already have an M-Pesa payment request in progress on this phone. Please complete it on your phone or wait a moment before trying again."

function hasReusablePendingMpesaStatus(status: unknown) {
  return REUSABLE_MPESA_DEPOSIT_STATUSES.has(String(status || "").toLowerCase())
}

function isPendingPhoneRequestError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  return message.includes("pending request for the phone number")
}

async function findReusablePendingMpesaDeposit(uid: string, phoneNumber: string) {
  const snapshot = await adminDb
    .collection("deposits")
    .where("uid", "==", uid)
    .where("method", "==", "M-Pesa")
    .where("phoneNumber", "==", phoneNumber)
    .get()

  const candidates = snapshot.docs
    .filter((docSnap) => hasReusablePendingMpesaStatus(docSnap.data()?.status))
    .sort((left, right) => {
      const leftMillis = left.data()?.createdAt?.toMillis?.() ?? 0
      const rightMillis = right.data()?.createdAt?.toMillis?.() ?? 0
      return rightMillis - leftMillis
    })

  for (const docSnap of candidates) {
    try {
      await syncMpesaDepositStatusForUser(uid, docSnap.id)
    } catch {
      // Ignore reconciliation failures here and fall back to the stored status.
    }

    const refreshedSnapshot = await docSnap.ref.get()
    const refreshedData = refreshedSnapshot.data() ?? {}

    if (hasReusablePendingMpesaStatus(refreshedData.status)) {
      return {
        depositId: refreshedSnapshot.id,
      }
    }
  }

  return null
}

export async function POST(request: Request) {
  let depositRef: DocumentReference | null = null
  let sessionUid = ""
  let requestedPhoneNumber = ""

  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()
    sessionUid = sessionUser.uid
    const payload = await request.json()
    const firstName = sanitizePersonName(payload.firstName, "First name")
    const lastName = sanitizePersonName(payload.lastName, "Last name")
    const phoneNumber = normalizeKenyanPhoneNumber(payload.phoneNumber)
    requestedPhoneNumber = phoneNumber
    const numericAmount = parseMoneyAmount(payload.amount, "Deposit amount")
    const existingPendingDeposit = await findReusablePendingMpesaDeposit(
      sessionUser.uid,
      phoneNumber
    )

    if (existingPendingDeposit) {
      return NextResponse.json({
        success: true,
        depositId: existingPendingDeposit.depositId,
        status: "pending",
        message: EXISTING_PENDING_MPESA_MESSAGE,
      })
    }

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
    /* eslint-disable-next-line no-console */
    console.error("Failed to initiate M-Pesa deposit", error)

    if (depositRef) {
      try {
        await depositRef.update({
          status: "failed",
          providerStatus: "failed",
          failureReason: error instanceof Error ? error.message : "Deposit request failed.",
          updatedAt: Timestamp.now(),
        })
      } catch (updateError) {
        /* eslint-disable-next-line no-console */
        console.error("Failed to update deposit after M-Pesa initiation error", updateError)
      }
    }

    if (isPendingPhoneRequestError(error)) {
      const existingPendingDeposit =
        sessionUid && requestedPhoneNumber
          ? await findReusablePendingMpesaDeposit(sessionUid, requestedPhoneNumber)
          : null

      if (existingPendingDeposit) {
        return NextResponse.json({
          success: true,
          depositId: existingPendingDeposit.depositId,
          status: "pending",
          message: EXISTING_PENDING_MPESA_MESSAGE,
        })
      }

      return NextResponse.json(
        { success: false, error: EXISTING_PENDING_MPESA_MESSAGE },
        { status: 409 }
      )
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
