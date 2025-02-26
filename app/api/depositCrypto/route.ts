//app/api/depositCrypto/route.ts

/* eslint-disable */

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, Timestamp, updateDoc, doc } from "firebase/firestore";
import { callCryptomusApi } from "@/lib/cryptomus";

export async function POST(request: Request) {
  try {
    const { uid, amount } = await request.json();
    if (!uid || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing uid or amount" },
        { status: 400 }
      );
    }

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

    const payload = {
      amount: Number(amount).toFixed(2),
      currency: "USD",
      order_id: depositId,
      url_callback: process.env.NEXT_SERVER_CRYPTOMUS_CALLBACK_URL || "",
      url_return: process.env.NEXT_SERVER_CRYPTOMUS_RETURN_URL || "",
      url_success: process.env.NEXT_SERVER_CRYPTOMUS_SUCCESS_URL || "",
    };

    const cryptomusData = await callCryptomusApi("payment", payload);

    if (cryptomusData.state !== 0) {
      await updateDoc(doc(db, "deposits", depositId), { status: "failed" });
      return NextResponse.json(
        { success: false, error: cryptomusData.message || "Cryptomus invoice creation failed" },
        { status: 400 }
      );
    }

    await updateDoc(doc(db, "deposits", depositId), { cryptomusInvoice: cryptomusData.result });

    return NextResponse.json({
      success: true,
      depositId,
      invoice: cryptomusData.result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Deposit creation failed" },
      { status: 500 }
    );
  }
}