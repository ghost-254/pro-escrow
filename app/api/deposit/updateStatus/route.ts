// app/api/deposit/updateStatus/route.ts
/* eslint-disable */

import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { doc, updateDoc } from "firebase/firestore"

export async function POST(request: Request) {
  try {
    const { depositId, status } = await request.json()
    if (!depositId || !status) throw new Error("Missing parameters")
    await updateDoc(doc(db, "deposits", depositId), { status })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 })
  }
}
