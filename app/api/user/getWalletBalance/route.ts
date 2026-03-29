import { NextResponse } from "next/server"

import { adminDb } from "@/lib/firebaseAdmin"
import { requireSessionUser } from "@/lib/serverAuth"
import { getErrorDetails } from "@/lib/serverErrors"
import { syncPendingPaymentsForUser } from "@/lib/serverPayments"

export async function GET() {
  try {
    const sessionUser = await requireSessionUser()

    try {
      await syncPendingPaymentsForUser(sessionUser.uid)
    } catch {
      // Keep the wallet readable even when reconciliation is temporarily unavailable.
    }

    const userSnapshot = await adminDb.collection("users").doc(sessionUser.uid).get()

    if (!userSnapshot.exists) {
      return NextResponse.json({
        success: true,
        userKesBalance: 0,
        userUsdBalance: 0,
        frozenUserKesBalance: 0,
        frozenUserUsdBalance: 0,
      })
    }

    const data = userSnapshot.data() ?? {}

    return NextResponse.json({
      success: true,
      userKesBalance: Number(data.userKesBalance || 0),
      userUsdBalance: Number(data.userUsdBalance || 0),
      frozenUserKesBalance: Number(data.frozenUserKesBalance || 0),
      frozenUserUsdBalance: Number(data.frozenUserUsdBalance || 0),
    })
  } catch (error: unknown) {
    const { message, status } = getErrorDetails(error, "Failed to fetch wallet balance.", 500)

    return NextResponse.json(
      { success: false, error: message },
      { status }
    )
  }
}
