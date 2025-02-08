/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any */

import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore"

const K2 = require("k2-connect-node")({
  clientId: process.env.NEXT_PUBLIC_KOPOKOPO_CLIENT_ID,
  clientSecret: process.env.NEXT_PUBLIC_KOPOKOPO_CLIENT_SECRET,
  apiKey: process.env.NEXT_PUBLIC_KOPOKOPO_API_KEY,
  baseUrl: process.env.NEXT_PUBLIC_KOPOKOPO_BASE_URL,
})

const StkService = K2.StkService
const TokenService = K2.TokenService

// Helper: Check payment status every 2 seconds (with a 60-second timeout)
async function checkPaymentStatus(
  accessToken: string,
  paymentRequestId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const locationUrl = `https://api.kopokopo.com/api/v1/incoming_payments/${paymentRequestId}`

        const response = await StkService.getStatus({
          accessToken,
          location: locationUrl,
        })

        if (!response) {
          clearInterval(interval)
          reject("No response from payment status check")
          return
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
      reject("Payment status check timed out")
    }, 60000)
  })
}

export async function POST(request: Request) {
  const { firstName, lastName, phoneNumber, email, amount } = await request.json()

  try {
    // 1. Create a deposit document with initial status "pending"
    const depositData = {
      firstName,
      lastName,
      phoneNumber,
      email,
      amount,
      depositMethod: "M-Pesa",
      status: "pending",
      createdAt: Timestamp.now(),
    }
    const depositRef = await addDoc(collection(db, "deposits"), depositData)
    const depositDocId = depositRef.id

    // 2. Get access token for Kopokopo and prepare STK push options.
    const tokenResponse = await TokenService.getToken()
    const accessToken = tokenResponse.access_token

    const stkOptions = {
      paymentChannel: "M-PESA STK Push",
      tillNumber: process.env.NEXT_PUBLIC_KOPOKOPO_TILL_NUMBER,
      firstName,
      lastName,
      phoneNumber,
      email,
      currency: "KES",
      amount,
      callbackUrl: process.env.NEXT_PUBLIC_KOPOKOPO_CALLBACK_URL,
      accessToken,
      metadata: {
        customerId: "123456789",
        reference: "REF123456",
        notes: "Xcrow Payment Deposit",
      },
    }

    // 3. Initiate the STK push and extract the paymentRequestId.
    const responseStr = await StkService.initiateIncomingPayment(stkOptions)
    const paymentRequestId = responseStr.split("/").pop()
    if (!paymentRequestId) {
      throw new Error("Unable to extract paymentRequestId from response")
    }

    // 4. Poll for payment status.
    const paymentStatus = await checkPaymentStatus(accessToken, paymentRequestId)
    const newStatus = paymentStatus === "success" ? "paid" : "failed"

    // 5. Update the deposit document with the final status.
    await updateDoc(doc(db, "deposits", depositDocId), { status: newStatus })

    if (newStatus === "paid") {
      return NextResponse.json({ success: true, depositId: depositDocId, newStatus })
    } else {
      return NextResponse.json(
        { success: false, error: "Payment failed or canceled" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || error.toString() },
      { status: 500 }
    )
  }
}
