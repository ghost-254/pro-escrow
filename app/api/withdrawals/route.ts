import { NextResponse } from "next/server"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { assertSameOrigin, requireSessionUser, SessionAuthError } from "@/lib/serverAuth"
import { getErrorDetails } from "@/lib/serverErrors"
import {
  MPESA_WITHDRAWAL_FEE_KES,
  MPESA_WITHDRAWAL_MIN_KES,
  normalizeKenyanPhoneNumber,
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

const { PayService, TokenService } = K2

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()
    const payload = await request.json()
    const firstName = sanitizePersonName(payload.firstName, "First name")
    const lastName = sanitizePersonName(payload.lastName, "Last name")
    const phoneNumber = normalizeKenyanPhoneNumber(payload.phoneNumber)
    const numericAmount = parseMoneyAmount(payload.amount, "Withdrawal amount", {
      min: MPESA_WITHDRAWAL_MIN_KES,
    })

    const userRef = adminDb.collection("users").doc(sessionUser.uid)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const userData = userSnapshot.data() ?? {}
    const currentBalance = Number(userData.userKesBalance || 0)
    if (currentBalance < numericAmount) {
      return NextResponse.json(
        { success: false, error: "Insufficient KES balance for withdrawal" },
        { status: 400 }
      )
    }

    const accessTokenResponse = await TokenService.getToken()
    const accessToken = accessTokenResponse.access_token

    const walletQuery = await adminDb
      .collection("userWithdrawals")
      .where("phoneNumber", "==", phoneNumber)
      .limit(1)
      .get()

    const walletRecord = walletQuery.empty ? null : walletQuery.docs[0]

    if (!walletRecord) {
      const recipientRequest = {
        type: "mobile_wallet",
        firstName,
        lastName,
        email: sessionUser.email,
        phoneNumber,
        network: "Safaricom",
        accessToken,
      }

      const recipientResponse = await PayService.addPayRecipient(recipientRequest)
      const recipientUrl =
        typeof recipientResponse === "string"
          ? recipientResponse
          : recipientResponse?.headers?.location

      if (!recipientUrl) {
        throw new Error("No recipient URL returned from addPayRecipient")
      }

      const recipientDetails = await PayService.getStatus({ accessToken, location: recipientUrl })
      const recipientId =
        recipientDetails?.data?.id ||
        (recipientDetails?.data?.attributes && recipientDetails.data.attributes.id)

      await adminDb.collection("userWithdrawals").add({
        uid: sessionUser.uid,
        phoneNumber,
        email: sessionUser.email,
        firstName,
        lastName,
        recipientId,
        paymentReference: "",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Your withdrawal wallet is unverified. Please reach out to support!",
        },
        { status: 400 }
      )
    }

    const walletData = walletRecord.data()
    if (walletData.email !== sessionUser.email) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The email associated with this withdrawal wallet does not match your account. Please contact support.",
        },
        { status: 400 }
      )
    }

    if (!walletData.paymentReference) {
      return NextResponse.json(
        {
          success: false,
          error: "Your withdrawal wallet is unverified. Please reach out to support!",
        },
        { status: 400 }
      )
    }

    const fee = MPESA_WITHDRAWAL_FEE_KES
    const netAmount = numericAmount - fee
    const withdrawalRef = adminDb.collection("withdrawals").doc()
    const withdrawalId = withdrawalRef.id

    await adminDb.runTransaction(async (transaction) => {
      const latestUserSnapshot = await transaction.get(userRef)
      const latestBalance = Number(latestUserSnapshot.data()?.userKesBalance || 0)

      if (latestBalance < numericAmount) {
        throw new Error("Insufficient KES balance for withdrawal")
      }

      transaction.update(userRef, {
        userKesBalance: FieldValue.increment(-numericAmount),
        updatedAt: Timestamp.now(),
      })

      transaction.set(withdrawalRef, {
        uid: sessionUser.uid,
        currency: "KES",
        provider: "kopokopo",
        method: "M-Pesa",
        firstName,
        lastName,
        phoneNumber,
        amount: numericAmount,
        fee,
        netAmount,
        status: "pending",
        providerStatus: "pending",
        transactionType: "Withdraw",
        balanceDeducted: true,
        balanceRefunded: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    })

    try {
      const paymentRequest = {
        destinationType: "mobile_wallet",
        destinationReference: walletData.paymentReference,
        amount: String(netAmount),
        currency: "KES",
        description: "General",
        category: "general",
        tags: "withdrawal",
        metadata: {
          customerId: sessionUser.uid,
          withdrawalId,
          notes: "Xcrow withdrawal services",
        },
        callbackUrl: resolveCallbackUrl(
          request,
          "/api/withdrawals/webhook",
          process.env.NEXT_SERVER_KOPOKOPO_WITHDRAWAL_CALLBACK_URL
        ),
        accessToken,
      }

      const paymentResponse = await PayService.sendPay(paymentRequest)
      const paymentUrl =
        typeof paymentResponse === "string"
          ? paymentResponse
          : paymentResponse?.headers?.location
      const extractedPaymentReference = paymentUrl?.split("/").pop()

      if (!extractedPaymentReference) {
        throw new Error("Unable to extract payment reference")
      }

      await withdrawalRef.update({
        status: "processing",
        providerStatus: "sent",
        paymentReference: extractedPaymentReference,
        providerLocation: paymentUrl || null,
        updatedAt: Timestamp.now(),
      })

      return NextResponse.json({
        success: true,
        newBalance: currentBalance - numericAmount,
        status: "processing",
        withdrawalId,
      })
    } catch (error: Error | unknown) {
      await adminDb.runTransaction(async (transaction) => {
        const latestWithdrawalSnapshot = await transaction.get(withdrawalRef)
        const latestWithdrawalData = latestWithdrawalSnapshot.data() ?? {}

        if (latestWithdrawalData.balanceDeducted && !latestWithdrawalData.balanceRefunded) {
          transaction.update(userRef, {
            userKesBalance: FieldValue.increment(numericAmount),
            updatedAt: Timestamp.now(),
          })
        }

        transaction.update(withdrawalRef, {
          status: "failed",
          providerStatus: "failed",
          balanceRefunded: true,
          failureReason: error instanceof Error ? error.message : "Withdrawal failed to initialize.",
          updatedAt: Timestamp.now(),
        })
      })

      throw error
    }
  } catch (error: Error | unknown) {
    const sessionStatus = error instanceof SessionAuthError ? error.status : undefined
    const { message, status } = getErrorDetails(
      error,
      "Withdrawal failed.",
      sessionStatus ?? 400
    )
    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
