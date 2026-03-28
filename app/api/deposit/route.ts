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

const { StkService, TokenService } = K2

async function checkPaymentStatus(
  accessToken: string,
  paymentRequestId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line consistent-return
    const interval = setInterval(async () => {
      try {
        const locationUrl = `https://api.kopokopo.com/api/v1/incoming_payments/${paymentRequestId}`
        const response = await StkService.getStatus({ accessToken, location: locationUrl })

        if (!response) {
          clearInterval(interval)
          return reject(new Error("No response from payment status check"))
        }

        const status = response.data.attributes.status.toLowerCase()
        if (status === "success" || status === "failed") {
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
      reject(new Error("Payment status check timed out"))
    }, 60000)
  })
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()

    const { firstName, lastName, phoneNumber, amount } = await request.json()

    if (!firstName || !lastName || !phoneNumber || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required deposit fields." },
        { status: 400 }
      )
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Deposit amount must be a positive number." },
        { status: 400 }
      )
    }

    const depositRef = await adminDb.collection("deposits").add({
      uid: sessionUser.uid,
      method: "M-Pesa",
      firstName,
      lastName,
      phoneNumber,
      email: sessionUser.email ?? null,
      amount: numericAmount,
      status: "pending",
      transactionType: "Deposit",
      createdAt: Timestamp.now(),
    })

    const depositId = depositRef.id

    const tokenResponse = await TokenService.getToken()
    const accessToken = tokenResponse.access_token
    const stkOptions = {
      paymentChannel: "M-PESA STK Push",
      tillNumber: process.env.NEXT_SERVER_KOPOKOPO_TILL_NUMBER,
      firstName,
      lastName,
      phoneNumber,
      email: sessionUser.email,
      currency: "KES",
      amount: numericAmount,
      callbackUrl: process.env.NEXT_SERVER_KOPOKOPO_CALLBACK_URL,
      accessToken,
      metadata: {
        depositId,
        uid: sessionUser.uid,
        notes: "Xcrow Payment Deposit",
      },
    }

    const responseStr = await StkService.initiateIncomingPayment(stkOptions)
    const paymentRequestId = responseStr.split("/").pop()

    if (!paymentRequestId) {
      throw new Error("Unable to extract paymentRequestId from response")
    }

    const paymentStatus = await checkPaymentStatus(accessToken, paymentRequestId)
    const finalStatus = paymentStatus === "success" ? "paid" : "failed"

    if (finalStatus === "paid") {
      await adminDb.runTransaction(async (transaction) => {
        const userRef = adminDb.collection("users").doc(sessionUser.uid)
        const userSnapshot = await transaction.get(userRef)

        if (!userSnapshot.exists) {
          transaction.set(
            userRef,
            {
              userKesBalance: numericAmount,
              userUsdBalance: 0,
              frozenUserKesBalance: 0,
              frozenUserUsdBalance: 0,
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          )
        } else {
          transaction.update(userRef, {
            userKesBalance: FieldValue.increment(numericAmount),
            updatedAt: Timestamp.now(),
          })
        }

        transaction.update(depositRef, {
          status: finalStatus,
          updatedAt: Timestamp.now(),
        })
      })
    } else {
      await depositRef.update({
        status: finalStatus,
        updatedAt: Timestamp.now(),
      })
    }

    return NextResponse.json({
      success: finalStatus === "paid",
      depositId,
      status: finalStatus,
    })
  } catch (error: Error | unknown) {
    const status = error instanceof SessionAuthError ? error.status : 500

    return NextResponse.json(
      { success: false, error: error.message || "Deposit request failed." },
      { status }
    )
  }
}
