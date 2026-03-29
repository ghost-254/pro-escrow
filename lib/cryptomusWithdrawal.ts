import axios from "axios"

import { createCryptomusRequestSignature } from "@/lib/serverPayments"

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
  const sign = createCryptomusRequestSignature(payload, apiKey)

  const headers = {
    merchant: merchantId,
    sign,
    "Content-Type": "application/json",
  }

  try {
    const response = await axios.post(`https://api.cryptomus.com/v1/${endpoint}`, payload, {
      headers,
      validateStatus: () => true,
    })

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        typeof response.data?.message === "string" && response.data.message.trim()
          ? response.data.message
          : typeof response.data?.error === "string" && response.data.error.trim()
            ? response.data.error
            : `Cryptomus Payout API error: ${response.status || "unknown"}`
      )
    }

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
