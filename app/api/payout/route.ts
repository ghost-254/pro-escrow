import { NextResponse } from "next/server"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusPayoutApi } from "@/lib/cryptomusWithdrawal"
import { startCronJob } from "@/lib/cronJob"
import { assertSameOrigin, requireSessionUser, SessionAuthError } from "@/lib/serverAuth"

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
    const sessionUser = await requireSessionUser()
    const { amount, network, address } = await request.json()

    if (!amount || !network || !address) {
      return NextResponse.json(
        { success: false, error: "Missing required payout fields." },
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

    const userRef = adminDb.collection("users").doc(sessionUser.uid)
    const withdrawalRef = adminDb.collection("withdrawals").doc()
    const orderId = withdrawalRef.id

    await adminDb.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef)

      if (!userSnapshot.exists) {
        throw new Error("User not found")
      }

      const usdBalance = Number(userSnapshot.data()?.userUsdBalance || 0)
      if (usdBalance < numericAmount) {
        throw new Error("Insufficient USD balance")
      }

      transaction.update(userRef, {
        userUsdBalance: FieldValue.increment(-numericAmount),
        updatedAt: Timestamp.now(),
      })

      transaction.set(withdrawalRef, {
        uid: sessionUser.uid,
        amount: numericAmount,
        currency: "USD",
        method: "Crypto",
        walletAddress: address,
        cryptoNetwork: network,
        status: "initiated",
        transactionType: "Withdraw",
        balanceDeducted: true,
        balanceRefunded: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    })

    try {
      const payload = {
        amount: numericAmount.toString(),
        currency: "USD",
        to_currency: "USDT",
        network,
        order_id: orderId,
        address,
        url_callback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payout/webhook`,
        is_subtract: false,
      }

      const cryptomusResponse = await callCryptomusPayoutApi("payout", payload)

      if (cryptomusResponse.state !== 0) {
        throw new Error(cryptomusResponse.message || "Payout failed to process")
      }

      await withdrawalRef.update({
        status: "processing",
        payoutPayload: payload,
        payoutResult: cryptomusResponse.result,
        updatedAt: Timestamp.now(),
      })

      startCronJob(orderId)

      return NextResponse.json({
        success: true,
        payout: cryptomusResponse.result,
        withdrawalId: orderId,
      })
    } catch (error: Error | unknown) {
      await adminDb.runTransaction(async (transaction) => {
        const withdrawalSnapshot = await transaction.get(withdrawalRef)

        if (!withdrawalSnapshot.exists) {
          return
        }

        const withdrawalData = withdrawalSnapshot.data() ?? {}

        if (withdrawalData.balanceDeducted && !withdrawalData.balanceRefunded) {
          transaction.update(userRef, {
            userUsdBalance: FieldValue.increment(numericAmount),
            updatedAt: Timestamp.now(),
          })
        }

        transaction.update(withdrawalRef, {
          status: "failed",
          balanceRefunded: true,
          failureReason: error instanceof Error ? error.message : "Payout failed to initialize.",
          updatedAt: Timestamp.now(),
        })
      })

      throw error
    }
  } catch (error: Error | unknown) {
    const status = error instanceof SessionAuthError ? error.status : 500

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Payout processing failed" },
      { status }
    )
  }
}
