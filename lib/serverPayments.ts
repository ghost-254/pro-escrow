import axios from "axios"
import crypto from "crypto"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

import { adminDb } from "@/lib/firebaseAdmin"

export const MPESA_WITHDRAWAL_FEE_KES = 50
export const MPESA_WITHDRAWAL_MIN_KES = 200
export const CRYPTO_WITHDRAWAL_MIN_USD = 10
const MPESA_DEPOSIT_PENDING_TIMEOUT_MS = 60 * 1000
const MPESA_DEPOSIT_RECONCILIATION_TIMEOUT_MS = 2 * 60 * 1000
const MPESA_DEPOSIT_POLLING_LOOKBACK_MS = 5 * 60 * 1000
const MPESA_DEPOSIT_POLLING_LOOKAHEAD_MS = 2 * 60 * 1000
const MPESA_DEPOSIT_TRANSACTION_MATCH_WINDOW_MS = 15 * 60 * 1000
const MPESA_DEPOSIT_TIMEOUT_REASON =
  "This M-Pesa payment request expired. Please try again."
const MPESA_DEPOSIT_POLLING_FALLBACK_ERROR = "initiator information is invalid"

const SUPPORTED_CRYPTO_NETWORKS = new Set(["TRON", "ETH", "BSC", "MATIC", "ARBITRUM"])
const CRYPTOMUS_SUCCESS_STATUSES = new Set(["paid", "paid_over"])
const CRYPTOMUS_FAILURE_STATUSES = new Set([
  "fail",
  "wrong_amount",
  "cancel",
  "system_fail",
  "refund_process",
  "refund_fail",
  "refund_paid",
])
const CRYPTOMUS_PAYOUT_FAILURE_STATUSES = new Set(["fail", "cancel", "system_fail"])
const PENDING_PAYMENT_STATUSES = new Set([
  "pending",
  "processing",
  "initiated",
  "sent",
  "confirm_check",
  "queued",
  "submitted",
])
const GENERIC_COMPLETED_STATUSES = new Set([
  "completed",
  "complete",
  "paid",
  "paid_over",
  "success",
  "processed",
  "transferred",
  "received",
])
const GENERIC_FAILED_STATUSES = new Set([
  "failed",
  "fail",
  "cancel",
  "cancelled",
  "canceled",
  "system_fail",
  "wrong_amount",
  "rejected",
  "declined",
  "expired",
  "refund_fail",
  "refund_paid",
])
const GENERIC_PENDING_STATUSES = new Set([
  "pending",
  "processing",
  "initiated",
  "sent",
  "confirm_check",
  "queued",
  "submitted",
])

// eslint-disable-next-line @typescript-eslint/no-require-imports
const K2 = require("k2-connect-node")({
  clientId: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_ID,
  clientSecret: process.env.NEXT_SERVER_KOPOKOPO_CLIENT_SECRET,
  apiKey: process.env.NEXT_SERVER_KOPOKOPO_API_KEY,
  baseUrl: process.env.NEXT_SERVER_KOPOKOPO_BASE_URL,
})

const { PayService, TokenService } = K2

function createStatusError(message: string, status: number) {
  const error = new Error(message) as Error & { status: number }
  error.status = status
  return error
}

function safeCompareStrings(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8")
  const rightBuffer = Buffer.from(right, "utf8")

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

function serializeCryptomusPayload(payload: unknown, { escapeSlashes = false }: { escapeSlashes?: boolean } = {}) {
  const serializedPayload = JSON.stringify(payload)

  if (escapeSlashes) {
    return serializedPayload.replace(/\//g, "\\/")
  }

  return serializedPayload
}

function getCryptomusApiKey(apiKey: string | undefined, label: string) {
  if (!apiKey) {
    throw new Error(`${label} configuration missing`)
  }

  return apiKey
}

function setInitialUserBalances(currency: "KES" | "USD", amount: number) {
  return {
    userKesBalance: currency === "KES" ? amount : 0,
    userUsdBalance: currency === "USD" ? amount : 0,
    frozenUserKesBalance: 0,
    frozenUserUsdBalance: 0,
    updatedAt: Timestamp.now(),
  }
}

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}

function getTimestampMillis(value: unknown) {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis()
  }

  return 0
}

function isPendingStatus(status: unknown) {
  return PENDING_PAYMENT_STATUSES.has(String(status || "").toLowerCase())
}

function hasTimedOutMpesaDepositRequest(data: Record<string, unknown>) {
  const createdAtMillis = getTimestampMillis(data.createdAt)

  if (!createdAtMillis) {
    return false
  }

  return Date.now() - createdAtMillis >= MPESA_DEPOSIT_PENDING_TIMEOUT_MS
}

function normalizeProviderStatusValue(status: unknown) {
  return typeof status === "string" ? status.trim().toLowerCase() : ""
}

function normalizeProviderStatusList(...statuses: unknown[]) {
  return statuses
    .map((status) => normalizeProviderStatusValue(status))
    .filter(Boolean)
}

function inferGenericTransactionStatus(
  primaryStatus: unknown,
  ...secondaryStatuses: unknown[]
) {
  const primaryCandidates = normalizeProviderStatusList(primaryStatus)
  const secondaryCandidates = normalizeProviderStatusList(...secondaryStatuses)

  if (primaryCandidates.some((candidate) => GENERIC_COMPLETED_STATUSES.has(candidate))) {
    return "completed"
  }

  if (primaryCandidates.some((candidate) => GENERIC_FAILED_STATUSES.has(candidate))) {
    return "failed"
  }

  if (secondaryCandidates.some((candidate) => GENERIC_COMPLETED_STATUSES.has(candidate))) {
    return "completed"
  }

  if (secondaryCandidates.some((candidate) => GENERIC_FAILED_STATUSES.has(candidate))) {
    return "failed"
  }

  if (
    primaryCandidates.some((candidate) => GENERIC_PENDING_STATUSES.has(candidate)) ||
    secondaryCandidates.some((candidate) => GENERIC_PENDING_STATUSES.has(candidate))
  ) {
    return "pending"
  }

  return "pending"
}

function inferDocumentedIncomingPaymentStatus(options: {
  status: unknown
  resourceStatus: unknown
  paymentReference: unknown
}) {
  const requestStatus = normalizeProviderStatusValue(options.status)
  const resourceStatus = normalizeProviderStatusValue(options.resourceStatus)
  const hasPaymentReference =
    typeof options.paymentReference === "string" && options.paymentReference.trim().length > 0

  if (requestStatus === "pending") {
    return "pending"
  }

  if (requestStatus === "failed") {
    return "failed"
  }

  if (requestStatus === "success") {
    return resourceStatus === "received" && hasPaymentReference ? "completed" : "pending"
  }

  return inferGenericTransactionStatus(requestStatus, resourceStatus)
}

function normalizePhoneComparisonValue(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : ""
}

