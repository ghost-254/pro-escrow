import { NextResponse } from "next/server"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusPayoutApi } from "@/lib/cryptomusWithdrawal"
import { startCronJob } from "@/lib/cronJob"
import { assertSameOrigin, requireSessionUser, SessionAuthError } from "@/lib/serverAuth"
import { getErrorDetails } from "@/lib/serverErrors"
import {
  CRYPTO_WITHDRAWAL_MIN_USD,
  normalizeCryptoNetwork,
  parseMoneyAmount,
  resolveCallbackUrl,
  sanitizeWalletAddress,
} from "@/lib/serverPayments"

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

    const numericAmount = parseMoneyAmount(amount, "Withdrawal amount", {
      min: CRYPTO_WITHDRAWAL_MIN_USD,
    })
    const sanitizedNetwork = normalizeCryptoNetwork(network)
    const walletAddress = sanitizeWalletAddress(address)

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
        provider: "cryptomus",
        walletAddress,
        cryptoNetwork: sanitizedNetwork,
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
      const payload = {
        amount: numericAmount.toString(),
        currency: "USD",
        to_currency: "USDT",
        network: sanitizedNetwork,
        order_id: orderId,
        address: walletAddress,
        url_callback: resolveCallbackUrl(request, "/api/payout/webhook"),
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
        providerStatus: String(cryptomusResponse.result?.status || "processing"),
        updatedAt: Timestamp.now(),
      })

      startCronJob(orderId)

      return NextResponse.json({
        success: true,
        status: "processing",
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
    const sessionStatus = error instanceof SessionAuthError ? error.status : undefined
    const { message, status } = getErrorDetails(
      error,
      "Payout processing failed",
      sessionStatus ?? 400
    )

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
