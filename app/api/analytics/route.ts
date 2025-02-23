// app/api/analytics/route.ts
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

    // Query the deposits and withdrawals collections for this uid.
    const depositsQuery = query(collection(db, "deposits"), where("uid", "==", uid));
    const withdrawalsQuery = query(collection(db, "withdrawals"), where("uid", "==", uid));

    const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
      getDocs(depositsQuery),
      getDocs(withdrawalsQuery)
    ]);

    // Prepare an analytics object keyed by month (e.g., "Jan", "Feb").
    const analytics: Record<string, { deposits: number; withdrawals: number }> = {};

    // Process deposits: Only include those with transactionType "Deposit" and status "paid".
    depositsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.createdAt && typeof data.createdAt.toDate === "function") {
        const date = data.createdAt.toDate();
        const month = date.toLocaleString("default", { month: "short" });
        if (!analytics[month]) analytics[month] = { deposits: 0, withdrawals: 0 };
        if (data.transactionType === "Deposit" && data.status === "paid") {
          analytics[month].deposits += data.amount;
        }
      }
    });

    // Process withdrawals: Only include those with transactionType "Withdraw" and status "completed".
    withdrawalsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.createdAt && typeof data.createdAt.toDate === "function") {
        const date = data.createdAt.toDate();
        const month = date.toLocaleString("default", { month: "short" });
        if (!analytics[month]) analytics[month] = { deposits: 0, withdrawals: 0 };
        if (data.transactionType === "Withdraw" && data.status === "completed") {
          analytics[month].withdrawals += data.amount;
        }
      }
    });

    const analyticsData = Object.keys(analytics).map((month) => ({
      month,
      deposits: analytics[month].deposits,
      withdrawals: analytics[month].withdrawals,
    }));

    return NextResponse.json({ success: true, analyticsData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || error.toString() }, { status: 500 });
  }
}