function parseIsoDateMillis(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return 0
  }

  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getConfiguredAppBaseUrlFromEnv() {
  const configuredBaseUrl =
    process.env.NEXT_SERVER_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim()

  if (!configuredBaseUrl) {
    throw createStatusError("Application base URL configuration missing.", 500)
  }

  return configuredBaseUrl.replace(/\/$/, "")
}

function getKopoKopoBaseUrl() {
  const baseUrl = process.env.NEXT_SERVER_KOPOKOPO_BASE_URL?.trim()

  if (!baseUrl) {
    throw createStatusError("KopoKopo configuration missing", 500)
  }

  return baseUrl.replace(/\/$/, "")
}

function getKopoKopoRequestHeaders(accessToken: string, includeContentType = false) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "pro-escrow/1.0",
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

function getKopoKopoErrorMessage(payload: unknown, fallbackMessage: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim()
  }

  const data = asRecord(payload)
  if (typeof data.error_message === "string" && data.error_message.trim()) {
    return data.error_message
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message
  }

  return fallbackMessage
}

async function getKopoKopoAccessToken() {
  const tokenResponse = await TokenService.getToken()
  const accessToken = tokenResponse?.access_token

  if (!accessToken) {
    throw new Error("Unable to authenticate with KopoKopo")
  }

  return accessToken
}

export async function initiateKopoKopoIncomingPayment(options: {
  accessToken: string
  tillNumber: string
  firstName: string
  lastName: string
  phoneNumber: string
  email?: string | null
  amount: number
  callbackUrl: string
  metadata?: Record<string, unknown>
}) {
  const response = await axios.post(
    `${getKopoKopoBaseUrl()}/api/v1/incoming_payments`,
    {
      payment_channel: "M-PESA STK Push",
      till_number: options.tillNumber,
      subscriber: {
        first_name: options.firstName,
        last_name: options.lastName,
        phone_number: options.phoneNumber,
        email: options.email ?? undefined,
      },
      amount: {
        currency: "KES",
        value: options.amount,
      },
      metadata: options.metadata ?? {},
      _links: {
        callback_url: options.callbackUrl,
      },
    },
    {
      headers: getKopoKopoRequestHeaders(options.accessToken, true),
      validateStatus: () => true,
    }
  )

  if (response.status < 200 || response.status >= 300) {
    throw createStatusError(
      getKopoKopoErrorMessage(response.data, "Failed to initiate M-Pesa deposit."),
      response.status || 400
    )
  }

  const responseLocation =
    typeof response.headers.location === "string" ? response.headers.location : ""
  const paymentRequestId = responseLocation.split("/").pop() ?? ""

  if (!paymentRequestId) {
    throw new Error("Unable to extract paymentRequestId from response")
  }

  return {
    paymentRequestId,
    responseLocation,
    payload: asRecord(response.data),
  }
}

export async function getKopoKopoIncomingPaymentStatus(options: {
  accessToken: string
  location?: string
  paymentRequestId?: string
}) {
  const resolvedLocation =
    typeof options.location === "string" && options.location.trim()
      ? options.location.trim()
      : typeof options.paymentRequestId === "string" && options.paymentRequestId.trim()
        ? `${getKopoKopoBaseUrl()}/api/v1/incoming_payments/${options.paymentRequestId.trim()}`
        : ""

  if (!resolvedLocation) {
    throw new Error("Missing KopoKopo incoming payment reference")
  }

  const response = await axios.get(resolvedLocation, {
    headers: getKopoKopoRequestHeaders(options.accessToken),
    validateStatus: () => true,
  })

  if (response.status < 200 || response.status >= 300) {
    throw createStatusError(
      getKopoKopoErrorMessage(response.data, "Failed to fetch KopoKopo incoming payment status."),
      response.status || 400
    )
  }

  return {
    location: resolvedLocation,
    payload: asRecord(response.data),
  }
}

function getKopoKopoPollingCallbackUrl() {
  const explicitUrl = process.env.NEXT_SERVER_KOPOKOPO_POLLING_CALLBACK_URL?.trim()

  if (explicitUrl) {
    return explicitUrl
  }

  return `${getConfiguredAppBaseUrlFromEnv()}/api/deposit/polling-webhook`
}

export async function initiateKopoKopoPollingRequest(options: {
  accessToken: string
  scope: "company" | "till"
  scopeReference?: string | null
  fromTime: string
  toTime: string
  callbackUrl?: string
}) {
  const response = await axios.post(
    `${getKopoKopoBaseUrl()}/api/v1/polling`,
    {
      scope: options.scope,
      scope_reference: options.scopeReference ?? "",
      from_time: options.fromTime,
      to_time: options.toTime,
      _links: {
        callback_url: options.callbackUrl || getKopoKopoPollingCallbackUrl(),
      },
    },
    {
      headers: getKopoKopoRequestHeaders(options.accessToken, true),
      validateStatus: () => true,
    }
  )

  if (response.status < 200 || response.status >= 300) {
    throw createStatusError(
      getKopoKopoErrorMessage(response.data, "Failed to create KopoKopo polling request."),
      response.status || 400
    )
  }

  const responseLocation =
    typeof response.headers.location === "string" ? response.headers.location : ""
  const pollingRequestId = responseLocation.split("/").pop() ?? ""

  if (!pollingRequestId) {
    throw new Error("Unable to extract pollingRequestId from response")
  }

  return {
    pollingRequestId,
    responseLocation,
    payload: asRecord(response.data),
  }
}

export async function getKopoKopoPollingStatus(options: {
  accessToken: string
  location?: string
  pollingRequestId?: string
}) {
  const resolvedLocation =
    typeof options.location === "string" && options.location.trim()
      ? options.location.trim()
      : typeof options.pollingRequestId === "string" && options.pollingRequestId.trim()
        ? `${getKopoKopoBaseUrl()}/api/v1/polling/${options.pollingRequestId.trim()}`
        : ""

  if (!resolvedLocation) {
    throw new Error("Missing KopoKopo polling reference")
  }

  const response = await axios.get(resolvedLocation, {
    headers: getKopoKopoRequestHeaders(options.accessToken),
    validateStatus: () => true,
  })

  if (response.status < 200 || response.status >= 300) {
    throw createStatusError(
      getKopoKopoErrorMessage(response.data, "Failed to fetch KopoKopo polling status."),
      response.status || 400
    )
  }

  return {
    location: resolvedLocation,
    payload: asRecord(response.data),
  }
}

function getKopoKopoPaymentLocation(data: Record<string, unknown>) {
  if (typeof data.providerLocation === "string" && data.providerLocation.trim()) {
    return data.providerLocation
  }

  if (typeof data.paymentReference === "string" && data.paymentReference.trim()) {
    return `${getKopoKopoBaseUrl()}/api/v1/payments/${data.paymentReference}`
  }

  return ""
}

