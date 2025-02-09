/* eslint-disable no-unused-vars */

"use client"

import { toast } from "react-toastify"

interface AtlosPayOptions {
  merchantId: string
  orderId: string
  orderAmount: number
  orderCurrency: string
  theme: string
  onSuccess: () => Promise<void> | void
  onCanceled: () => Promise<void> | void
  onFailed: () => Promise<void> | void
}

interface Atlos {
  Pay: (params: AtlosPayOptions) => void
}

declare global {
  interface Window {
    atlos?: Atlos
  }
}

// Load from environment. If undefined, fallback to empty string or handle error
const MERCHANT_ID = process.env.NEXT_PUBLIC_ATLOS_MERCHANT_ID || ""

export function loadAtlosScript() {
  const existingScript = document.querySelector(
    'script[src="https://atlos.io/packages/app/atlos.js"]'
  )
  if (existingScript) return

  const script = document.createElement("script")
  script.src = "https://atlos.io/packages/app/atlos.js"
  script.async = true
  script.onerror = () => toast.error("Failed to load payment processor. Please refresh.")
  document.body.appendChild(script)
}

/**
 * Calls window.atlos.Pay with the given parameters, handling success/cancel/fail.
 */
export async function atlosPay({
  merchantId = MERCHANT_ID,
  orderId,
  orderAmount,
  onSuccess,
  onCanceled,
  onFailed,
}: Omit<AtlosPayOptions, "orderCurrency" | "theme">) {
  if (!window.atlos) {
    toast.error("Atlos script not ready.")
    return
  }
  if (!merchantId) {
    toast.error("Missing Atlos Merchant ID. Check your .env config.")
    return
  }

  window.atlos.Pay({
    merchantId,
    orderId,
    orderAmount,
    orderCurrency: "USD",
    theme: "dark",
    onSuccess,
    onCanceled,
    onFailed,
  })
}
