// app/api/withdrawals/route.ts
/* eslint-disable */

import { NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

const K2 = require("k2-connect-node")({
  clientId: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_ID,
  clientSecret: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_SECRET,
  apiKey: process.env.NEXT_SERVER_KOPOKOPO_API_KEY,
  baseUrl: process.env.NEXT_SERVER_KOPOKOPO_BASE_URL,
});

const { PayService, TokenService } = K2;

async function checkWithdrawalStatus(
  accessToken: string,
  paymentReference: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const paymentUrl = `https://api.kopokopo.com/api/v1/payments/${paymentReference}`;
        const response = await PayService.getStatus({ accessToken, location: paymentUrl });
        console.log("Payment status response:", response);
        if (!response) {
          clearInterval(interval);
          return reject("No response from withdrawal status check");
        }
        const status = response.data.attributes.status;
        if (status === "Processed" || status === "Transferred" || status === "Failed") {
          clearInterval(interval);
          resolve(status);
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 2000);
    setTimeout(() => {
      clearInterval(interval);
      reject("Withdrawal status check timed out");
    }, 60000);
  });
}

export async function POST(request: Request) {
  try {
    // 1. Validate Input
    const { firstName, lastName, phoneNumber, amount, uid, email } = await request.json();
    if (!firstName || !lastName || !phoneNumber || !amount || !uid || !email) {
      throw new Error("Missing required fields");
    }
    if (Number(amount) < 200) {
      return NextResponse.json(
        { success: false, error: "Minimum MPESA withdrawal is 200 KES" },
        { status: 400 }
      );
    }
    const safaricomRegex = /^\+254\d{9}$/;
    if (!safaricomRegex.test(phoneNumber)) {
      return NextResponse.json(
        { success: false, error: "Only Safaricom numbers are accepted for Mpesa withdrawals" },
        { status: 400 }
      );
    }

    // 2. Check the user's KES balance from Firestore.
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }
    const userData = userSnap.data();
    const currentBalance = Number(userData.userKesBalance || 0);
    const withdrawalAmount = Number(amount);
    if (currentBalance < withdrawalAmount) {
      return NextResponse.json(
        { success: false, error: "Insufficient KES balance for withdrawal" },
        { status: 400 }
      );
    }

    // 3. Immediately deduct the full withdrawal amount from the user's balance.
    const newBalance = currentBalance - withdrawalAmount;
    await updateDoc(userRef, { userKesBalance: newBalance });
    console.log(`Deducted ${withdrawalAmount} KES from user ${uid}. New balance: ${newBalance}`);

    // 4. Obtain an access token from Kopokopo.
    const tokenResponse = await TokenService.getToken();
    const accessToken = tokenResponse.access_token;

    // 5. Check "userWithdrawals" collection for an existing wallet record using phoneNumber.
    const userWithdrawalsRef = collection(db, "userWithdrawals");
    const q = query(userWithdrawalsRef, where("phoneNumber", "==", phoneNumber));
    const querySnapshot = await getDocs(q);
    let walletRecord: any = null;
    if (!querySnapshot.empty) {
      walletRecord = querySnapshot.docs[0];
    }

    // 6. If no wallet record exists, create one via the Kopokopo API and store with an empty paymentReference.
    if (!walletRecord) {
      const recipientRequest = {
        type: "mobile_wallet",
        firstName,
        lastName,
        email, // store the user's email here
        phoneNumber,
        network: "Safaricom",
        accessToken,
      };
      const recipientResponse = await PayService.addPayRecipient(recipientRequest);
      console.log("Recipient response:", recipientResponse);
      const recipientUrl =
        typeof recipientResponse === "string"
          ? recipientResponse
          : recipientResponse?.headers?.location;
      if (!recipientUrl) {
        throw new Error("No recipient URL returned from addPayRecipient");
      }
      // Query recipient details to obtain the recipient ID.
      const recipientDetails = await PayService.getStatus({ accessToken, location: recipientUrl });
      const recipientId =
        recipientDetails?.data?.id ||
        (recipientDetails?.data?.attributes && recipientDetails.data.attributes.id);
      // Store the new wallet record with an empty paymentReference.
      await addDoc(userWithdrawalsRef, {
        phoneNumber,
        email, // save the email for uniqueness check
        firstName,
        lastName,
        recipientId,
        paymentReference: "", // empty since no valid reference is returned yet
        createdAt: Timestamp.now(),
      });
      return NextResponse.json(
        {
          success: false,
          error: "Your withdrawal wallet is unverified. Please reach out to support!",
        },
        { status: 400 }
      );
    } else {
      // 6b. If a wallet record exists, ensure the stored email matches the logged-in user's email.
      const walletData = walletRecord.data();
      if (walletData.email !== email) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The email associated with this withdrawal wallet does not match your account. Please contact support.",
          },
          { status: 400 }
        );
      }
      // If the wallet exists but paymentReference is empty, return the unverified popup.
      if (!walletData.paymentReference) {
        return NextResponse.json(
          {
            success: false,
            error: "Your withdrawal wallet is unverified. Please reach out to support!",
          },
          { status: 400 }
        );
      }
    }

    // 7. At this point, a valid wallet record with a non-empty paymentReference exists.
    const validPaymentReference = walletRecord.data().paymentReference;

    // 8. Create a withdrawal record.
    // Here, the withdrawal record stores the full amount, fee, and net amount for bookkeeping.
    const fee = 50;
    const netAmount = withdrawalAmount - fee;
    const withdrawalData = {
      uid,
      method: "M-Pesa",
      firstName,
      lastName,
      phoneNumber,
      amount: withdrawalAmount, // full amount for record-keeping
      fee,
      netAmount,
      status: "pending",
      transactionType: "Withdraw",
      createdAt: Timestamp.now(),
    };
    const withdrawalRef = await addDoc(collection(db, "withdrawals"), withdrawalData);
    const withdrawalId = withdrawalRef.id;

    // 9. Initiate the payment using the valid paymentReference from the wallet record.
    // We send the net amount (withdrawal amount minus fee) to Kopokopo.
    const paymentRequest = {
      destinationType: "mobile_wallet",
      destinationReference: validPaymentReference,
      amount: String(netAmount),
      currency: "KES",
      description: "General",
      category: "general",
      // Pass tags as a string per API requirements.
      tags: "withdrawal",
      metadata: { customerId: uid, notes: "Xcrow withdrawal services" },
      callbackUrl: "https://your-callback-url.example.com/payment_result", // replace with your actual callback URL
      accessToken,
    };
    const paymentResponse = await PayService.sendPay(paymentRequest);
    console.log("Payment response:", paymentResponse);
    const paymentUrl =
      typeof paymentResponse === "string"
        ? paymentResponse
        : paymentResponse?.headers?.location;
    const extractedPaymentReference = paymentUrl?.split("/").pop();
    if (!extractedPaymentReference) throw new Error("Unable to extract payment reference");
    console.log("Payment reference:", extractedPaymentReference);

    // 10. Poll for the withdrawal status.
    const withdrawalStatus = await checkWithdrawalStatus(accessToken, extractedPaymentReference);
    if (withdrawalStatus === "Processed" || withdrawalStatus === "Transferred") {
      await updateDoc(doc(db, "withdrawals", withdrawalId), { status: "completed" });
      return NextResponse.json({ success: true, newBalance, withdrawalStatus, withdrawalId });
    } else {
      await updateDoc(doc(db, "withdrawals", withdrawalId), { status: "failed" });
      return NextResponse.json(
        { success: false, error: "Withdrawal failed or canceled" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Withdrawal error: ", error);
    const errorMsg = error?.message ? error.message : JSON.stringify(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
