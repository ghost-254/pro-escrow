//app/api/cryptomus/webhook/route.ts

/* eslint-disable */

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig"; 
import { doc, updateDoc } from "firebase/firestore";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Read the raw body as text
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Extract the signature from the request
    const receivedSign = body.sign;
    if (!receivedSign) {
      return NextResponse.json(
        { success: false, error: "Missing signature" },
        { status: 400 }
      );
    }

    // Remove the signature from the body to avoid including it in the signature calculation
    delete body.sign;

    // Re-stringify the body (without the sign) and base64-encode it
    const jsonData = JSON.stringify(body, Object.keys(body).sort());
    const base64Data = Buffer.from(jsonData).toString("base64");

    // Retrieve the Cryptomus API key from environment variables
    const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Cryptomus API key not configured" },
        { status: 500 }
      );
    }

    // Generate the signature: MD5(base64Data + apiKey)
    const calculatedSign = crypto
      .createHash("md5")
      .update(base64Data + apiKey)
      .digest("hex");

    // Verify the signature
    if (calculatedSign !== receivedSign) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Extract required fields from the webhook payload
    const { order_id, status } = body;
    if (!order_id) {
      return NextResponse.json(
        { success: false, error: "Missing order_id" },
        { status: 400 }
      );
    }

    // Process the payment status
    const depositRef = doc(db, "deposits", order_id);
    if (status === "paid" || status === "paid_over") {
      await updateDoc(depositRef, { status: "paid" });
      return NextResponse.json({ success: true, message: "Deposit marked as paid" });
    } else if (status === "fail") {
      await updateDoc(depositRef, { status: "failed" });
      return NextResponse.json({ success: true, message: "Deposit marked as failed" });
    }

    // For other statuses, simply acknowledge receipt
    return NextResponse.json({
      success: true,
      message: `Webhook processed with status: ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}