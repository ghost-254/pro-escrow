// app/api/withdrawal/webhook/route.ts

/*eslint-disable*/

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Verify the HMAC signature
    const signature = request.headers.get("X-KopoKopo-Signature");
    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing X-KopoKopo-Signature header" },
        { status: 400 }
      );
    }

    // Read the raw body
    const rawBody = await request.text();
    const apiKey = process.env.NEXT_SERVER_KOPOKOPO_API_KEY; // Use your API Key or Client Secret

    // Ensure the API Key is defined
    if (!apiKey) {
      throw new Error("API Key is not defined in environment variables");
    }

    // Compute the HMAC signature
    const hmac = crypto.createHmac("sha256", apiKey); // Use the API Key as the secret
    hmac.update(rawBody);
    const computedSignature = hmac.digest("hex");

    // Compare the computed signature with the provided signature
    if (signature !== computedSignature) {
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);
    const { status, amount, metadata, _links } = payload.data.attributes;

    // Extract the resource ID from the _links.self URL
    const resourceId = _links.self.split("/").pop();
    if (!resourceId) {
      throw new Error("Unable to extract resource ID from _links.self");
    }

    // Check for duplicate events
    const eventRef = doc(db, "kopokopo_events", resourceId);
    const eventSnap = await getDoc(eventRef);

    if (eventSnap.exists()) {
      // Event has already been processed
      return NextResponse.json(
        { success: false, error: "Duplicate event detected" },
        { status: 200 }
      );
    }

    // Store the event in Firestore to mark it as processed
    await setDoc(eventRef, {
      resourceId,
      status,
      amount,
      metadata,
      processedAt: new Date().toISOString(),
    });

    // Update the withdrawal status in Firestore
    const withdrawalRef = doc(db, "withdrawals", metadata.customerId);
    await updateDoc(withdrawalRef, { status });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || error.toString() },
      { status: 500 }
    );
  }
}