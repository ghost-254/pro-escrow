import axios from "axios"

import { createCryptomusRequestSignature } from "@/lib/serverPayments"

const getCryptomusDepositConfig = () => {
  const merchantId = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID
  const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY

  if (!merchantId || !apiKey) {
    throw new Error("Cryptomus configuration missing")
  }

  return { merchantId, apiKey }
}

export const callCryptomusDepositApi = async (
  endpoint: string,
  payload: Record<string, unknown>
) => {
  const { merchantId, apiKey } = getCryptomusDepositConfig()
  const sign = createCryptomusRequestSignature(payload, apiKey)
  const headers = {
    merchant: merchantId,
    sign,
    "Content-Type": "application/json",
  }

  const response = await axios.post(`https://api.cryptomus.com/v1/${endpoint}`, payload, {
    headers,
    validateStatus: () => true,
  })

  if (response.status < 200 || response.status >= 300) {
    const errorMessage =
      typeof response.data?.message === "string" && response.data.message.trim()
        ? response.data.message
        : typeof response.data?.error === "string" && response.data.error.trim()
          ? response.data.error
          : `Cryptomus Deposit API error: ${response.status || "unknown"}`

    throw new Error(errorMessage)
  }

  return response.data
}
