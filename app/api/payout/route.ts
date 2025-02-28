//app/api/payout/route.ts
/* eslint-disable */

// app/api/payout/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { callCryptomusPayoutApi } from "@/lib/cryptomusWithdrawal";
import { startCronJob } from "@/lib/cronJob";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const { uid, amount, currency, network, address, orderId } = await request.json();

    // Validate required fields
    const requiredFields = { uid, amount, currency, network, address, orderId };
    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    if (isNaN(amount) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive number" },
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

    // Validate sufficient balance
    if (usdBalance < Number(amount)) {
      return NextResponse.json(
        { success: false, error: "Insufficient USD balance" },
        { status: 400 }
      );
    }

    // 2. Prepare payload for Cryptomus
    const payload = {
      amount: amount.toString(),
      currency: "USD", // Assuming the payout is in USD
      to_currency: "USDT", // Assuming the payout is converted to USDT
      network,
      order_id: orderId, // Unique order ID from Firestore
      address,
      url_callback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payout/webhook`, // Webhook URL
      is_subtract: false, // Do not subtract fees from the payout amount
    };

    // 3. Call Cryptomus Payout API
    const cryptomusResponse = await callCryptomusPayoutApi("payout", payload);

    // Log the response for debugging
    console.log("Payout response from Cryptomus:", cryptomusResponse);

    // 4. Handle Cryptomus response
    if (cryptomusResponse.state !== 0) {
      console.error("Payout failed with message:", cryptomusResponse.message);
      return NextResponse.json(
        { success: false, error: cryptomusResponse.message || "Payout failed to process" },
        { status: 400 }
      );
    }

    // 5. Deduct from user's balance
    const newUsdBalance = usdBalance - Number(amount);
    await updateDoc(userRef, { userUsdBalance: newUsdBalance });

    // 6. Update status of the withdrawal document
    const withdrawalRef = doc(db, "withdrawals", orderId);
    await updateDoc(withdrawalRef, { status: "processing" });

    // 7. Start the cron job to monitor the payout status
    startCronJob(orderId);

    // 8. Return success response
    return NextResponse.json({
      success: true,
      payout: cryptomusResponse.result,
    });
  } catch (error: any) {
    console.error("Error in payout processing:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Payout processing failed" },
      { status: 500 }
    );
  }
}