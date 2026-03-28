import { NextResponse } from "next/server"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { assertSameOrigin, requireSessionUser, SessionAuthError } from "@/lib/serverAuth"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const K2 = require("k2-connect-node")({
  clientId: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_ID,
  clientSecret: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_SECRET,
  apiKey: process.env.NEXT_SERVER_KOPOKOPO_API_KEY,
  baseUrl: process.env.NEXT_SERVER_KOPOKOPO_BASE_URL,
})

const { PayService, TokenService } = K2

async function checkWithdrawalStatus(
  accessToken: string,
  paymentReference: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const interval = setInterval(async () => {
      try {
        const paymentUrl = `https://api.kopokopo.com/api/v1/payments/${paymentReference}`
        const response = await PayService.getStatus({ accessToken, location: paymentUrl })

        if (!response) {
          clearInterval(interval)
          return reject(new Error("No response from withdrawal status check"))
        }

        const status = response.data.attributes.status
        if (status === "Processed" || status === "Transferred" || status === "Failed") {
          clearInterval(interval)
          resolve(status)
        }
      } catch (error) {
        clearInterval(interval)
        reject(error)
      }
    }, 2000)

    setTimeout(() => {
      clearInterval(interval)
      reject(new Error("Withdrawal status check timed out"))
    }, 60000)
  })
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()
    const { firstName, lastName, phoneNumber, amount } = await request.json()

    if (!firstName || !lastName || !phoneNumber || !amount) {
      throw new Error("Missing required fields")
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount < 200) {
      return NextResponse.json(
        { success: false, error: "Minimum MPESA withdrawal is 200 KES" },
        { status: 400 }
      )
    }

    const safaricomRegex = /^\+254\d{9}$/
    if (!safaricomRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: "Only Safaricom numbers are accepted for Mpesa withdrawals" },
        { status: 400 }
      )
    }

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
        phoneNumber,
        email: sessionUser.email,
        firstName,
        lastName,
        recipientId,
        paymentReference: "",
        createdAt: Timestamp.now(),
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

    const fee = 50
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
        method: "M-Pesa",
        firstName,
        lastName,
        phoneNumber,
        amount: numericAmount,
        fee,
        netAmount,
        status: "initiated",
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
        metadata: { customerId: sessionUser.uid, notes: "Xcrow withdrawal services" },
        callbackUrl: process.env.NEXT_SERVER_KOPOKOPO_WITHDRAWAL_CALLBACK_URL,
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

      const withdrawalStatus = await checkWithdrawalStatus(accessToken, extractedPaymentReference)

      if (withdrawalStatus === "Processed" || withdrawalStatus === "Transferred") {
        await withdrawalRef.update({
          status: "completed",
          paymentReference: extractedPaymentReference,
          updatedAt: Timestamp.now(),
        })

        return NextResponse.json({
          success: true,
          newBalance: currentBalance - numericAmount,
          withdrawalStatus,
          withdrawalId,
        })
      }

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
          balanceRefunded: true,
          updatedAt: Timestamp.now(),
        })
      })

      return NextResponse.json(
        { success: false, error: "Withdrawal failed or canceled" },
        { status: 400 }
      )
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
          balanceRefunded: true,
          failureReason: error instanceof Error ? error.message : "Withdrawal failed to initialize.",
          updatedAt: Timestamp.now(),
        })
      })

      throw error
    }
  } catch (error: Error | unknown) {
    const status = error instanceof SessionAuthError ? error.status : 500
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Withdrawal failed." },
      { status }
    )
  }
}
