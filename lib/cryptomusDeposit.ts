//lib/cryptomusDeposit.ts

/* eslint-disable */

import axios from "axios";
import crypto from "crypto";

const MERCHANT_ID = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID;
const API_KEY = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY;

if (!MERCHANT_ID || !API_KEY) {
  throw new Error("Cryptomus configuration missing");
}

/**
 * Generates a Cryptomus signature for deposits.
 */
const generateDepositSignature = (data: any) => {
  const jsonData = JSON.stringify(data, Object.keys(data).sort());
  const base64Data = Buffer.from(jsonData).toString("base64");
  return crypto.createHash("md5").update(base64Data + API_KEY).digest("hex");
};

/**
 * Calls the Cryptomus API for deposits.
 */
export const callCryptomusDepositApi = async (endpoint: string, payload: any) => {
  const sign = generateDepositSignature(payload);
  const headers = {
    merchant: MERCHANT_ID,
    sign,
    "Content-Type": "application/json",
  };

  const url = `https://api.cryptomus.com/v1/${endpoint}`;
  const response = await axios.post(url, payload, { headers });
  return response.data;
};