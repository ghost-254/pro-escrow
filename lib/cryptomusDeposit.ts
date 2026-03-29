import axios from "axios"

import { createCryptomusSignature } from "@/lib/serverPayments"

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
  const { merchantId } = getCryptomusDepositConfig()
  const { apiKey } = getCryptomusDepositConfig()
  const sign = createCryptomusSignature(payload, apiKey)
  const headers = {
    merchant: merchantId,
    sign,
    "Content-Type": "application/json",
  }

  const response = await axios.post(`https://api.cryptomus.com/v1/${endpoint}`, payload, { headers })
  return response.data
}
