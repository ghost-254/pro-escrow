//app/api/payout/route.ts
/* eslint-disable */

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { callCryptomusPayoutApi } from "@/lib/cryptomusWithdrawal";

export async function POST(request: Request) {
  try {
    const { uid, amount, currency, network, address, orderId } = await request.json();

    // Validate required fields
    if (!uid || !amount || !currency || !network || !address || !orderId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Check user and balance
    const userRef = doc(db, "users", uid);
    const userSnapshot = await getDoc(userRef);
    if (!userSnapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userSnapshot.data();
    const usdBalance = userData.userUsdBalance || 0;
    if (usdBalance < Number(amount)) {
      return NextResponse.json(
        { success: false, error: "Insufficient USD balance" },
        { status: 400 }
      );
    }

    // 2. Prepare payload for Cryptomus
    const payload = {
      amount: amount.toString(),
      currency: "USD",
      to_currency: "USDT", // We assume USDT
      network,
      order_id: orderId, // The unique order ID from Firestore
      address,
      url_callback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payout/webhook`,
      is_subtract: false,
    };

    // 3. Call Cryptomus Payout API
    const cryptomusResponse = await callCryptomusPayoutApi("payout", payload);

    // Log for debugging (remove in production)
    console.log("Payout response from Cryptomus:", cryptomusResponse);

    // 4. Handle Cryptomus response
    if (cryptomusResponse.state !== 0) {
      console.log("Payout failed with message:", cryptomusResponse.message);
      return NextResponse.json(
        { success: false, error: "Your order failed to process" },
        { status: 400 }
      );
    }

    // 5. Deduct from user's balance
    const newUsdBalance = usdBalance - Number(amount);
    await updateDoc(userRef, { userUsdBalance: newUsdBalance });

    // 6. Update status of the withdrawal document
    const withdrawalRef = doc(db, "withdrawals", orderId);
    await updateDoc(withdrawalRef, { status: "processing" });

    // 7. Return success
    return NextResponse.json({
      success: true,
      payout: cryptomusResponse.result,
    });
  } catch (error: any) {
    console.log("Error in payout processing:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Payout processing failed" },
      { status: 500 }
    );
  }
}