function extractKopoKopoDepositResult(payload: Record<string, unknown>) {
  const data = asRecord(payload.data)
  const attributes = asRecord(data.attributes)
  const event = asRecord(attributes.event)
  const resource = asRecord(event.resource)
  const metadata = asRecord(attributes.metadata)
  const links = asRecord(attributes._links)

  return {
    requestId: typeof data.id === "string" ? data.id : "",
    status: typeof attributes.status === "string" ? attributes.status.toLowerCase() : "",
    resourceStatus: typeof resource.status === "string" ? resource.status.toLowerCase() : "",
    metadata,
    amount:
      typeof resource.amount === "number" || typeof resource.amount === "string"
        ? Number(resource.amount)
        : 0,
    currency: typeof resource.currency === "string" ? resource.currency.toUpperCase() : "",
    paymentReference: typeof resource.reference === "string" ? resource.reference : null,
    providerLocation: typeof links.self === "string" ? links.self : "",
    errorMessage: typeof event.errors === "string" ? event.errors : null,
  }
}

function extractKopoKopoWithdrawalResult(payload: Record<string, unknown>) {
  const data = asRecord(payload.data)
  const attributes = asRecord(data.attributes)
  const metadata = asRecord(attributes.metadata)
  const transferBatches = Array.isArray(attributes.transfer_batches) ? attributes.transfer_batches : []
  const firstTransferBatch = transferBatches.find(
    (batch) => typeof batch === "object" && batch !== null
  ) as Record<string, unknown> | undefined
  const firstDisbursement = transferBatches
    .flatMap((batch) => {
      const batchRecord = asRecord(batch)
      return Array.isArray(batchRecord.disbursements) ? batchRecord.disbursements : []
    })
    .find((item) => typeof item === "object" && item !== null) as Record<string, unknown> | undefined
  const links = asRecord(attributes._links)

  return {
    paymentId: typeof data.id === "string" ? data.id : "",
    status: typeof attributes.status === "string" ? attributes.status.toLowerCase() : "",
    transferStatus:
      firstTransferBatch && typeof firstTransferBatch.status === "string"
        ? firstTransferBatch.status.toLowerCase()
        : "",
    disbursementStatus:
      firstDisbursement && typeof firstDisbursement.status === "string"
        ? firstDisbursement.status.toLowerCase()
        : "",
    metadata,
    providerLocation: typeof links.self === "string" ? links.self : "",
    transactionReference:
      firstDisbursement && typeof firstDisbursement.transaction_reference === "string"
        ? firstDisbursement.transaction_reference
        : null,
  }
}

function extractKopoKopoPollingResult(payload: Record<string, unknown>) {
  const data = asRecord(payload.data)
  const attributes = asRecord(data.attributes)
  const links = asRecord(attributes._links)
  const transactions = Array.isArray(attributes.transactions) ? attributes.transactions : []

  return {
    requestId: typeof data.id === "string" ? data.id : "",
    status: typeof attributes.status === "string" ? attributes.status.toLowerCase() : "",
    transactions: transactions.filter(
      (transaction): transaction is Record<string, unknown> =>
        typeof transaction === "object" && transaction !== null
    ),
    providerLocation: typeof links.self === "string" ? links.self : "",
  }
}

function findMatchingKopoKopoPollingTransaction(
  depositData: Record<string, unknown>,
  payload: Record<string, unknown>
) {
  const pollingResult = extractKopoKopoPollingResult(payload)
  const depositPhone = normalizePhoneComparisonValue(depositData.phoneNumber)
  const depositAmount = Number(depositData.amount || 0)
  const depositCurrency = String(depositData.currency || "KES").toUpperCase()
  const depositCreatedAtMillis = getTimestampMillis(depositData.createdAt)

  const candidates = pollingResult.transactions
    .map((transaction) => {
      const resource = asRecord(transaction.resource)
      const transactionStatus = normalizeProviderStatusValue(resource.status)
      const transactionPhone = normalizePhoneComparisonValue(resource.sender_phone_number)
      const transactionAmount =
        typeof resource.amount === "number" || typeof resource.amount === "string"
          ? Number(resource.amount)
          : 0
      const transactionCurrency =
        typeof resource.currency === "string" ? resource.currency.toUpperCase() : ""
      const transactionTimeMillis = parseIsoDateMillis(resource.origination_time)

      return {
        resource,
        transactionStatus,
        transactionPhone,
        transactionAmount,
        transactionCurrency,
        transactionTimeMillis,
      }
    })
    .filter((candidate) => {
      if (normalizeProviderStatusValue(candidate.transactionStatus) !== "received") {
        return false
      }

      if (!depositPhone || candidate.transactionPhone !== depositPhone) {
        return false
      }

      if (Math.abs(candidate.transactionAmount - depositAmount) > 0.01) {
        return false
      }

      if (candidate.transactionCurrency && candidate.transactionCurrency !== depositCurrency) {
        return false
      }

      if (!depositCreatedAtMillis || !candidate.transactionTimeMillis) {
        return true
      }

      return (
        Math.abs(candidate.transactionTimeMillis - depositCreatedAtMillis) <=
        MPESA_DEPOSIT_TRANSACTION_MATCH_WINDOW_MS
      )
    })
    .sort((left, right) => {
      const leftDistance = depositCreatedAtMillis
        ? Math.abs(left.transactionTimeMillis - depositCreatedAtMillis)
        : 0
      const rightDistance = depositCreatedAtMillis
        ? Math.abs(right.transactionTimeMillis - depositCreatedAtMillis)
        : 0

      return leftDistance - rightDistance
    })

  return candidates[0]?.resource ?? null
}

export function parseMoneyAmount(
  value: unknown,
  fieldName: string,
  { min = 0.01, max }: { min?: number; max?: number } = {}
) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    throw createStatusError(`${fieldName} must be a valid number.`, 400)
  }

  const roundedValue = Number(numericValue.toFixed(2))

  if (roundedValue < min) {
    throw createStatusError(`${fieldName} must be at least ${min}.`, 400)
  }

  if (typeof max === "number" && roundedValue > max) {
    throw createStatusError(`${fieldName} must not exceed ${max}.`, 400)
  }

  return roundedValue
}

export function sanitizePersonName(value: unknown, fieldName: string) {
  const normalized = typeof value === "string" ? value.trim() : ""

  if (!normalized) {
    throw createStatusError(`${fieldName} is required.`, 400)
  }

  if (normalized.length > 80) {
    throw createStatusError(`${fieldName} is too long.`, 400)
  }

  return normalized
}

export function normalizeKenyanPhoneNumber(value: unknown) {
  const rawValue = typeof value === "string" ? value.trim() : ""
  const compactValue = rawValue.replace(/[\s-]/g, "")

  if (!compactValue) {
    throw createStatusError("Phone number is required.", 400)
  }

  if (/^0\d{9}$/.test(compactValue)) {
    return `+254${compactValue.slice(1)}`
  }

  if (/^254\d{9}$/.test(compactValue)) {
    return `+${compactValue}`
  }

  if (/^\+254\d{9}$/.test(compactValue)) {
    return compactValue
  }

  throw createStatusError("Use a valid Kenyan mobile number in the format +2547XXXXXXXX.", 400)
}

