// app/api/deposit/route.ts
/* eslint-disable */
import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { collection, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore"

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
    const interval = setInterval(async () => {
      try {
        const locationUrl = `https://api.kopokopo.com/api/v1/incoming_payments/${paymentRequestId}`
        const response = await StkService.getStatus({ accessToken, location: locationUrl })
        if (!response) {
          clearInterval(interval)
          return reject("No response from payment status check")
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
    return () => clearInterval(interval)
  })
 
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, phoneNumber, email, uid, amount } = await request.json()

    // Create a deposit document with default status "pending"
    const depositData = {
      uid,
      method: "M-Pesa",
      firstName,
      lastName,
      phoneNumber,
      email,
      amount: Number(amount),
      status: "pending",
      transactionType: "Deposit",
      createdAt: Timestamp.now(),
    }
    const depositRef = await addDoc(collection(db, "deposits"), depositData)
    const depositId = depositRef.id

    // Get access token and initiate STK push.
    const tokenResponse = await TokenService.getToken()
    const accessToken = tokenResponse.access_token
    const stkOptions = {
      paymentChannel: "M-PESA STK Push",
      tillNumber: process.env.NEXT_SERVER_KOPOKOPO_TILL_NUMBER,
      firstName,
      lastName,
      phoneNumber,
      email,
      currency: "KES",
      amount,
      callbackUrl: process.env.NEXT_SERVER_KOPOKOPO_CALLBACK_URL,
      accessToken,
      metadata: {
        depositId,
        uid,
        notes: "Xcrow Payment Deposit",
      },
    }

    const responseStr = await StkService.initiateIncomingPayment(stkOptions)
    const paymentRequestId = responseStr.split("/").pop()
    if (!paymentRequestId) throw new Error("Unable to extract paymentRequestId from response")

    // Poll for payment status.
    const paymentStatus = await checkPaymentStatus(accessToken, paymentRequestId)
    const finalStatus = paymentStatus === "success" ? "paid" : "failed"

    // Update deposit record.
    await updateDoc(doc(db, "deposits", depositId), { status: finalStatus })

    return NextResponse.json({ success: finalStatus === "paid", depositId, status: finalStatus })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 })
  }
}
