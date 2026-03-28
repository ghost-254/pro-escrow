import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"
import { callCryptomusDepositApi } from "@/lib/cryptomusDeposit"

const FINAL_DEPOSIT_STATUSES = ["paid", "paid_over", "failed", "canceled"]

const checkDepositStatus = async (depositId: string, uid: string, amount: number) => {
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

    if ((newStatus === "paid" || newStatus === "paid_over") && !depositData.balanceCredited) {
      await adminDb.runTransaction(async (transaction) => {
        const latestDepositSnapshot = await transaction.get(depositRef)
        const latestDepositData = latestDepositSnapshot.data() ?? {}

        if (latestDepositData.balanceCredited) {
          return
        }

        const userRef = adminDb.collection("users").doc(uid)
        const userSnapshot = await transaction.get(userRef)

        if (!userSnapshot.exists) {
          transaction.set(
            userRef,
            {
              userKesBalance: 0,
              userUsdBalance: amount,
              frozenUserKesBalance: 0,
              frozenUserUsdBalance: 0,
              updatedAt: Timestamp.now(),
            },
            { merge: true }
          )
        } else {
          transaction.update(userRef, {
            userUsdBalance: FieldValue.increment(amount),
            updatedAt: Timestamp.now(),
          })
        }

        transaction.update(depositRef, {
          status: newStatus,
          balanceCredited: true,
          updatedAt: Timestamp.now(),
        })
      })
    } else {
      await depositRef.update({
        status: newStatus,
        updatedAt: Timestamp.now(),
      })
    }

    if (!FINAL_DEPOSIT_STATUSES.includes(newStatus)) {
      setTimeout(() => checkDepositStatus(depositId, uid, amount), 4000)
    }
  } catch {
    // Ignore background polling errors and allow the next cycle to retry if needed.
  }
}

export const startDepositCronJob = (depositId: string, uid: string, amount: number) => {
  setTimeout(() => checkDepositStatus(depositId, uid, amount), 2000)
}
