import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusPayoutApi } from "@/lib/cryptomusWithdrawal"
import { applyCryptomusPayoutUpdate } from "@/lib/serverPayments"

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

    await applyCryptomusPayoutUpdate({
      withdrawalId: orderId,
      payload: cryptomusResponse.result,
      providerStatus: newStatus,
    })

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