export function sanitizeWalletAddress(value: unknown) {
  const normalized = typeof value === "string" ? value.trim() : ""

  if (!normalized) {
    throw createStatusError("Wallet address is required.", 400)
  }

  if (/\s/.test(normalized)) {
    throw createStatusError("Wallet address must not contain spaces.", 400)
  }

  if (normalized.length < 12 || normalized.length > 255) {
    throw createStatusError("Wallet address format looks invalid.", 400)
  }

  return normalized
}

export function normalizeCryptoNetwork(value: unknown) {
  const normalized = typeof value === "string" ? value.trim().toUpperCase() : ""

  if (!SUPPORTED_CRYPTO_NETWORKS.has(normalized)) {
    throw createStatusError("Unsupported crypto network.", 400)
  }

  return normalized
}

export function resolveAppBaseUrl(request: Request) {
  const configuredBaseUrl =
    process.env.NEXT_SERVER_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim()

  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "")
  }

  return new URL(request.url).origin
}

export function resolveCallbackUrl(request: Request, callbackPath: string, explicitUrl?: string) {
  const normalizedExplicitUrl = explicitUrl?.trim()

  if (normalizedExplicitUrl) {
    return normalizedExplicitUrl
  }

  return `${resolveAppBaseUrl(request)}${callbackPath}`
}

export function createCryptomusRequestSignature(payload: unknown, apiKey: string) {
  const serializedPayload = serializeCryptomusPayload(payload)
  return crypto
    .createHash("md5")
    .update(Buffer.from(serializedPayload).toString("base64") + apiKey)
    .digest("hex")
}

export function createCryptomusWebhookSignature(payload: unknown, apiKey: string) {
  const serializedPayload = serializeCryptomusPayload(payload, { escapeSlashes: true })
  return crypto
    .createHash("md5")
    .update(Buffer.from(serializedPayload).toString("base64") + apiKey)
    .digest("hex")
}

export function verifyCryptomusWebhookSignature(
  rawBody: string,
  apiKey: string | undefined,
  label: string
) {
  const payload = JSON.parse(rawBody) as Record<string, unknown>
  const receivedSign = typeof payload.sign === "string" ? payload.sign : ""

  if (!receivedSign) {
    throw createStatusError("Missing webhook signature.", 401)
  }

  const { sign, ...unsignedPayload } = payload

  void sign
  const expectedSign = createCryptomusWebhookSignature(
    unsignedPayload,
    getCryptomusApiKey(apiKey, label)
  )

  if (!safeCompareStrings(expectedSign, receivedSign)) {
    throw createStatusError("Invalid signature", 401)
  }

  return { payload, unsignedPayload }
}

export function verifyKopoKopoWebhookSignature(rawBody: string, signature: string | null) {
  const apiKey = process.env.NEXT_SERVER_KOPOKOPO_API_KEY?.trim()

  if (!apiKey) {
    throw createStatusError("KopoKopo configuration missing", 500)
  }

  if (!signature) {
    throw createStatusError("Missing webhook signature.", 401)
  }

  const normalizedSignature = signature.trim().toLowerCase()
  const candidateBodies = [rawBody]

  try {
    const parsedPayload = JSON.parse(rawBody)
    const normalizedBody = JSON.stringify(parsedPayload)

    if (normalizedBody && normalizedBody !== rawBody) {
      candidateBodies.push(normalizedBody)
    }
  } catch {
    // Ignore JSON parsing errors here and fall back to the raw payload.
  }

  const isValid = candidateBodies.some((candidateBody) => {
    const expectedSignature = crypto
      .createHmac("sha256", apiKey)
      .update(candidateBody)
      .digest("hex")

    return safeCompareStrings(expectedSignature, normalizedSignature)
  })

  if (!isValid) {
    throw createStatusError("Invalid signature", 401)
  }
}

export function normalizeCryptomusDepositStatus(providerStatus: unknown, isFinal: unknown) {
  const normalizedStatus = typeof providerStatus === "string" ? providerStatus.toLowerCase() : ""

  if (CRYPTOMUS_SUCCESS_STATUSES.has(normalizedStatus)) {
    return "completed"
  }

  if (CRYPTOMUS_FAILURE_STATUSES.has(normalizedStatus) || Boolean(isFinal)) {
    return "failed"
  }

  return "processing"
}

export function normalizeCryptomusPayoutStatus(providerStatus: unknown) {
  const normalizedStatus = typeof providerStatus === "string" ? providerStatus.toLowerCase() : ""

  if (normalizedStatus === "paid") {
    return "completed"
  }

  if (CRYPTOMUS_PAYOUT_FAILURE_STATUSES.has(normalizedStatus)) {
    return "failed"
  }

  return "processing"
}

