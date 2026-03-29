import axios from "axios"

import { createCryptomusSignature } from "@/lib/serverPayments"

const getCryptomusPayoutConfig = () => {
  const merchantId = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID
  const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_PAYOUT_API_KEY

  if (!merchantId || !apiKey) {
    throw new Error("Cryptomus payout configuration missing")
  }

  return { merchantId, apiKey }
}

export const callCryptomusPayoutApi = async (
  endpoint: string,
  payload: Record<string, unknown>
) => {
  const { merchantId, apiKey } = getCryptomusPayoutConfig()
  const sign = createCryptomusSignature(payload, apiKey)

  const headers = {
    merchant: merchantId,
    sign,
    "Content-Type": "application/json",
  }

  try {
    const response = await axios.post(
      `https://api.cryptomus.com/v1/${endpoint}`,
      payload,
      { headers }
    )

    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Cryptomus Payout API error: ${
          error.response?.data?.message || error.message
        }`
      )
    }
    throw new Error("Failed to call Cryptomus Payout API")
  }
}
