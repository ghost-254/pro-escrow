/* eslint-disable */
import axios from "axios";
import crypto from "crypto";

const MERCHANT_ID = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID;
const API_KEY = process.env.NEXT_SERVER_CRYPTOMUS_PAYOUT_API_KEY;

if (!MERCHANT_ID || !API_KEY) {
  throw new Error("Cryptomus payout configuration missing");
}

/**
 * Generates the Cryptomus signature exactly as in the docs:
 *
 * $data = json_encode($data);
 * $sign = md5(base64_encode($data) . $API_KEY);
 */
const generateSignature = (data: any) => {
  // 1. JSON-encode without sorting
  const jsonData = JSON.stringify(data);

  // 2. Base64-encode the resulting string
  const base64Data = Buffer.from(jsonData).toString("base64");

  // 3. md5(base64Data + API_KEY)
  return crypto.createHash("md5").update(base64Data + API_KEY).digest("hex");
};

/**
 * Calls the Cryptomus payout API endpoint, e.g. "payout" or "someOtherEndpoint"
 */
export const callCryptomusPayoutApi = async (endpoint: string, payload: any) => {
  const sign = generateSignature(payload);

  const headers = {
    merchant: MERCHANT_ID,
    sign,
    "Content-Type": "application/json",
  };

  try {
    const response = await axios.post(
      `https://api.cryptomus.com/v1/${endpoint}`,
      payload,
      { headers }
    );

    // Log the full response data for debugging
    console.log("Cryptomus payout response data:", response.data);

    return response.data; // Return Cryptomus response
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Cryptomus Payout API error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
    throw new Error("Failed to call Cryptomus Payout API");
  }
};
