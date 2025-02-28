// lib/depositCronJob.ts
/* eslint-disable */

import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { callCryptomusDepositApi } from "@/lib/cryptomusDeposit"; // Use the dedicated deposit function

/**
 * Checks the deposit status using the Cryptomus API and updates the database.
 */
const checkDepositStatus = async (depositId: string, uid: string, amount: number) => {
  try {
    // 1. Fetch the deposit document from Firestore
    const depositRef = doc(db, "deposits", depositId);
    const depositSnapshot = await getDoc(depositRef);

    if (!depositSnapshot.exists()) {
      console.error("Deposit not found:", depositId);
      return;
    }

    const depositData = depositSnapshot.data();
    const currentStatus = depositData.status;

    // 2. If the deposit is already finalized, stop the cron job
    if (["paid", "paid_over", "failed", "canceled"].includes(currentStatus)) {
      console.log("Deposit already finalized with status:", currentStatus);
      return;
    }

    // 3. Call Cryptomus API to get the latest payment status
    const cryptomusResponse = await callCryptomusDepositApi("payment/info", {
      uuid: depositData.cryptomusInvoice.uuid, // Use the UUID from the Cryptomus invoice
    });

    if (cryptomusResponse.state !== 0) {
      console.error("Failed to fetch deposit status:", cryptomusResponse.message);
      return;
    }

    const newStatus = cryptomusResponse.result.status;

    // 4. Update the deposit status in Firestore
    await updateDoc(depositRef, { status: newStatus });

    // 5. If the deposit is paid, update the user's balance
    if (newStatus === "paid" || newStatus === "paid_over") {
      const userRef = doc(db, "users", uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const newBalance = (userData.userUsdBalance || 0) + amount;
        await updateDoc(userRef, { userUsdBalance: newBalance });
      }
    }

    // 6. If the deposit is finalized, stop the cron job
    if (["paid", "paid_over", "failed", "canceled"].includes(newStatus)) {
      console.log("Deposit finalized with status:", newStatus);
      return;
    }

    // 7. If not finalized, schedule the next check
    setTimeout(() => checkDepositStatus(depositId, uid, amount), 4000);
  } catch (error: any) {
    console.error("Error in deposit cron job:", error.message);
  }
};

/**
 * Starts the cron job to monitor the deposit status.
 */
export const startDepositCronJob = (depositId: string, uid: string, amount: number) => {
  setTimeout(() => checkDepositStatus(depositId, uid, amount), 2000);
};