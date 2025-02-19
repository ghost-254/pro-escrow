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

    const q = query(
      collection(db, "deposits"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    )

    const querySnapshot = await getDocs(q)
    const transactions = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate()

      return {
        // Use first 5 letters of the document ID, prefixed with "Ref-"
        ref: `Ref-${doc.id.slice(0, 5)}`,
        type: data.transactionType || "Unknown",
        method: data.method || "",
        amount: data.amount || 0,
        date: createdAt ? createdAt.toLocaleString() : "Unknown Date",
        status: data.status || "Unknown Status",
        // Compute currency: if method is crypto then USD, else KES.
        currency: data.method === "crypto" ? "USD" : "KES",
        fee: data.fee || 0,
        netAmount: data.netAmount || 0,
      }
    })

    return NextResponse.json({ success: true, transactions })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}