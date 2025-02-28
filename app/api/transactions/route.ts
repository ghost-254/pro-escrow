// app/api/transactions/route.ts
/* eslint-disable */

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing uid" }, { status: 400 });
    }

    // Query deposits and withdrawals for this uid.
    const depositsQuery = query(collection(db, "deposits"), where("uid", "==", uid));
    const withdrawalsQuery = query(collection(db, "withdrawals"), where("uid", "==", uid));

    const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
      getDocs(depositsQuery),
      getDocs(withdrawalsQuery),
    ]);

    const transactions: Array<{
      ref: string;
      type: string;
      method: string;
      amount: number;
      date: string;
      status: string;
      currency: string;
      fee: number;
      netAmount: number;
      timestamp: number;
    }> = [];

    // Map deposits to the common format.
    depositsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate();
      const status = data.status === "paid" || data.status === "paid_over" ? "Completed" : data.status;
      transactions.push({
        ref: `Ref-${docSnap.id.slice(0, 5)}`,
        type: data.transactionType || "Deposit",
        method: data.method || "",
        amount: data.amount || 0,
        date: createdAt ? createdAt.toLocaleString() : "Unknown Date",
        status,
        currency: data.method === "crypto" ? "USD" : "KES",
        fee: data.fee || 0,
        netAmount: data.netAmount || 0,
        timestamp: createdAt ? createdAt.getTime() : 0,
      });
    });

    // Map withdrawals to the common format.
    withdrawalsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate();
      const status = data.status === "paid" || data.status === "paid_over" ? "Completed" : data.status;
      transactions.push({
        ref: `Ref-${docSnap.id.slice(0, 5)}`,
        type: data.transactionType || "Withdraw",
        method: data.method || "",
        amount: data.amount || 0,
        date: createdAt ? createdAt.toLocaleString() : "Unknown Date",
        status,
        currency: data.method === "Crypto" ? "USD" : "KES",
        fee: data.fee || 0,
        netAmount: data.netAmount || 0,
        timestamp: createdAt ? createdAt.getTime() : 0,
      });
    });

    // Sort all transactions by timestamp in descending order.
    transactions.sort((a, b) => b.timestamp - a.timestamp);

    // Remove the timestamp property before sending the response.
    const finalTransactions = transactions.map(({ timestamp, ...rest }) => rest);

    return NextResponse.json({ success: true, transactions: finalTransactions });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}