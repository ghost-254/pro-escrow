// app/api/user/getWalletBalance/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing uid" },
        { status: 400 }
      )
    }
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    if (!userSnap.exists()) {
      return NextResponse.json({
        success: true,
        userKesBalance: 0,
        userUsdBalance: 0,
        frozenUserKesBalance: 0,
        frozenUserUsdBalance: 0,
      })
    }
    const data = userSnap.data()
    return NextResponse.json({
      success: true,
      userKesBalance: data.userKesBalance || 0,
      userUsdBalance: data.userUsdBalance || 0,
      frozenUserKesBalance: data.frozenUserKesBalance || 0,
      frozenUserUsdBalance: data.frozenUserUsdBalance || 0,
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || error.toString() },
      { status: 500 }
    )
  }
}
