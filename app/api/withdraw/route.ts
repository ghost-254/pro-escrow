// app/api/withdrawal/route.ts
/* eslint-disable */

import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from "firebase/firestore"

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
    const interval = setInterval(async () => {
      try {
        const paymentUrl = `https://api.kopokopo.com/api/v1/payments/${paymentReference}`
        const response = await PayService.getStatus({ accessToken, location: paymentUrl })
        if (!response) {
          clearInterval(interval)
          return reject("No response from withdrawal status check")
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
      reject("Withdrawal status check timed out")
    }, 60000)
  })
}

export async function POST(request: Request) {
  try {
    const { firstName, lastName, phoneNumber, amount, uid } = await request.json()
    if (!firstName || !lastName || !phoneNumber || !amount || !uid) {
      throw new Error("Missing required fields")
    }
    // Ensure MPESA withdrawal amount is at least 200 KES.
    if (Number(amount) < 200) {
      return NextResponse.json(
        { success: false, error: "Minimum MPESA withdrawal is 200 KES" },
        { status: 400 }
      )
    }
    // Validate Safaricom number.
    const safaricomRegex = /^\+254\d{9}$/
    if (!safaricomRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: "Only Safaricom numbers are accepted for Mpesa withdrawals" },
        { status: 400 }
      )
    }
    // Check user's current KES balance.
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }
    const userData = userSnap.data()
    const currentBalance = Number(userData.userKesBalance || 0)
    if (currentBalance < Number(amount)) {
      return NextResponse.json(
        { success: false, error: "Insufficient KES balance for withdrawal" },
        { status: 400 }
      )
    }
    
    // Calculate fee and net amount.
    const fee = 50
    const netAmount = Number(amount) - fee

    // Create withdrawal record.
    const withdrawalData = {
      uid,
      method: "M-Pesa",
      firstName,
      lastName,
      phoneNumber,
      amount: Number(amount),
      fee,
      netAmount,
      status: "pending",
      transactionType: "Withdraw",
      createdAt: Timestamp.now(),
    }
    const withdrawalRef = await addDoc(collection(db, "withdrawals"), withdrawalData)
    const withdrawalId = withdrawalRef.id

    // Obtain access token.
    const tokenResponse = await TokenService.getToken()
    const accessToken = tokenResponse.access_token

    // Add pay recipient.
    const recipientRequest = {
      type: 'mobile_wallet',
      firstName,
      lastName,
      email: "",
      phoneNumber,
      network: 'Safaricom',
      accessToken,
    }
    const recipientResponseStr = await PayService.addPayRecipient(recipientRequest)
    const recipientReference = recipientResponseStr.split("/").pop()
    if (!recipientReference) throw new Error("Unable to extract recipient reference")

    // Initiate withdrawal payment.
    const paymentRequest = {
      destinationType: 'mobile_wallet',
      destinationReference: recipientReference,
      amount: String(amount),
      currency: 'KES',
      description: 'General',
      category: 'general',
      tags: ['withdrawal'],
      metadata: { customerId: uid, notes: 'Xcrow withdrawal services' },
      callbackUrl: process.env.NEXT_SERVER_KOPOKOPO_CALLBACK_URL,
      accessToken,
    }
    const paymentResponseStr = await PayService.sendPay(paymentRequest)
    const paymentReference = paymentResponseStr.split("/").pop()
    if (!paymentReference) throw new Error("Unable to extract payment reference")

    // Poll for withdrawal status.
    const withdrawalStatus = await checkWithdrawalStatus(accessToken, paymentReference)
    if (withdrawalStatus === "Processed" || withdrawalStatus === "Transferred") {
      // Update withdrawal record.
      await updateDoc(doc(db, "withdrawals", withdrawalId), { status: "completed" })
      // Deduct full withdrawal amount (including fee) from user's balance.
      const newBalance = currentBalance - Number(amount)
      await updateDoc(userRef, { userKesBalance: newBalance })
      return NextResponse.json({ success: true, newBalance, withdrawalStatus, withdrawalId })
    } else {
      await updateDoc(doc(db, "withdrawals", withdrawalId), { status: "failed" })
      return NextResponse.json(
        { success: false, error: "Withdrawal failed or canceled" },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 })
  }
}