export async function applyCryptomusDepositUpdate(options: {
  depositId: string
  payload: Record<string, unknown>
  providerStatus: unknown
  isFinal: unknown
}) {
  const { depositId, payload, providerStatus, isFinal } = options
  const normalizedStatus = normalizeCryptomusDepositStatus(providerStatus, isFinal)
  const providerStatusValue = typeof providerStatus === "string" ? providerStatus : "unknown"
  const depositRef = adminDb.collection("deposits").doc(depositId)

  await adminDb.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef)

    if (!depositSnapshot.exists) {
      throw new Error("Deposit not found")
    }

    const depositData = depositSnapshot.data() ?? {}
    const creditedAmount = Number(depositData.amount || 0)
    const currentStatus = String(depositData.status || "")

    if (currentStatus === "completed" && depositData.balanceCredited) {
      transaction.update(depositRef, {
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "completed") {
      if (!depositData.balanceCredited) {
        const userRef = adminDb.collection("users").doc(String(depositData.uid || ""))
        const userSnapshot = await transaction.get(userRef)

        if (!userSnapshot.exists) {
          transaction.set(userRef, setInitialUserBalances("USD", creditedAmount), { merge: true })
        } else {
          transaction.update(userRef, {
            userUsdBalance: FieldValue.increment(creditedAmount),
            updatedAt: Timestamp.now(),
          })
        }
      }

      transaction.update(depositRef, {
        status: "completed",
        providerStatus: providerStatusValue,
        balanceCredited: true,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "failed") {
      transaction.update(depositRef, {
        status: depositData.balanceCredited ? "completed" : "failed",
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
        failureReason:
          typeof payload.status === "string" && !depositData.balanceCredited
            ? payload.status
            : depositData.failureReason ?? null,
      })
      return
    }

    transaction.update(depositRef, {
      status: depositData.balanceCredited ? "completed" : "processing",
      providerStatus: providerStatusValue,
      providerPayload: payload,
      updatedAt: Timestamp.now(),
    })
  })
}

export async function applyKopoKopoDepositUpdate(options: {
  depositId: string
  payload: Record<string, unknown>
}) {
  const { depositId, payload } = options
  const depositRef = adminDb.collection("deposits").doc(depositId)
  const result = extractKopoKopoDepositResult(payload)
  const normalizedStatus = inferDocumentedIncomingPaymentStatus({
    status: result.status,
    resourceStatus: result.resourceStatus,
    paymentReference: result.paymentReference,
  })
  const providerStatusValue = result.status || result.resourceStatus || "pending"
  const providerResourceStatusValue = result.resourceStatus || null

  await adminDb.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef)

    if (!depositSnapshot.exists) {
      throw new Error("Deposit not found")
    }

    const depositData = depositSnapshot.data() ?? {}
    const creditedAmount = Number(depositData.amount || 0)
    const currentStatus = String(depositData.status || "")

    if (currentStatus === "completed" && depositData.balanceCredited) {
      transaction.update(depositRef, {
        providerStatus: providerStatusValue,
        providerResourceStatus: providerResourceStatusValue,
        paymentRequestId: result.requestId || depositData.paymentRequestId || null,
        paymentReference: result.paymentReference || depositData.paymentReference || null,
        providerLocation: result.providerLocation || depositData.providerLocation || null,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "completed") {
      if (result.currency && result.currency !== "KES") {
        throw new Error("Unexpected currency received for M-Pesa deposit")
      }

      if (result.amount > 0 && Math.abs(result.amount - creditedAmount) > 0.01) {
        throw new Error("Deposit amount mismatch detected")
      }

      if (!depositData.balanceCredited) {
        const userRef = adminDb.collection("users").doc(String(depositData.uid || ""))
        const userSnapshot = await transaction.get(userRef)

        if (!userSnapshot.exists) {
          transaction.set(userRef, setInitialUserBalances("KES", creditedAmount), { merge: true })
        } else {
          transaction.update(userRef, {
            userKesBalance: FieldValue.increment(creditedAmount),
            updatedAt: Timestamp.now(),
          })
        }
      }

      transaction.update(depositRef, {
        status: "completed",
        providerStatus: providerStatusValue,
        providerResourceStatus: providerResourceStatusValue,
        balanceCredited: true,
        paymentRequestId: result.requestId || depositData.paymentRequestId || null,
        paymentReference: result.paymentReference || depositData.paymentReference || null,
        providerLocation: result.providerLocation || depositData.providerLocation || null,
        providerPayload: payload,
        pendingFailureReason: null,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "failed") {
      transaction.update(depositRef, {
        status: depositData.balanceCredited ? "completed" : "failed",
        providerStatus: providerStatusValue,
        providerResourceStatus: providerResourceStatusValue,
        paymentRequestId: result.requestId || depositData.paymentRequestId || null,
        paymentReference: result.paymentReference || depositData.paymentReference || null,
        providerLocation: result.providerLocation || depositData.providerLocation || null,
        providerPayload: payload,
        pendingFailureReason: null,
        failureReason:
          result.errorMessage ||
          result.status ||
          result.resourceStatus ||
          depositData.failureReason ||
          "Deposit failed.",
        updatedAt: Timestamp.now(),
      })
      return
    }

    transaction.update(depositRef, {
      status: depositData.balanceCredited ? "completed" : "pending",
      providerStatus: providerStatusValue,
      providerResourceStatus: providerResourceStatusValue,
      paymentRequestId: result.requestId || depositData.paymentRequestId || null,
      paymentReference: result.paymentReference || depositData.paymentReference || null,
      providerLocation: result.providerLocation || depositData.providerLocation || null,
      providerPayload: payload,
      pendingFailureReason: null,
      updatedAt: Timestamp.now(),
    })
  })
}

function shouldUseMpesaPollingFallback(errorMessage: unknown) {
  return normalizeProviderStatusValue(errorMessage).includes(MPESA_DEPOSIT_POLLING_FALLBACK_ERROR)
}

function hasTimedOutMpesaDepositReconciliation(data: Record<string, unknown>) {
  const startedAtMillis =
    getTimestampMillis(data.reconciliationStartedAt) || getTimestampMillis(data.createdAt)

  if (!startedAtMillis) {
    return false
  }

  return Date.now() - startedAtMillis >= MPESA_DEPOSIT_RECONCILIATION_TIMEOUT_MS
}

async function markMpesaDepositFailedAfterReconciliation(options: {
  depositId: string
  failureReason: string
}) {
  await adminDb.collection("deposits").doc(options.depositId).set(
    {
      status: "failed",
      providerStatus: "failed",
      providerResourceStatus: null,
      failureReason: options.failureReason,
      pendingFailureReason: null,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )
}

async function applyKopoKopoPollingTransactionToDeposit(options: {
  depositId: string
  payload: Record<string, unknown>
  transactionResource: Record<string, unknown>
}) {
  const { depositId, payload, transactionResource } = options
  const depositRef = adminDb.collection("deposits").doc(depositId)
  const transactionAmount =
    typeof transactionResource.amount === "number" || typeof transactionResource.amount === "string"
      ? Number(transactionResource.amount)
      : 0
  const transactionCurrency =
    typeof transactionResource.currency === "string"
      ? transactionResource.currency.toUpperCase()
      : "KES"
  const paymentReference =
    typeof transactionResource.reference === "string" ? transactionResource.reference : null
  const resourceStatus =
    typeof transactionResource.status === "string" ? transactionResource.status.toLowerCase() : "received"

  await adminDb.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef)

    if (!depositSnapshot.exists) {
      throw new Error("Deposit not found")
    }

    const depositData = depositSnapshot.data() ?? {}
    const creditedAmount = Number(depositData.amount || 0)
    const currentStatus = String(depositData.status || "")

    if (currentStatus === "completed" && depositData.balanceCredited) {
      transaction.update(depositRef, {
        providerStatus: "success",
        providerResourceStatus: resourceStatus,
        paymentReference: paymentReference || depositData.paymentReference || null,
        providerPayload: payload,
        pendingFailureReason: null,
        updatedAt: Timestamp.now(),
      })
      return
    }

    if (transactionCurrency && transactionCurrency !== "KES") {
      throw new Error("Unexpected currency received for M-Pesa deposit")
    }

    if (transactionAmount > 0 && Math.abs(transactionAmount - creditedAmount) > 0.01) {
      throw new Error("Deposit amount mismatch detected")
    }

    if (!depositData.balanceCredited) {
      const userRef = adminDb.collection("users").doc(String(depositData.uid || ""))
      const userSnapshot = await transaction.get(userRef)

      if (!userSnapshot.exists) {
        transaction.set(userRef, setInitialUserBalances("KES", creditedAmount), { merge: true })
      } else {
        transaction.update(userRef, {
          userKesBalance: FieldValue.increment(creditedAmount),
          updatedAt: Timestamp.now(),
        })
      }
    }

    transaction.update(depositRef, {
      status: "completed",
      providerStatus: "success",
      providerResourceStatus: resourceStatus,
      balanceCredited: true,
      paymentReference: paymentReference || depositData.paymentReference || null,
      providerPayload: payload,
      pendingFailureReason: null,
      failureReason: null,
      updatedAt: Timestamp.now(),
      completedAt: Timestamp.now(),
    })
  })
}

