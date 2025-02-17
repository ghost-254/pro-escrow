//app/api/cryptomus/route.ts

/* eslint-disable */

import { NextResponse } from "next/server";
import { callCryptomusApi } from "@/lib/cryptomus";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await callCryptomusApi("payment", body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Payment creation failed" },
      { status: 500 }
    );
  }
}