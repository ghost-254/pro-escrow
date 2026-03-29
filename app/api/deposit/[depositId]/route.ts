import { NextResponse } from "next/server"

import { adminDb } from "@/lib/firebaseAdmin"
import { requireSessionUser } from "@/lib/serverAuth"
import { getErrorDetails } from "@/lib/serverErrors"
import {
  formatTransactionStatus,
  syncMpesaDepositStatusForUser,
} from "@/lib/serverPayments"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    const sessionUser = await requireSessionUser()
    const { depositId } = await params

    await syncMpesaDepositStatusForUser(sessionUser.uid, depositId)

    const depositSnapshot = await adminDb.collection("deposits").doc(depositId).get()

    if (!depositSnapshot.exists) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404 }
      )
    }

    const depositData = depositSnapshot.data() ?? {}

    if (depositData.uid !== sessionUser.uid) {
      return NextResponse.json(
        { success: false, error: "You are not allowed to access this deposit." },
        { status: 403 }
      )
    }

    const exactStatus = [
      typeof depositData.providerStatus === "string" ? depositData.providerStatus : "",
      typeof depositData.providerResourceStatus === "string" ? depositData.providerResourceStatus : "",
    ]
      .filter(Boolean)
      .join(" / ") || depositData.status || "pending"
    const status = formatTransactionStatus(
      depositData.status,
      depositData.providerStatus,
      depositData.providerResourceStatus
    )

    return NextResponse.json({
      success: true,
      deposit: {
        id: depositSnapshot.id,
        amount: Number(depositData.amount || 0),
        method: depositData.method || "",
        currency: depositData.currency || "KES",
        status,
        appStatus: depositData.status || "pending",
        rawStatus: exactStatus,
        exactStatus,
        providerStatus: depositData.providerStatus || "pending",
        providerResourceStatus: depositData.providerResourceStatus || null,
        failureReason: depositData.failureReason || null,
        isTerminal: status === "Completed" || status === "Failed",
      },
    })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, "Failed to fetch deposit status.", 500)

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