async function ensureMpesaDepositPollingRequest(options: {
  depositId: string
  depositData: Record<string, unknown>
  accessToken: string
}) {
  const existingLocation =
    typeof options.depositData.pollingRequestLocation === "string"
      ? options.depositData.pollingRequestLocation.trim()
      : ""

  if (existingLocation) {
    return {
      pollingRequestId:
        typeof options.depositData.pollingRequestId === "string"
          ? options.depositData.pollingRequestId
          : "",
      responseLocation: existingLocation,
    }
  }

  const tillNumber = process.env.NEXT_SERVER_KOPOKOPO_TILL_NUMBER?.trim()

  if (!tillNumber) {
    throw createStatusError("KopoKopo till number is not configured.", 500)
  }

  const createdAtMillis = getTimestampMillis(options.depositData.createdAt) || Date.now()
  const fromTime = new Date(createdAtMillis - MPESA_DEPOSIT_POLLING_LOOKBACK_MS).toISOString()
  const toTime = new Date(Date.now() + MPESA_DEPOSIT_POLLING_LOOKAHEAD_MS).toISOString()
  const pollingRequest = await initiateKopoKopoPollingRequest({
    accessToken: options.accessToken,
    scope: "till",
    scopeReference: tillNumber,
    fromTime,
    toTime,
  })

  await adminDb.collection("deposits").doc(options.depositId).set(
    {
      pollingRequestId: pollingRequest.pollingRequestId,
      pollingRequestLocation: pollingRequest.responseLocation,
      reconciliationStartedAt:
        options.depositData.reconciliationStartedAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )

  return pollingRequest
}

async function reconcileMpesaDepositPollingStatus(options: {
  depositId: string
  depositData: Record<string, unknown>
  accessToken: string
}) {
  const pollingLocation =
    typeof options.depositData.pollingRequestLocation === "string"
      ? options.depositData.pollingRequestLocation.trim()
      : ""
  const pollingRequestId =
    typeof options.depositData.pollingRequestId === "string"
      ? options.depositData.pollingRequestId
      : ""

  if (!pollingLocation && !pollingRequestId) {
    return false
  }

  const { payload } = await getKopoKopoPollingStatus({
    accessToken: options.accessToken,
    location: pollingLocation,
    pollingRequestId,
  })
  const pollingResult = extractKopoKopoPollingResult(payload)
  const matchedTransaction = findMatchingKopoKopoPollingTransaction(options.depositData, payload)

  await adminDb.collection("deposits").doc(options.depositId).set(
    {
      pollingRequestId: pollingResult.requestId || pollingRequestId || null,
      pollingRequestLocation: pollingResult.providerLocation || pollingLocation || null,
      pollingStatus: pollingResult.status || null,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  )

  if (matchedTransaction) {
    await applyKopoKopoPollingTransactionToDeposit({
      depositId: options.depositId,
      payload,
      transactionResource: matchedTransaction,
    })
    return true
  }

  const pollingStatus = normalizeProviderStatusValue(pollingResult.status)
  const fallbackFailureReason =
    typeof options.depositData.pendingFailureReason === "string" &&
    options.depositData.pendingFailureReason.trim()
      ? options.depositData.pendingFailureReason
      : "We could not confirm this M-Pesa payment."

  if (pollingStatus === "success" || pollingStatus === "failed") {
    await markMpesaDepositFailedAfterReconciliation({
      depositId: options.depositId,
      failureReason: fallbackFailureReason,
    })
    return true
  }

  if (hasTimedOutMpesaDepositReconciliation(options.depositData)) {
    await markMpesaDepositFailedAfterReconciliation({
      depositId: options.depositId,
      failureReason: fallbackFailureReason,
    })
    return true
  }

  return false
}

async function expireTimedOutMpesaDeposit(depositId: string) {
  const depositRef = adminDb.collection("deposits").doc(depositId)

  const expired = await adminDb.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef)

    if (!depositSnapshot.exists) {
      return false
    }

    const depositData = depositSnapshot.data() ?? {}

    if (String(depositData.method || "").toLowerCase() !== "m-pesa") {
      return false
    }

    if (!isPendingStatus(depositData.status) || depositData.balanceCredited) {
      return false
    }

    if (!hasTimedOutMpesaDepositRequest(depositData)) {
      return false
    }

    transaction.update(depositRef, {
      status: "failed",
      providerStatus: "expired",
      providerResourceStatus: "expired",
      failureReason: MPESA_DEPOSIT_TIMEOUT_REASON,
      updatedAt: Timestamp.now(),
      expiredAt: Timestamp.now(),
    })

    return true
  })

  return expired
}

export async function applyCryptomusPayoutUpdate(options: {
  withdrawalId: string
  payload: Record<string, unknown>
  providerStatus: unknown
}) {
  const { withdrawalId, payload, providerStatus } = options
  const normalizedStatus = normalizeCryptomusPayoutStatus(providerStatus)
  const providerStatusValue = typeof providerStatus === "string" ? providerStatus : "unknown"
  const withdrawalRef = adminDb.collection("withdrawals").doc(withdrawalId)

  await adminDb.runTransaction(async (transaction) => {
    const withdrawalSnapshot = await transaction.get(withdrawalRef)

    if (!withdrawalSnapshot.exists) {
      throw new Error("Withdrawal not found")
    }

    const withdrawalData = withdrawalSnapshot.data() ?? {}
    const currentStatus = String(withdrawalData.status || "")

    if (currentStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      })
      return
    }

    if (withdrawalData.balanceRefunded && normalizedStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "completed") {
      transaction.update(withdrawalRef, {
        status: "completed",
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "failed") {
      const userRef = adminDb.collection("users").doc(String(withdrawalData.uid || ""))

      if (withdrawalData.balanceDeducted && !withdrawalData.balanceRefunded) {
        transaction.update(userRef, {
          userUsdBalance: FieldValue.increment(Number(withdrawalData.amount || 0)),
          updatedAt: Timestamp.now(),
        })
      }

      transaction.update(withdrawalRef, {
        status: "failed",
        providerStatus: providerStatusValue,
        providerPayload: payload,
        balanceRefunded: true,
        updatedAt: Timestamp.now(),
        failureReason:
          typeof payload.status === "string" ? payload.status : withdrawalData.failureReason ?? null,
      })
      return
    }

    transaction.update(withdrawalRef, {
      status: "processing",
      providerStatus: providerStatusValue,
      providerPayload: payload,
      updatedAt: Timestamp.now(),
    })
  })
}

