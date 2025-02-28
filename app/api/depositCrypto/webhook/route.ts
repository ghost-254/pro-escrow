// app/api/depositCrypto/webhook/route.ts
/* eslint-disable */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc, Timestamp, getDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    // Read the raw body for signature verification
    const rawBody = await request.text();
    const data = JSON.parse(rawBody);
    const receivedSign = data.sign;

    // Remove the sign field to generate our own hash
    const { sign, ...payload } = data;

    // Validate required fields
    if (!payload.order_id || !payload.status) {
      return NextResponse.json(
        { success: false, error: "Missing required fields in payload" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 500 }
      );
    }

    // Generate the signature based on the payload
    const generatedSign = crypto
      .createHash("md5")
      .update(Buffer.from(JSON.stringify(payload)).toString("base64") + apiKey)
      .digest("hex");

    // Verify the signature
    if (generatedSign !== receivedSign) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Log the payload for debugging
    console.log("Webhook payload received:", payload);

    // Update the deposit record in Firestore
    const depositId = payload.order_id;
    const depositRef = doc(db, "deposits", depositId);
    const depositSnapshot = await getDoc(depositRef);

    if (!depositSnapshot.exists()) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404 }
      );
    }

    // Update the deposit status and Cryptomus invoice data
    await updateDoc(depositRef, {
      status: payload.status,
      cryptomusInvoice: { ...payload },
      updatedAt: Timestamp.now(),
    });

    // If the deposit is paid, update the user's balance
    if (payload.status === "paid" || payload.status === "paid_over") {
      const userRef = doc(db, "users", depositSnapshot.data().uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const newBalance = (userData.userUsdBalance || 0) + Number(payload.amount);
        await updateDoc(userRef, { userUsdBalance: newBalance });
      }
    }

    // Return success response
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in webhook processing:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing failed" },
      { status: 500 }
    );
  }
}