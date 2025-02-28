// lib/cronJob.ts
/* eslint-disable */

import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { callCryptomusPayoutApi } from "@/lib/cryptomusWithdrawal";

const checkPayoutStatus = async (orderId: string) => {
  try {
    const withdrawalRef = doc(db, "withdrawals", orderId);
    const withdrawalSnapshot = await getDoc(withdrawalRef);

    if (!withdrawalSnapshot.exists()) {
      console.log("Withdrawal not found");
      return;
    }

    const withdrawalData = withdrawalSnapshot.data();
    const status = withdrawalData.status;

    if (["paid", "fail", "cancel", "system_fail"].includes(status)) {
      console.log("Payout reached final status:", status);
      return;
    }

    // Call Cryptomus API to get the latest status
    const cryptomusResponse = await callCryptomusPayoutApi("payout/info", {
      order_id: orderId,
    });

    if (cryptomusResponse.state !== 0) {
      console.log("Failed to fetch payout status:", cryptomusResponse.message);
      return;
    }

    const newStatus = cryptomusResponse.result.status;

    // Update the status in the database
    await updateDoc(withdrawalRef, { status: newStatus });

    if (["paid", "fail", "cancel", "system_fail"].includes(newStatus)) {
      console.log("Payout reached final status:", newStatus);
      return;
    }

    // If not final, schedule the next check
    setTimeout(() => checkPayoutStatus(orderId), 2000);
  } catch (error: any) {
    console.log("Error in cron job:", error.message);
  }
};

export const startCronJob = (orderId: string) => {
  setTimeout(() => checkPayoutStatus(orderId), 2000);
};