import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusPayoutApi } from "@/lib/cryptomusWithdrawal"

const FINAL_PAYOUT_STATUSES = ["paid", "fail", "cancel", "system_fail"]

const checkPayoutStatus = async (orderId: string) => {
  try {
    const withdrawalRef = adminDb.collection("withdrawals").doc(orderId)
    const withdrawalSnapshot = await withdrawalRef.get()

    if (!withdrawalSnapshot.exists) {
      return
    }

    const withdrawalData = withdrawalSnapshot.data() ?? {}
    const status = withdrawalData.status

    if (FINAL_PAYOUT_STATUSES.includes(status)) {
      return
    }

    const cryptomusResponse = await callCryptomusPayoutApi("payout/info", {
      order_id: orderId,
    })

    if (cryptomusResponse.state !== 0) {
      return
    }

    const newStatus = cryptomusResponse.result.status

    if (
      ["fail", "cancel", "system_fail"].includes(newStatus) &&
      withdrawalData.balanceDeducted &&
      !withdrawalData.balanceRefunded
    ) {
      await adminDb.runTransaction(async (transaction) => {
        const userRef = adminDb.collection("users").doc(withdrawalData.uid)

        transaction.update(userRef, {
          userUsdBalance: FieldValue.increment(Number(withdrawalData.amount || 0)),
          updatedAt: Timestamp.now(),
        })

        transaction.update(withdrawalRef, {
          status: newStatus,
          balanceRefunded: true,
          updatedAt: Timestamp.now(),
        })
      })
    } else {
      await withdrawalRef.update({
        status: newStatus,
        updatedAt: Timestamp.now(),
      })
    }

    if (!FINAL_PAYOUT_STATUSES.includes(newStatus)) {
      setTimeout(() => checkPayoutStatus(orderId), 2000)
    }
  } catch {
    // Ignore background polling errors and allow the next cycle to retry if needed.
  }
}

export const startCronJob = (orderId: string) => {
  setTimeout(() => checkPayoutStatus(orderId), 2000)
}
