import * as functions from "firebase-functions";
import axios from "axios";

const CRYPTOMUS_API_URL = "https://api.cryptomus.com/v1/payout";
const MERCHANT_UUID = "your_merchant_uuid"; // Replace with your Cryptomus merchant UUID
const API_KEY = "your_api_key"; // Replace with your Cryptomus API key

export const createPayout = functions.https.onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const { amount, currency, network, order_id, address, url_callback, is_subtract } = req.body;

  const payload = {
    amount,
    currency,
    network,
    order_id,
    address,
    url_callback,
    is_subtract,
  };

  const sign = createSign(payload, API_KEY);

  try {
    const response = await axios.post(CRYPTOMUS_API_URL, payload, {
      headers: {
        merchant: MERCHANT_UUID,
        sign,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error creating payout:", error);
    res.status(500).json({ error: "Failed to create payout" });
  }
});

function createSign(data: any, apiKey: string): string {
  const jsonData = JSON.stringify(data).replace(/\//g, "\\/");
  const sign = require("crypto")
    .createHash("md5")
    .update(Buffer.from(jsonData + apiKey).toString("base64"))
    .digest("hex");
  return sign;
}