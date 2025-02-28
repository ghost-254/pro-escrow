//app/api/payout/webhook.route.ts

/* eslint-disable */

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import crypto from "crypto";

const API_KEY = process.env.NEXT_SERVER_CRYPTOMUS_PAYOUT_API_KEY;

if (!API_KEY) {
  throw new Error("Cryptomus payout configuration missing");
}

const generateSignature = (data: any) => {
  const jsonData = JSON.stringify(data);
  const base64Data = Buffer.from(jsonData).toString("base64");
  return crypto.createHash("md5").update(base64Data + API_KEY).digest("hex");
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Verify the signature
    const receivedSign = payload.sign;
    const calculatedSign = generateSignature(payload);

    if (receivedSign !== calculatedSign) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Update the withdrawal status in the database
    const withdrawalRef = doc(db, "withdrawals", payload.order_id);
    await updateDoc(withdrawalRef, { status: payload.status });

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.log("Error in webhook processing:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}