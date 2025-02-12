// app/api/depositCrypto/route.ts
/* eslint-disable */
import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { collection, addDoc, Timestamp } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const { uid, amount } = await request.json()
    const depositData = {
      uid,
      method: "crypto",
      amount: Number(amount),
      status: "pending",
      transactionType: "Deposit",
      createdAt: Timestamp.now(),
    }
    const depositRef = await addDoc(collection(db, "deposits"), depositData)
    return NextResponse.json({ success: true, depositId: depositRef.id })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 })
  }
}
