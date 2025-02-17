/* eslint-disable */

import crypto from "crypto";
import axios from "axios";

const MERCHANT_ID = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID;
const API_KEY = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY;

if (!MERCHANT_ID || !API_KEY) {
  throw new Error("Cryptomus configuration missing");
}

/**
 * Generates the Cryptomus signature.
 */
const generateSignature = (data: any) => {
  const jsonData = JSON.stringify(data, Object.keys(data).sort());
  const base64Data = Buffer.from(jsonData).toString("base64");
  return crypto.createHash("md5").update(base64Data + API_KEY).digest("hex");
};

/**
 * Calls the Cryptomus API.
 */
export const callCryptomusApi = async (endpoint: string, payload: any) => {
  const sign = generateSignature(payload);

  const headers = {
    merchant: MERCHANT_ID,
    sign,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(`https://api.cryptomus.com/v1/${endpoint}`, payload, { headers });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Cryptomus API error: ${error.response?.data?.message || error.message}`);
    }
    throw new Error("Failed to call Cryptomus API");
  }
};