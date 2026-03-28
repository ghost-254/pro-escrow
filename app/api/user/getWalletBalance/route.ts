import { NextResponse } from "next/server"

import { adminDb } from "@/lib/firebaseAdmin"
import { requireSessionUser, SessionAuthError } from "@/lib/serverAuth"

export async function GET() {
  try {
    const sessionUser = await requireSessionUser()
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
  } catch (error: Error | unknown) {
    const status = error instanceof SessionAuthError ? error.status : 500

    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wallet balance." },
      { status }
    )
  }
}
