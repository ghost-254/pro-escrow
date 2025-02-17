// app/api/analytics/route.ts
/* eslint-disable */

import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing uid" }, { status: 400 })
    }
    const q = query(collection(db, "deposits"), where("uid", "==", uid))
    const querySnapshot = await getDocs(q)
    const analytics: Record<string, { deposits: number; withdrawals: number }> = {}
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data()
      if (data.createdAt && typeof data.createdAt.toDate === "function") {
        const date = data.createdAt.toDate()
        const month = date.toLocaleString("default", { month: "short" })
        if (!analytics[month]) analytics[month] = { deposits: 0, withdrawals: 0 }
        if (data.transactionType === "Deposit" && data.status === "paid") {
          analytics[month].deposits += data.amount
        }
        if (data.transactionType === "Withdraw" && data.status === "paid") {
          analytics[month].withdrawals += data.amount
        }
      }
    })
    const analyticsData = Object.keys(analytics).map((month) => ({
      month,
      deposits: analytics[month].deposits,
      withdrawals: analytics[month].withdrawals,
    }))
    return NextResponse.json({ success: true, analyticsData })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 })
  }
}
