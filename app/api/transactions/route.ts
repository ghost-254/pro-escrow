import { NextResponse } from "next/server"

import { adminDb } from "@/lib/firebaseAdmin"
import { requireSessionUser } from "@/lib/serverAuth"
import { getErrorDetails } from "@/lib/serverErrors"
import { formatTransactionStatus, syncPendingPaymentsForUser } from "@/lib/serverPayments"

export async function GET() {
  try {
    const sessionUser = await requireSessionUser()

    try {
      await syncPendingPaymentsForUser(sessionUser.uid)
    } catch {
      // Return the best available data even if a provider reconciliation call fails.
    }

    const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
      adminDb.collection("deposits").where("uid", "==", sessionUser.uid).get(),
      adminDb.collection("withdrawals").where("uid", "==", sessionUser.uid).get(),
    ])

    const transactions: Array<{
      ref: string
      type: string
      method: string
      amount: number
      date: string
      status: string
      currency: string
      fee: number
      netAmount: number
      timestamp: number
    }> = []

    depositsSnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const createdAt = data.createdAt?.toDate?.()

      transactions.push({
        ref: `Ref-${docSnap.id.slice(0, 5)}`,
        type: data.transactionType || "Deposit",
        method: data.method || "",
        amount: Number(data.amount || 0),
        date: createdAt ? createdAt.toLocaleString() : "Unknown Date",
        status: formatTransactionStatus(
          data.status,
          data.providerStatus,
          data.providerResourceStatus
        ),
        currency: data.currency || (data.method === "crypto" ? "USD" : "KES"),
        fee: Number(data.fee || 0),
        netAmount: Number(data.netAmount || 0),
        timestamp: createdAt ? createdAt.getTime() : 0,
      })
    })

    withdrawalsSnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      const createdAt = data.createdAt?.toDate?.()

      transactions.push({
        ref: `Ref-${docSnap.id.slice(0, 5)}`,
        type: data.transactionType || "Withdraw",
        method: data.method || "",
        amount: Number(data.amount || 0),
        date: createdAt ? createdAt.toLocaleString() : "Unknown Date",
        status: formatTransactionStatus(
          data.status,
          data.providerStatus,
          data.providerTransferStatus
        ),
        currency: data.currency || (data.method === "Crypto" ? "USD" : "KES"),
        fee: Number(data.fee || 0),
        netAmount: Number(data.netAmount || 0),
        timestamp: createdAt ? createdAt.getTime() : 0,
      })
    })

    transactions.sort((firstTrans, secondTrans) => secondTrans.timestamp - firstTrans.timestamp)

    return NextResponse.json({
      success: true,
      transactions: transactions.map(
        ({ timestamp: _timestamp, ...transaction }: Record<string, unknown>) => transaction
      ),
    })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, "Internal Server Error", 500)

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
