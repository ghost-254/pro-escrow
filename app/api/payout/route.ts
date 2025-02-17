/* eslint-disable */

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig"; // Adjust the import based on your Firebase setup
import { doc, getDoc, updateDoc } from "firebase/firestore";
import axios from "axios";
import crypto from "crypto";

const MERCHANT_ID = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID;
const API_KEY = process.env.NEXT_SERVER_CRYPTOMUS_PAYOUT_API_KEY;

if (!MERCHANT_ID || !API_KEY) {
  throw new Error("Cryptomus configuration missing");
}

/**
 * Generates the Cryptomus signature.
 */
const generateSignature = (data: any) => {
  const jsonData = JSON.stringify(data, Object.keys(data).sort());
  const base64Data = Buffer.from(jsonData).toString("base64");
  return crypto.createHash("md5").update(base64Data + API_KEY).digest("hex");
};

/**
 * Handles crypto withdrawals from USD balance.
 */
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

    // Check if the user has sufficient USD balance
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

    // Prepare the payout payload
    const payload = {
      amount: amount.toString(),
      currency: "USD", // Withdraw from USD balance
      to_currency: currency, // Target cryptocurrency (e.g., USDT, BTC)
      network, // Blockchain network (e.g., TRON, ETH)
      order_id: orderId, // Unique order ID
      address, // Wallet address to receive the payout
      url_callback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payout/webhook`, // Webhook URL
      is_subtract: false, // Deduct fees from the balance
    };

    // Generate the signature
    const sign = generateSignature(payload);

    // Send the payout request to Cryptomus
    const response = await axios.post("https://api.cryptomus.com/v1/payout", payload, {
      headers: {
        merchant: MERCHANT_ID,
        sign,
        "Content-Type": "application/json",
      },
    });

    if (response.data.state !== 0) {
      return NextResponse.json(
        { success: false, error: response.data.message || "Payout creation failed" },
        { status: 400 }
      );
    }

    // Update the user's USD balance in Firestore
    const newUsdBalance = usdBalance - Number(amount);
    await updateDoc(userRef, { userUsdBalance: newUsdBalance });

    return NextResponse.json({
      success: true,
      payout: response.data.result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Payout processing failed" },
      { status: 500 }
    );
  }
}