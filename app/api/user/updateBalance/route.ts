// app/api/user/updateBalance/route.ts
/* eslint-disable */

import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const { uid, amount, currency } = await request.json()
    if (!uid || amount === undefined || !currency) {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 })
    }

    // Determine which balance field to update.
    const balanceField = currency === "KES" ? "userKesBalance" : "userUsdBalance"
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    let updatedBalance: number

    if (!userSnap.exists()) {
      // If the user doc does not exist, create one.
      const initialData = {
        userKesBalance: currency === "KES" ? amount : 0,
        userUsdBalance: currency === "USD" ? amount : 0,
      }
      await setDoc(userRef, initialData)
      updatedBalance = amount
    } else {
      const userData = userSnap.data() as { [key: string]: number }
      const currentBalance = Number(userData[balanceField] || 0)
      updatedBalance = currentBalance + amount
      await updateDoc(userRef, { [balanceField]: updatedBalance })
    }
    return NextResponse.json({ success: true, updatedBalance })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 })
  }
}
