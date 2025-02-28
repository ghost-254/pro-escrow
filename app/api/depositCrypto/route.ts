// app/api/depositCrypto/route.ts
/* eslint-disable */

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, Timestamp, updateDoc, doc } from "firebase/firestore";
import { callCryptomusDepositApi } from "@/lib/cryptomusDeposit";
import { startDepositCronJob } from "@/lib/depositCronJob";

export async function POST(request: Request) {
  try {
    const { uid, amount } = await request.json();

    // Validate required fields
    if (!uid || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing uid or amount" },
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

    // 1. Create a deposit record in Firestore
    const depositData = {
      uid,
      method: "crypto",
      amount: Number(amount),
      status: "pending",
      transactionType: "Deposit",
      createdAt: Timestamp.now(),
    };
    const depositRef = await addDoc(collection(db, "deposits"), depositData);
    const depositId = depositRef.id;

    // 2. Prepare payload for Cryptomus invoice creation
    const payload = {
      amount: Number(amount).toFixed(2),
      currency: "USD",
      order_id: depositId,
      url_callback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/depositCrypto/webhook` || "",
      url_return: process.env.NEXT_SERVER_CRYPTOMUS_RETURN_URL || "",
      url_success: process.env.NEXT_SERVER_CRYPTOMUS_SUCCESS_URL || "",
    };

    // 3. Call Cryptomus API to create the payment invoice
    const cryptomusData = await callCryptomusDepositApi("payment", payload);

    if (cryptomusData.state !== 0) {
      await updateDoc(doc(db, "deposits", depositId), { status: "failed" });
      return NextResponse.json(
        { success: false, error: cryptomusData.message || "Cryptomus invoice creation failed" },
        { status: 400 }
      );
    }

    // 4. Update the deposit record with Cryptomus invoice details
    await updateDoc(doc(db, "deposits", depositId), {
      cryptomusInvoice: cryptomusData.result,
    });

    // 5. Start the cron job to monitor the deposit status
    startDepositCronJob(depositId, uid, Number(amount));

    // 6. Return success response
    return NextResponse.json({
      success: true,
      depositId,
      invoice: cryptomusData.result,
    });
  } catch (error: any) {
    console.error("Error in deposit creation:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Deposit creation failed" },
      { status: 500 }
    );
  }
}