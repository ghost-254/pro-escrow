//lib/cryptomusDeposit.ts

/* eslint-disable */

import axios from "axios";
import crypto from "crypto";

const getCryptomusDepositConfig = () => {
  const merchantId = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID
  const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY

  if (!merchantId || !apiKey) {
    throw new Error("Cryptomus configuration missing")
  }

  return { merchantId, apiKey }
}

/**
 * Generates a Cryptomus signature for deposits.
 */
const generateDepositSignature = (data: any) => {
  const { apiKey } = getCryptomusDepositConfig()
  const jsonData = JSON.stringify(data, Object.keys(data).sort());
  const base64Data = Buffer.from(jsonData).toString("base64");
  return crypto.createHash("md5").update(base64Data + apiKey).digest("hex");
};

/**
 * Calls the Cryptomus API for deposits.
 */
export const callCryptomusDepositApi = async (endpoint: string, payload: any) => {
  const { merchantId } = getCryptomusDepositConfig()
  const sign = generateDepositSignature(payload);
  const headers = {
    merchant: merchantId,
    sign,
    "Content-Type": "application/json",
  };

  const url = `https://api.cryptomus.com/v1/${endpoint}`;
  const response = await axios.post(url, payload, { headers });
  return response.data;
};