export async function applyKopoKopoWithdrawalUpdate(options: {
  withdrawalId: string
  payload: Record<string, unknown>
}) {
  const { withdrawalId, payload } = options
  const withdrawalRef = adminDb.collection("withdrawals").doc(withdrawalId)
  const result = extractKopoKopoWithdrawalResult(payload)
  const normalizedStatus = inferGenericTransactionStatus(
    result.status,
    result.transferStatus,
    result.disbursementStatus
  )
  const providerStatusValue =
    result.status || result.transferStatus || result.disbursementStatus || "processing"
  const providerTransferStatusValue =
    result.disbursementStatus || result.transferStatus || null

  await adminDb.runTransaction(async (transaction) => {
    const withdrawalSnapshot = await transaction.get(withdrawalRef)

    if (!withdrawalSnapshot.exists) {
      throw new Error("Withdrawal not found")
    }

    const withdrawalData = withdrawalSnapshot.data() ?? {}
    const currentStatus = String(withdrawalData.status || "")

    if (currentStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerTransferStatus: providerTransferStatusValue,
        paymentReference: result.paymentId || withdrawalData.paymentReference || null,
        transactionReference:
          result.transactionReference || withdrawalData.transactionReference || null,
        providerLocation: result.providerLocation || withdrawalData.providerLocation || null,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      })
      return
    }

    if (withdrawalData.balanceRefunded && normalizedStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerTransferStatus: providerTransferStatusValue,
        paymentReference: result.paymentId || withdrawalData.paymentReference || null,
        transactionReference:
          result.transactionReference || withdrawalData.transactionReference || null,
        providerLocation: result.providerLocation || withdrawalData.providerLocation || null,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "completed") {
      transaction.update(withdrawalRef, {
        status: "completed",
        providerStatus: providerStatusValue,
        providerTransferStatus: providerTransferStatusValue,
        paymentReference: result.paymentId || withdrawalData.paymentReference || null,
        transactionReference: result.transactionReference,
        providerLocation: result.providerLocation || withdrawalData.providerLocation || null,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      })
      return
    }

    if (normalizedStatus === "failed") {
      const userRef = adminDb.collection("users").doc(String(withdrawalData.uid || ""))

      if (withdrawalData.balanceDeducted && !withdrawalData.balanceRefunded) {
        transaction.update(userRef, {
          userKesBalance: FieldValue.increment(Number(withdrawalData.amount || 0)),
          updatedAt: Timestamp.now(),
        })
      }

      transaction.update(withdrawalRef, {
        status: "failed",
        providerStatus: providerStatusValue,
        providerTransferStatus: providerTransferStatusValue,
        paymentReference: result.paymentId || withdrawalData.paymentReference || null,
        transactionReference: result.transactionReference,
        providerLocation: result.providerLocation || withdrawalData.providerLocation || null,
        providerPayload: payload,
        balanceRefunded: true,
        failureReason:
          result.status ||
          result.disbursementStatus ||
          result.transferStatus ||
          withdrawalData.failureReason ||
          "Withdrawal failed.",
        updatedAt: Timestamp.now(),
      })
      return
    }

    transaction.update(withdrawalRef, {
      status: "processing",
      providerStatus: providerStatusValue,
      providerTransferStatus: providerTransferStatusValue,
      paymentReference: result.paymentId || withdrawalData.paymentReference || null,
      transactionReference: result.transactionReference,
      providerLocation: result.providerLocation || withdrawalData.providerLocation || null,
      providerPayload: payload,
      updatedAt: Timestamp.now(),
    })
  })
}

async function findLatestKopoKopoDepositEvent(depositId: string) {
  let eventSnapshot = await adminDb
    .collection("kopokopo_events")
    .where("payload.data.attributes.metadata.reference", "==", depositId)
    .get()

  if (eventSnapshot.empty) {
    eventSnapshot = await adminDb
    .collection("kopokopo_events")
    .where("payload.data.attributes.metadata.depositId", "==", depositId)
    .get()
  }

  if (eventSnapshot.empty) {
    return {
      payload: null as Record<string, unknown> | null,
      paymentRequestId: "",
      paymentReference: "",
      providerLocation: "",
    }
  }

  const latestEvent = eventSnapshot.docs
    .map((docSnap) => docSnap.data())
    .sort((left, right) => getTimestampMillis(right.receivedAt) - getTimestampMillis(left.receivedAt))[0]
  const payload = asRecord(latestEvent?.payload)
  const data = asRecord(payload.data)
  const result = extractKopoKopoDepositResult(payload)
  const paymentRequestId = typeof data.id === "string" ? data.id : ""
  const providerLocation =
    result.providerLocation
      ? result.providerLocation
      : paymentRequestId
        ? `${getKopoKopoBaseUrl()}/api/v1/incoming_payments/${paymentRequestId}`
        : ""

  return {
    payload,
    paymentRequestId,
    paymentReference: result.paymentReference || "",
    providerLocation,
  }
}

async function findKopoKopoWithdrawalLocationFromEvent(withdrawalId: string) {
  const eventSnapshot = await adminDb
    .collection("kopokopo_events")
    .where("payload.data.attributes.metadata.withdrawalId", "==", withdrawalId)
    .limit(5)
    .get()

  if (eventSnapshot.empty) {
    return { paymentId: "", providerLocation: "" }
  }

  const latestEvent = eventSnapshot.docs
    .map((docSnap) => docSnap.data())
    .sort((left, right) => getTimestampMillis(right.receivedAt) - getTimestampMillis(left.receivedAt))[0]
  const payload = asRecord(latestEvent?.payload)
  const data = asRecord(payload.data)
  const attributes = asRecord(data.attributes)
  const links = asRecord(attributes._links)
  const paymentId = typeof data.id === "string" ? data.id : ""
  const providerLocation =
    typeof links.self === "string" && links.self
      ? links.self
      : paymentId
        ? `${getKopoKopoBaseUrl()}/api/v1/payments/${paymentId}`
        : ""

  return { paymentId, providerLocation }
}

