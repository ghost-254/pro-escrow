import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusDepositApi } from "@/lib/cryptomusDeposit"
import { applyCryptomusDepositUpdate } from "@/lib/serverPayments"

const FINAL_DEPOSIT_STATUSES = ["paid", "paid_over", "failed", "canceled"]

const checkDepositStatus = async (depositId: string) => {
  try {
    const depositRef = adminDb.collection("deposits").doc(depositId)
    const depositSnapshot = await depositRef.get()

    if (!depositSnapshot.exists) {
      return
    }

    const depositData = depositSnapshot.data() ?? {}
    const currentStatus = depositData.status

    if (FINAL_DEPOSIT_STATUSES.includes(currentStatus)) {
      return
    }

    const cryptomusResponse = await callCryptomusDepositApi("payment/info", {
      uuid: depositData.cryptomusInvoice?.uuid,
    })

    if (cryptomusResponse.state !== 0) {
      return
    }

    const newStatus = cryptomusResponse.result.status
    await applyCryptomusDepositUpdate({
      depositId,
      payload: cryptomusResponse.result,
      providerStatus: newStatus,
      isFinal: Boolean(cryptomusResponse.result.is_final),
    })

    if (!FINAL_DEPOSIT_STATUSES.includes(newStatus)) {
      setTimeout(() => checkDepositStatus(depositId), 4000)
    }
  } catch {
    // Ignore background polling errors and allow the next cycle to retry if needed.
  }
}

export const startDepositCronJob = (depositId: string) => {
  setTimeout(() => checkDepositStatus(depositId), 2000)
}
