// app/api/transactions/route.ts
/* eslint-disable */
import { NextResponse } from "next/server"
import { db } from "@/lib/firebaseConfig"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get("uid")
    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing uid" }, { status: 400 })
    }
    const qq = query(
      collection(db, "deposits"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    )
    const querySnapshot = await getDocs(qq)
    const transactions = querySnapshot.docs.map((doc) => ({
      ref: doc.id,
      ...doc.data(),
    }))
    return NextResponse.json({ success: true, transactions })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 })
  }
}