export async function syncMpesaDepositStatusForUser(uid: string, depositId: string) {
  const depositRef = adminDb.collection("deposits").doc(depositId)
  const depositSnapshot = await depositRef.get()

  if (!depositSnapshot.exists) {
    throw createStatusError("Deposit not found", 404)
  }

  const depositData = depositSnapshot.data() ?? {}

  if (depositData.uid !== uid) {
    throw createStatusError("You are not allowed to access this deposit.", 403)
  }

  if (String(depositData.method || "").toLowerCase() !== "m-pesa") {
    return { id: depositSnapshot.id, ...depositData }
  }

  if (!isPendingStatus(depositData.status)) {
    return { id: depositSnapshot.id, ...depositData }
  }

  const latestEvent = await findLatestKopoKopoDepositEvent(depositId)

  if (latestEvent.payload) {
    await applyKopoKopoDepositUpdate({
      depositId,
      payload: latestEvent.payload,
    })
  }

  let refreshedSnapshot = await depositRef.get()
  let refreshedData = refreshedSnapshot.data() ?? {}

  if (!isPendingStatus(refreshedData.status)) {
    return {
      id: refreshedSnapshot.id,
      ...refreshedData,
    }
  }

  const accessToken = await getKopoKopoAccessToken()

  if (refreshedData.pollingRequestLocation || refreshedData.pollingRequestId) {
    await reconcileMpesaDepositPollingStatus({
      depositId,
      depositData: refreshedData,
      accessToken,
    })

    refreshedSnapshot = await depositRef.get()
    refreshedData = refreshedSnapshot.data() ?? {}

    if (!isPendingStatus(refreshedData.status)) {
      return {
        id: refreshedSnapshot.id,
        ...refreshedData,
      }
    }
  }

  const providerLocation =
    typeof refreshedData.providerLocation === "string" && refreshedData.providerLocation.trim()
      ? refreshedData.providerLocation.trim()
      : typeof refreshedData.paymentRequestId === "string" && refreshedData.paymentRequestId.trim()
        ? `${getKopoKopoBaseUrl()}/api/v1/incoming_payments/${refreshedData.paymentRequestId.trim()}`
        : ""

  if (providerLocation) {
    const { payload } = await getKopoKopoIncomingPaymentStatus({
      accessToken,
      location: providerLocation,
      paymentRequestId:
        typeof refreshedData.paymentRequestId === "string" ? refreshedData.paymentRequestId : "",
    })
    const incomingPaymentResult = extractKopoKopoDepositResult(payload)
    const incomingPaymentStatus = inferDocumentedIncomingPaymentStatus({
      status: incomingPaymentResult.status,
      resourceStatus: incomingPaymentResult.resourceStatus,
      paymentReference: incomingPaymentResult.paymentReference,
    })

    if (incomingPaymentStatus === "completed") {
      await applyKopoKopoDepositUpdate({
        depositId,
        payload,
      })
    } else if (
      incomingPaymentStatus === "failed" &&
      shouldUseMpesaPollingFallback(incomingPaymentResult.errorMessage)
    ) {
      await ensureMpesaDepositPollingRequest({
        depositId,
        depositData: refreshedData,
        accessToken,
      })

      await depositRef.set(
        {
          providerStatus: "reconciling",
          providerResourceStatus: null,
          pendingFailureReason:
            incomingPaymentResult.errorMessage ||
            incomingPaymentResult.status ||
            "We could not confirm this M-Pesa payment.",
          reconciliationStartedAt:
            refreshedData.reconciliationStartedAt || Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    } else if (incomingPaymentStatus === "failed") {
      await applyKopoKopoDepositUpdate({
        depositId,
        payload,
      })
    }
  }

  if (await expireTimedOutMpesaDeposit(depositId)) {
    const expiredSnapshot = await depositRef.get()
    return {
      id: expiredSnapshot.id,
      ...(expiredSnapshot.data() ?? {}),
    }
  }

  refreshedSnapshot = await depositRef.get()
  return {
    id: refreshedSnapshot.id,
    ...(refreshedSnapshot.data() ?? {}),
  }
}

export async function syncMpesaWithdrawalStatusForUser(uid: string, withdrawalId: string) {
  const withdrawalRef = adminDb.collection("withdrawals").doc(withdrawalId)
  const withdrawalSnapshot = await withdrawalRef.get()

  if (!withdrawalSnapshot.exists) {
    throw createStatusError("Withdrawal not found", 404)
  }

  const withdrawalData = withdrawalSnapshot.data() ?? {}

  if (withdrawalData.uid !== uid) {
    throw createStatusError("You are not allowed to access this withdrawal.", 403)
  }

  if (String(withdrawalData.method || "").toLowerCase() !== "m-pesa") {
    return { id: withdrawalSnapshot.id, ...withdrawalData }
  }

  if (!isPendingStatus(withdrawalData.status)) {
    return { id: withdrawalSnapshot.id, ...withdrawalData }
  }

  let providerLocation = getKopoKopoPaymentLocation(withdrawalData)
  let paymentId = typeof withdrawalData.paymentReference === "string" ? withdrawalData.paymentReference : ""

  if (!providerLocation) {
    const recoveredReference = await findKopoKopoWithdrawalLocationFromEvent(withdrawalId)
    providerLocation = recoveredReference.providerLocation
    paymentId = recoveredReference.paymentId

    if (providerLocation || paymentId) {
      await withdrawalRef.set(
        {
          providerLocation: providerLocation || null,
          paymentReference: paymentId || null,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      )
    }
  }

  if (!providerLocation) {
    return { id: withdrawalSnapshot.id, ...withdrawalData }
  }

  const accessToken = await getKopoKopoAccessToken()
  const response = await PayService.getStatus({ accessToken, location: providerLocation })
  await applyKopoKopoWithdrawalUpdate({
    withdrawalId,
    payload: response.data,
  })

  const refreshedSnapshot = await withdrawalRef.get()
  return {
    id: refreshedSnapshot.id,
    ...(refreshedSnapshot.data() ?? {}),
  }
}

export async function syncPendingPaymentsForUser(uid: string) {
  const [depositsSnapshot, withdrawalsSnapshot] = await Promise.all([
    adminDb.collection("deposits").where("uid", "==", uid).get(),
    adminDb.collection("withdrawals").where("uid", "==", uid).get(),
  ])

  const pendingDeposits = depositsSnapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data()
      return String(data.method || "").toLowerCase() === "m-pesa" && isPendingStatus(data.status)
    })
    .sort((left, right) => getTimestampMillis(right.data().createdAt) - getTimestampMillis(left.data().createdAt))

  const pendingWithdrawals = withdrawalsSnapshot.docs
    .filter((docSnap) => {
      const data = docSnap.data()
      return String(data.method || "").toLowerCase() === "m-pesa" && isPendingStatus(data.status)
    })
    .sort((left, right) => getTimestampMillis(right.data().createdAt) - getTimestampMillis(left.data().createdAt))
    .slice(0, 5)

  for (const deposit of pendingDeposits) {
    try {
      await syncMpesaDepositStatusForUser(uid, deposit.id)
    } catch {
      // Ignore individual reconciliation failures so the request still succeeds.
    }
  }

  for (const withdrawal of pendingWithdrawals) {
    try {
      await syncMpesaWithdrawalStatusForUser(uid, withdrawal.id)
    } catch {
      // Ignore individual reconciliation failures so the request still succeeds.
    }
  }
}

export function formatTransactionStatus(
  status: unknown,
  providerStatus?: unknown,
  providerDetailStatus?: unknown
) {
  const normalizedStatus = normalizeProviderStatusValue(status)
  const normalizedProviderStatus = normalizeProviderStatusValue(providerStatus)
  const normalizedProviderDetailStatus = normalizeProviderStatusValue(providerDetailStatus)

  if (GENERIC_COMPLETED_STATUSES.has(normalizedStatus)) {
    return "Completed"
  }

  if (GENERIC_FAILED_STATUSES.has(normalizedStatus)) {
    return "Failed"
  }

  if (
    GENERIC_COMPLETED_STATUSES.has(normalizedProviderStatus) ||
    GENERIC_COMPLETED_STATUSES.has(normalizedProviderDetailStatus)
  ) {
    return "Completed"
  }

  if (
    GENERIC_FAILED_STATUSES.has(normalizedProviderStatus) ||
    GENERIC_FAILED_STATUSES.has(normalizedProviderDetailStatus)
  ) {
    return "Failed"
  }

  if (
    GENERIC_PENDING_STATUSES.has(normalizedStatus) ||
    GENERIC_PENDING_STATUSES.has(normalizedProviderStatus) ||
    GENERIC_PENDING_STATUSES.has(normalizedProviderDetailStatus)
  ) {
    return "Pending"
  }

  return "Pending"
}
