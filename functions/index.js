/* eslint-disable */

const crypto = require("crypto");
const axios = require("axios");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const functionsV1 = require("firebase-functions/v1");
const { onSchedule } = require("firebase-functions/v2/scheduler");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { FieldValue, Timestamp } = admin.firestore;
const REGION = "us-central1";
const MPESA_DEPOSIT_PENDING_TIMEOUT_MS = 60 * 1000;
const MPESA_DEPOSIT_RECONCILIATION_TIMEOUT_MS = 2 * 60 * 1000;
const MPESA_DEPOSIT_POLLING_LOOKBACK_MS = 5 * 60 * 1000;
const MPESA_DEPOSIT_POLLING_LOOKAHEAD_MS = 2 * 60 * 1000;
const MPESA_DEPOSIT_TRANSACTION_MATCH_WINDOW_MS = 15 * 60 * 1000;
const MPESA_DEPOSIT_TIMEOUT_REASON = "This M-Pesa payment request expired. Please try again.";
const MPESA_DEPOSIT_POLLING_FALLBACK_ERROR = "initiator information is invalid";
const PENDING_STATUSES = [
  "pending",
  "processing",
  "initiated",
  "sent",
  "confirm_check",
  "queued",
  "submitted",
];
const GENERIC_COMPLETED_STATUSES = new Set([
  "completed",
  "complete",
  "paid",
  "paid_over",
  "success",
  "processed",
  "transferred",
  "received",
]);
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
]);
const GENERIC_PENDING_STATUSES = new Set([
  "pending",
  "processing",
  "initiated",
  "sent",
  "confirm_check",
  "queued",
  "submitted",
]);
const CRYPTOMUS_DEPOSIT_SUCCESS_STATUSES = new Set(["paid", "paid_over"]);
const CRYPTOMUS_DEPOSIT_FAILURE_STATUSES = new Set([
  "fail",
  "wrong_amount",
  "cancel",
  "system_fail",
  "refund_process",
  "refund_fail",
  "refund_paid",
]);
const CRYPTOMUS_PAYOUT_FAILURE_STATUSES = new Set(["fail", "cancel", "system_fail"]);
let kopoKopoServices = null;

function asRecord(value) {
  return value && typeof value === "object" ? value : {};
}

function getTimestampMillis(value) {
  if (value && typeof value.toMillis === "function") {
    return value.toMillis();
  }

  return 0;
}

function hasNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPendingPaymentStatus(status) {
  return PENDING_STATUSES.includes(String(status || "").toLowerCase());
}

function hasTimedOutMpesaDepositRequest(data) {
  const createdAtMillis = getTimestampMillis(data.createdAt);

  if (!createdAtMillis) {
    return false;
  }

  return Date.now() - createdAtMillis >= MPESA_DEPOSIT_PENDING_TIMEOUT_MS;
}

function normalizeProviderStatusValue(status) {
  return typeof status === "string" ? status.trim().toLowerCase() : "";
}

function normalizeProviderStatusList(...statuses) {
  return statuses.map((status) => normalizeProviderStatusValue(status)).filter(Boolean);
}

function inferGenericTransactionStatus(primaryStatus, ...secondaryStatuses) {
  const primaryCandidates = normalizeProviderStatusList(primaryStatus);
  const secondaryCandidates = normalizeProviderStatusList(...secondaryStatuses);

  if (primaryCandidates.some((candidate) => GENERIC_COMPLETED_STATUSES.has(candidate))) {
    return "completed";
  }

  if (primaryCandidates.some((candidate) => GENERIC_FAILED_STATUSES.has(candidate))) {
    return "failed";
  }

  if (secondaryCandidates.some((candidate) => GENERIC_COMPLETED_STATUSES.has(candidate))) {
    return "completed";
  }

  if (secondaryCandidates.some((candidate) => GENERIC_FAILED_STATUSES.has(candidate))) {
    return "failed";
  }

  if (
    primaryCandidates.some((candidate) => GENERIC_PENDING_STATUSES.has(candidate)) ||
    secondaryCandidates.some((candidate) => GENERIC_PENDING_STATUSES.has(candidate))
  ) {
    return "pending";
  }

  return "pending";
}

function inferDocumentedIncomingPaymentStatus({ status, resourceStatus, paymentReference }) {
  const requestStatus = normalizeProviderStatusValue(status);
  const normalizedResourceStatus = normalizeProviderStatusValue(resourceStatus);
  const hasPaymentReference =
    typeof paymentReference === "string" && paymentReference.trim().length > 0;

  if (requestStatus === "pending") {
    return "pending";
  }

  if (requestStatus === "failed") {
    return "failed";
  }

  if (requestStatus === "success") {
    return normalizedResourceStatus === "received" && hasPaymentReference ? "completed" : "pending";
  }

  return inferGenericTransactionStatus(requestStatus, normalizedResourceStatus);
}

function normalizePhoneComparisonValue(value) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function parseIsoDateMillis(value) {
  if (typeof value !== "string" || !value.trim()) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getConfiguredAppBaseUrlFromEnv() {
  const configuredBaseUrl =
    (process.env.NEXT_SERVER_BASE_URL || "").trim() ||
    (process.env.NEXT_PUBLIC_BASE_URL || "").trim();

  if (!configuredBaseUrl) {
    throw new Error("Application base URL configuration missing.");
  }

  return configuredBaseUrl.replace(/\/$/, "");
}

function isMpesaPaymentRecord(data) {
  const method = String(data.method || "").toLowerCase();
  const provider = String(data.provider || "").toLowerCase();

  if (method !== "m-pesa") {
    return false;
  }

  return !provider || provider === "kopokopo";
}

function serializeCryptomusPayload(payload) {
  return JSON.stringify(payload).replace(/\//g, "\\/");
}

function getRequiredEnvValue(name) {
  const value = process.env[name];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function getKopoKopoServices() {
  if (kopoKopoServices) {
    return kopoKopoServices;
  }

  const K2 = require("k2-connect-node")({
    clientId: getRequiredEnvValue("NEXT_SERVER_KOPOKOPO_CLIENT_ID"),
    clientSecret: getRequiredEnvValue("NEXT_SERVER_KOPOKOPO_CLIENT_SECRET"),
    apiKey: getRequiredEnvValue("NEXT_SERVER_KOPOKOPO_API_KEY"),
    baseUrl: getRequiredEnvValue("NEXT_SERVER_KOPOKOPO_BASE_URL"),
  });

  kopoKopoServices = {
    StkService: K2.StkService,
    PayService: K2.PayService,
    TokenService: K2.TokenService,
  };

  return kopoKopoServices;
}

function createCryptomusSignature(payload, apiKey) {
  return crypto
    .createHash("md5")
    .update(Buffer.from(serializeCryptomusPayload(payload)).toString("base64") + apiKey)
    .digest("hex");
}

function getKopoKopoBaseUrl() {
  return (process.env.NEXT_SERVER_KOPOKOPO_BASE_URL || "https://api.kopokopo.com").replace(/\/$/, "");
}

async function getKopoKopoAccessToken(cache) {
  if (cache.accessToken) {
    return cache.accessToken;
  }

  const { TokenService } = getKopoKopoServices();
  const tokenResponse = await TokenService.getToken();
  cache.accessToken = tokenResponse.access_token;
  return cache.accessToken;
}

function getKopoKopoRequestHeaders(accessToken, includeContentType = false) {
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "pro-escrow/1.0",
  };

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

function getKopoKopoErrorMessage(payload, fallbackMessage) {
  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  const data = asRecord(payload);
  if (typeof data.error_message === "string" && data.error_message.trim()) {
    return data.error_message;
  }

  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return fallbackMessage;
}

async function getKopoKopoIncomingPaymentStatus({ accessToken, location, paymentRequestId }) {
  const resolvedLocation = hasNonEmptyString(location)
    ? location.trim()
    : hasNonEmptyString(paymentRequestId)
      ? `${getKopoKopoBaseUrl()}/api/v1/incoming_payments/${paymentRequestId.trim()}`
      : "";

  if (!resolvedLocation) {
    throw new Error("Missing KopoKopo incoming payment reference");
  }

  const response = await axios.get(resolvedLocation, {
    headers: getKopoKopoRequestHeaders(accessToken),
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      getKopoKopoErrorMessage(
        response.data,
        `Failed to fetch KopoKopo incoming payment status (${response.status || "unknown"})`
      )
    );
  }

  return {
    location: resolvedLocation,
    payload: asRecord(response.data),
  };
}

function getKopoKopoPollingCallbackUrl() {
  const explicitUrl = (process.env.NEXT_SERVER_KOPOKOPO_POLLING_CALLBACK_URL || "").trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  return `${getConfiguredAppBaseUrlFromEnv()}/api/deposit/polling-webhook`;
}

async function initiateKopoKopoPollingRequest({
  accessToken,
  scope,
  scopeReference,
  fromTime,
  toTime,
  callbackUrl,
}) {
  const response = await axios.post(
    `${getKopoKopoBaseUrl()}/api/v1/polling`,
    {
      scope,
      scope_reference: scopeReference || "",
      from_time: fromTime,
      to_time: toTime,
      _links: {
        callback_url: callbackUrl || getKopoKopoPollingCallbackUrl(),
      },
    },
    {
      headers: getKopoKopoRequestHeaders(accessToken, true),
      validateStatus: () => true,
    }
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      getKopoKopoErrorMessage(
        response.data,
        `Failed to create KopoKopo polling request (${response.status || "unknown"})`
      )
    );
  }

  const responseLocation = typeof response.headers.location === "string" ? response.headers.location : "";
  const pollingRequestId = responseLocation.split("/").pop() || "";

  if (!pollingRequestId) {
    throw new Error("Unable to extract pollingRequestId from response");
  }

  return {
    pollingRequestId,
    responseLocation,
    payload: asRecord(response.data),
  };
}

async function getKopoKopoPollingStatus({ accessToken, location, pollingRequestId }) {
  const resolvedLocation = hasNonEmptyString(location)
    ? location.trim()
    : hasNonEmptyString(pollingRequestId)
      ? `${getKopoKopoBaseUrl()}/api/v1/polling/${pollingRequestId.trim()}`
      : "";

  if (!resolvedLocation) {
    throw new Error("Missing KopoKopo polling reference");
  }

  const response = await axios.get(resolvedLocation, {
    headers: getKopoKopoRequestHeaders(accessToken),
    validateStatus: () => true,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      getKopoKopoErrorMessage(
        response.data,
        `Failed to fetch KopoKopo polling status (${response.status || "unknown"})`
      )
    );
  }

  return {
    location: resolvedLocation,
    payload: asRecord(response.data),
  };
}

function getIncomingPaymentLocation(data) {
  if (typeof data.providerLocation === "string" && data.providerLocation) {
    return data.providerLocation;
  }

  if (typeof data.paymentRequestId === "string" && data.paymentRequestId) {
    return `${getKopoKopoBaseUrl()}/api/v1/incoming_payments/${data.paymentRequestId}`;
  }

  return "";
}

function getPaymentLocation(data) {
  if (typeof data.providerLocation === "string" && data.providerLocation) {
    return data.providerLocation;
  }

  if (typeof data.paymentReference === "string" && data.paymentReference) {
    return `${getKopoKopoBaseUrl()}/api/v1/payments/${data.paymentReference}`;
  }

  return "";
}

function hasMpesaDepositReference(data) {
  return hasNonEmptyString(getIncomingPaymentLocation(data));
}

function hasMpesaWithdrawalReference(data) {
  return hasNonEmptyString(getPaymentLocation(data));
}

function shouldTrackMpesaDeposit(beforeData, afterData) {
  if (!isMpesaPaymentRecord(afterData) || !isPendingPaymentStatus(afterData.status)) {
    return false;
  }

  if (!hasMpesaDepositReference(afterData)) {
    return false;
  }

  const beforePending = isPendingPaymentStatus(beforeData.status);
  const beforeLocation = getIncomingPaymentLocation(beforeData);
  const afterLocation = getIncomingPaymentLocation(afterData);

  return !beforePending || beforeLocation !== afterLocation;
}

function shouldTrackMpesaWithdrawal(beforeData, afterData) {
  if (!isMpesaPaymentRecord(afterData) || !isPendingPaymentStatus(afterData.status)) {
    return false;
  }

  if (!hasMpesaWithdrawalReference(afterData)) {
    return false;
  }

  const beforePending = isPendingPaymentStatus(beforeData.status);
  const beforeLocation = getPaymentLocation(beforeData);
  const afterLocation = getPaymentLocation(afterData);

  return !beforePending || beforeLocation !== afterLocation;
}

function extractKopoKopoDepositResult(payload) {
  const data = asRecord(payload.data);
  const attributes = asRecord(data.attributes);
  const event = asRecord(attributes.event);
  const resource = asRecord(event.resource);
  const links = asRecord(attributes._links);

  return {
    requestId: typeof data.id === "string" ? data.id : "",
    status: typeof attributes.status === "string" ? attributes.status.toLowerCase() : "",
    resourceStatus: typeof resource.status === "string" ? resource.status.toLowerCase() : "",
    amount:
      typeof resource.amount === "string" || typeof resource.amount === "number"
        ? Number(resource.amount)
        : 0,
    currency: typeof resource.currency === "string" ? resource.currency.toUpperCase() : "",
    paymentReference: typeof resource.reference === "string" ? resource.reference : null,
    providerLocation: typeof links.self === "string" ? links.self : "",
    errorMessage: typeof event.errors === "string" ? event.errors : null,
  };
}

function extractKopoKopoWithdrawalResult(payload) {
  const data = asRecord(payload.data);
  const attributes = asRecord(data.attributes);
  const transferBatches = Array.isArray(attributes.transfer_batches) ? attributes.transfer_batches : [];
  const firstTransferBatch = transferBatches.find((batch) => batch && typeof batch === "object");
  const firstDisbursement = transferBatches
    .flatMap((batch) => {
      const batchRecord = asRecord(batch);
      return Array.isArray(batchRecord.disbursements) ? batchRecord.disbursements : [];
    })
    .find((item) => item && typeof item === "object");
  const links = asRecord(attributes._links);

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
    providerLocation: typeof links.self === "string" ? links.self : "",
    transactionReference:
      firstDisbursement && typeof firstDisbursement.transaction_reference === "string"
        ? firstDisbursement.transaction_reference
        : null,
  };
}

function extractKopoKopoPollingResult(payload) {
  const data = asRecord(payload.data);
  const attributes = asRecord(data.attributes);
  const links = asRecord(attributes._links);
  const transactions = Array.isArray(attributes.transactions) ? attributes.transactions : [];

  return {
    requestId: typeof data.id === "string" ? data.id : "",
    status: typeof attributes.status === "string" ? attributes.status.toLowerCase() : "",
    transactions: transactions.filter((transaction) => transaction && typeof transaction === "object"),
    providerLocation: typeof links.self === "string" ? links.self : "",
  };
}

function findMatchingKopoKopoPollingTransaction(depositData, payload) {
  const pollingResult = extractKopoKopoPollingResult(payload);
  const depositPhone = normalizePhoneComparisonValue(depositData.phoneNumber);
  const depositAmount = Number(depositData.amount || 0);
  const depositCurrency = String(depositData.currency || "KES").toUpperCase();
  const depositCreatedAtMillis = getTimestampMillis(depositData.createdAt);

  const candidates = pollingResult.transactions
    .map((transaction) => {
      const resource = asRecord(transaction.resource);
      const transactionStatus = normalizeProviderStatusValue(resource.status);
      const transactionPhone = normalizePhoneComparisonValue(resource.sender_phone_number);
      const transactionAmount =
        typeof resource.amount === "number" || typeof resource.amount === "string"
          ? Number(resource.amount)
          : 0;
      const transactionCurrency =
        typeof resource.currency === "string" ? resource.currency.toUpperCase() : "";
      const transactionTimeMillis = parseIsoDateMillis(resource.origination_time);

      return {
        resource,
        transactionStatus,
        transactionPhone,
        transactionAmount,
        transactionCurrency,
        transactionTimeMillis,
      };
    })
    .filter((candidate) => {
      if (candidate.transactionStatus !== "received") {
        return false;
      }

      if (!depositPhone || candidate.transactionPhone !== depositPhone) {
        return false;
      }

      if (Math.abs(candidate.transactionAmount - depositAmount) > 0.01) {
        return false;
      }

      if (candidate.transactionCurrency && candidate.transactionCurrency !== depositCurrency) {
        return false;
      }

      if (!depositCreatedAtMillis || !candidate.transactionTimeMillis) {
        return true;
      }

      return (
        Math.abs(candidate.transactionTimeMillis - depositCreatedAtMillis) <=
        MPESA_DEPOSIT_TRANSACTION_MATCH_WINDOW_MS
      );
    })
    .sort((left, right) => {
      const leftDistance = depositCreatedAtMillis
        ? Math.abs(left.transactionTimeMillis - depositCreatedAtMillis)
        : 0;
      const rightDistance = depositCreatedAtMillis
        ? Math.abs(right.transactionTimeMillis - depositCreatedAtMillis)
        : 0;

      return leftDistance - rightDistance;
    });

  return candidates[0] ? candidates[0].resource : null;
}

async function findLatestKopoKopoDepositEvent(depositId) {
  let snapshot = await db
    .collection("kopokopo_events")
    .where("payload.data.attributes.metadata.reference", "==", depositId)
    .get();

  if (snapshot.empty) {
    snapshot = await db
    .collection("kopokopo_events")
    .where("payload.data.attributes.metadata.depositId", "==", depositId)
    .get();
  }

  if (snapshot.empty) {
    return {
      payload: null,
      paymentRequestId: "",
      paymentReference: "",
      providerLocation: "",
    };
  }

  const latest = snapshot.docs
    .map((docSnap) => docSnap.data())
    .sort((left, right) => getTimestampMillis(right.receivedAt) - getTimestampMillis(left.receivedAt))[0];
  const payload = asRecord(latest.payload);
  const data = asRecord(payload.data);
  const result = extractKopoKopoDepositResult(payload);
  const paymentRequestId = typeof data.id === "string" ? data.id : "";

  return {
    payload,
    paymentRequestId,
    paymentReference: result.paymentReference || "",
    providerLocation:
      result.providerLocation
        ? result.providerLocation
        : paymentRequestId
          ? `${getKopoKopoBaseUrl()}/api/v1/incoming_payments/${paymentRequestId}`
          : "",
  };
}

async function findKopoKopoWithdrawalReference(withdrawalId) {
  const snapshot = await db
    .collection("kopokopo_events")
    .where("payload.data.attributes.metadata.withdrawalId", "==", withdrawalId)
    .limit(5)
    .get();

  if (snapshot.empty) {
    return { paymentId: "", providerLocation: "" };
  }

  const latest = snapshot.docs
    .map((docSnap) => docSnap.data())
    .sort((left, right) => getTimestampMillis(right.receivedAt) - getTimestampMillis(left.receivedAt))[0];
  const payload = asRecord(latest.payload);
  const data = asRecord(payload.data);
  const attributes = asRecord(data.attributes);
  const links = asRecord(attributes._links);
  const paymentId = typeof data.id === "string" ? data.id : "";

  return {
    paymentId,
    providerLocation:
      typeof links.self === "string" && links.self
        ? links.self
        : paymentId
          ? `${getKopoKopoBaseUrl()}/api/v1/payments/${paymentId}`
          : "",
  };
}

function setInitialUserBalances(currency, amount) {
  return {
    userKesBalance: currency === "KES" ? amount : 0,
    userUsdBalance: currency === "USD" ? amount : 0,
    frozenUserKesBalance: 0,
    frozenUserUsdBalance: 0,
    updatedAt: Timestamp.now(),
  };
}

async function applyKopoKopoDepositUpdate(depositId, payload) {
  const depositRef = db.collection("deposits").doc(depositId);
  const result = extractKopoKopoDepositResult(payload);
  const normalizedStatus = inferDocumentedIncomingPaymentStatus({
    status: result.status,
    resourceStatus: result.resourceStatus,
    paymentReference: result.paymentReference,
  });
  const providerStatusValue = result.status || result.resourceStatus || "pending";
  const providerResourceStatusValue = result.resourceStatus || null;

  await db.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef);
    if (!depositSnapshot.exists) {
      return;
    }

    const depositData = depositSnapshot.data() || {};
    const creditedAmount = Number(depositData.amount || 0);
    const currentStatus = String(depositData.status || "");

    if (currentStatus === "completed" && depositData.balanceCredited) {
      transaction.update(depositRef, {
        providerStatus: providerStatusValue,
        providerResourceStatus: providerResourceStatusValue,
        paymentRequestId: result.requestId || depositData.paymentRequestId || null,
        paymentReference: result.paymentReference || depositData.paymentReference || null,
        providerLocation: result.providerLocation || depositData.providerLocation || null,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      });
      return;
    }

    if (normalizedStatus === "completed") {
      if (result.currency && result.currency !== "KES") {
        throw new Error(`Unexpected currency for deposit ${depositId}`);
      }

      if (result.amount > 0 && Math.abs(result.amount - creditedAmount) > 0.01) {
        throw new Error(`Amount mismatch for deposit ${depositId}`);
      }

      if (!depositData.balanceCredited) {
        const userRef = db.collection("users").doc(String(depositData.uid || ""));
        const userSnapshot = await transaction.get(userRef);

        if (!userSnapshot.exists) {
          transaction.set(userRef, setInitialUserBalances("KES", creditedAmount), { merge: true });
        } else {
          transaction.update(userRef, {
            userKesBalance: FieldValue.increment(creditedAmount),
            updatedAt: Timestamp.now(),
          });
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
      });
      return;
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
      });
      return;
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
    });
  });
}

function shouldUseMpesaPollingFallback(errorMessage) {
  return normalizeProviderStatusValue(errorMessage).includes(MPESA_DEPOSIT_POLLING_FALLBACK_ERROR);
}

function hasTimedOutMpesaDepositReconciliation(data) {
  const startedAtMillis =
    getTimestampMillis(data.reconciliationStartedAt) || getTimestampMillis(data.createdAt);

  if (!startedAtMillis) {
    return false;
  }

  return Date.now() - startedAtMillis >= MPESA_DEPOSIT_RECONCILIATION_TIMEOUT_MS;
}

async function markMpesaDepositFailedAfterReconciliation({ depositId, failureReason }) {
  await db.collection("deposits").doc(depositId).set(
    {
      status: "failed",
      providerStatus: "failed",
      providerResourceStatus: null,
      failureReason,
      pendingFailureReason: null,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );
}

async function applyKopoKopoPollingTransactionToDeposit({ depositId, payload, transactionResource }) {
  const depositRef = db.collection("deposits").doc(depositId);
  const transactionAmount =
    typeof transactionResource.amount === "number" || typeof transactionResource.amount === "string"
      ? Number(transactionResource.amount)
      : 0;
  const transactionCurrency =
    typeof transactionResource.currency === "string"
      ? transactionResource.currency.toUpperCase()
      : "KES";
  const paymentReference =
    typeof transactionResource.reference === "string" ? transactionResource.reference : null;
  const resourceStatus =
    typeof transactionResource.status === "string" ? transactionResource.status.toLowerCase() : "received";

  await db.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef);
    if (!depositSnapshot.exists) {
      return;
    }

    const depositData = depositSnapshot.data() || {};
    const creditedAmount = Number(depositData.amount || 0);
    const currentStatus = String(depositData.status || "");

    if (currentStatus === "completed" && depositData.balanceCredited) {
      transaction.update(depositRef, {
        providerStatus: "success",
        providerResourceStatus: resourceStatus,
        paymentReference: paymentReference || depositData.paymentReference || null,
        providerPayload: payload,
        pendingFailureReason: null,
        updatedAt: Timestamp.now(),
      });
      return;
    }

    if (transactionCurrency && transactionCurrency !== "KES") {
      throw new Error(`Unexpected currency for deposit ${depositId}`);
    }

    if (transactionAmount > 0 && Math.abs(transactionAmount - creditedAmount) > 0.01) {
      throw new Error(`Amount mismatch for deposit ${depositId}`);
    }

    if (!depositData.balanceCredited) {
      const userRef = db.collection("users").doc(String(depositData.uid || ""));
      const userSnapshot = await transaction.get(userRef);

      if (!userSnapshot.exists) {
        transaction.set(userRef, setInitialUserBalances("KES", creditedAmount), { merge: true });
      } else {
        transaction.update(userRef, {
          userKesBalance: FieldValue.increment(creditedAmount),
          updatedAt: Timestamp.now(),
        });
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
    });
  });
}

async function ensureMpesaDepositPollingRequest({ depositId, depositData, accessToken }) {
  const existingLocation =
    typeof depositData.pollingRequestLocation === "string" ? depositData.pollingRequestLocation.trim() : "";

  if (existingLocation) {
    return {
      pollingRequestId: typeof depositData.pollingRequestId === "string" ? depositData.pollingRequestId : "",
      responseLocation: existingLocation,
    };
  }

  const tillNumber = (process.env.NEXT_SERVER_KOPOKOPO_TILL_NUMBER || "").trim();
  if (!tillNumber) {
    throw new Error("KopoKopo till number is not configured.");
  }

  const createdAtMillis = getTimestampMillis(depositData.createdAt) || Date.now();
  const fromTime = new Date(createdAtMillis - MPESA_DEPOSIT_POLLING_LOOKBACK_MS).toISOString();
  const toTime = new Date(Date.now() + MPESA_DEPOSIT_POLLING_LOOKAHEAD_MS).toISOString();
  const pollingRequest = await initiateKopoKopoPollingRequest({
    accessToken,
    scope: "till",
    scopeReference: tillNumber,
    fromTime,
    toTime,
  });

  await db.collection("deposits").doc(depositId).set(
    {
      pollingRequestId: pollingRequest.pollingRequestId,
      pollingRequestLocation: pollingRequest.responseLocation,
      reconciliationStartedAt: depositData.reconciliationStartedAt || Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  return pollingRequest;
}

async function reconcileMpesaDepositPollingStatus({ depositId, depositData, accessToken }) {
  const pollingLocation =
    typeof depositData.pollingRequestLocation === "string" ? depositData.pollingRequestLocation.trim() : "";
  const pollingRequestId =
    typeof depositData.pollingRequestId === "string" ? depositData.pollingRequestId : "";

  if (!pollingLocation && !pollingRequestId) {
    return false;
  }

  const { payload } = await getKopoKopoPollingStatus({
    accessToken,
    location: pollingLocation,
    pollingRequestId,
  });
  const pollingResult = extractKopoKopoPollingResult(payload);
  const matchedTransaction = findMatchingKopoKopoPollingTransaction(depositData, payload);

  await db.collection("deposits").doc(depositId).set(
    {
      pollingRequestId: pollingResult.requestId || pollingRequestId || null,
      pollingRequestLocation: pollingResult.providerLocation || pollingLocation || null,
      pollingStatus: pollingResult.status || null,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  if (matchedTransaction) {
    await applyKopoKopoPollingTransactionToDeposit({
      depositId,
      payload,
      transactionResource: matchedTransaction,
    });
    return true;
  }

  const pollingStatus = normalizeProviderStatusValue(pollingResult.status);
  const fallbackFailureReason =
    typeof depositData.pendingFailureReason === "string" && depositData.pendingFailureReason.trim()
      ? depositData.pendingFailureReason
      : "We could not confirm this M-Pesa payment.";

  if (pollingStatus === "success" || pollingStatus === "failed") {
    await markMpesaDepositFailedAfterReconciliation({
      depositId,
      failureReason: fallbackFailureReason,
    });
    return true;
  }

  if (hasTimedOutMpesaDepositReconciliation(depositData)) {
    await markMpesaDepositFailedAfterReconciliation({
      depositId,
      failureReason: fallbackFailureReason,
    });
    return true;
  }

  return false;
}

async function expireTimedOutMpesaDeposit(depositId) {
  const depositRef = db.collection("deposits").doc(depositId);

  return db.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef);
    if (!depositSnapshot.exists) {
      return false;
    }

    const depositData = depositSnapshot.data() || {};

    if (String(depositData.method || "").toLowerCase() !== "m-pesa") {
      return false;
    }

    if (!isPendingPaymentStatus(depositData.status) || depositData.balanceCredited) {
      return false;
    }

    if (!hasTimedOutMpesaDepositRequest(depositData)) {
      return false;
    }

    transaction.update(depositRef, {
      status: "failed",
      providerStatus: "expired",
      providerResourceStatus: "expired",
      failureReason: MPESA_DEPOSIT_TIMEOUT_REASON,
      updatedAt: Timestamp.now(),
      expiredAt: Timestamp.now(),
    });

    return true;
  });
}

async function applyKopoKopoWithdrawalUpdate(withdrawalId, payload) {
  const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
  const result = extractKopoKopoWithdrawalResult(payload);
  const normalizedStatus = inferGenericTransactionStatus(
    result.status,
    result.transferStatus,
    result.disbursementStatus
  );
  const providerStatusValue =
    result.status || result.transferStatus || result.disbursementStatus || "processing";
  const providerTransferStatusValue = result.disbursementStatus || result.transferStatus || null;

  await db.runTransaction(async (transaction) => {
    const withdrawalSnapshot = await transaction.get(withdrawalRef);
    if (!withdrawalSnapshot.exists) {
      return;
    }

    const withdrawalData = withdrawalSnapshot.data() || {};
    const currentStatus = String(withdrawalData.status || "");

    if (currentStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerTransferStatus: providerTransferStatusValue,
        paymentReference: result.paymentId || withdrawalData.paymentReference || null,
        transactionReference: result.transactionReference || withdrawalData.transactionReference || null,
        providerLocation: result.providerLocation || withdrawalData.providerLocation || null,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      });
      return;
    }

    if (withdrawalData.balanceRefunded && normalizedStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerTransferStatus: providerTransferStatusValue,
        paymentReference: result.paymentId || withdrawalData.paymentReference || null,
        transactionReference: result.transactionReference || withdrawalData.transactionReference || null,
        providerLocation: result.providerLocation || withdrawalData.providerLocation || null,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      });
      return;
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
      });
      return;
    }

    if (normalizedStatus === "failed") {
      const userRef = db.collection("users").doc(String(withdrawalData.uid || ""));

      if (withdrawalData.balanceDeducted && !withdrawalData.balanceRefunded) {
        transaction.update(userRef, {
          userKesBalance: FieldValue.increment(Number(withdrawalData.amount || 0)),
          updatedAt: Timestamp.now(),
        });
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
      });
      return;
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
    });
  });
}

function normalizeCryptomusDepositStatus(providerStatus, isFinal) {
  const normalized = typeof providerStatus === "string" ? providerStatus.toLowerCase() : "";

  if (CRYPTOMUS_DEPOSIT_SUCCESS_STATUSES.has(normalized)) {
    return "completed";
  }

  if (CRYPTOMUS_DEPOSIT_FAILURE_STATUSES.has(normalized) || Boolean(isFinal)) {
    return "failed";
  }

  return "processing";
}

function normalizeCryptomusPayoutStatus(providerStatus) {
  const normalized = typeof providerStatus === "string" ? providerStatus.toLowerCase() : "";

  if (normalized === "paid") {
    return "completed";
  }

  if (CRYPTOMUS_PAYOUT_FAILURE_STATUSES.has(normalized)) {
    return "failed";
  }

  return "processing";
}

async function callCryptomus(endpoint, payload, apiKey) {
  const merchantId = process.env.NEXT_SERVER_CRYPTOMUS_MERCHANT_ID;

  if (!merchantId || !apiKey) {
    throw new Error("Cryptomus configuration missing");
  }

  const response = await axios.post(`https://api.cryptomus.com/v1/${endpoint}`, payload, {
    headers: {
      merchant: merchantId,
      sign: createCryptomusSignature(payload, apiKey),
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

async function applyCryptomusDepositUpdate(depositId, payload, providerStatus, isFinal) {
  const depositRef = db.collection("deposits").doc(depositId);
  const normalizedStatus = normalizeCryptomusDepositStatus(providerStatus, isFinal);
  const providerStatusValue = typeof providerStatus === "string" ? providerStatus : "unknown";

  await db.runTransaction(async (transaction) => {
    const depositSnapshot = await transaction.get(depositRef);
    if (!depositSnapshot.exists) {
      return;
    }

    const depositData = depositSnapshot.data() || {};
    const creditedAmount = Number(depositData.amount || 0);
    const currentStatus = String(depositData.status || "");

    if (currentStatus === "completed" && depositData.balanceCredited) {
      transaction.update(depositRef, {
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      });
      return;
    }

    if (normalizedStatus === "completed") {
      if (!depositData.balanceCredited) {
        const userRef = db.collection("users").doc(String(depositData.uid || ""));
        const userSnapshot = await transaction.get(userRef);

        if (!userSnapshot.exists) {
          transaction.set(userRef, setInitialUserBalances("USD", creditedAmount), { merge: true });
        } else {
          transaction.update(userRef, {
            userUsdBalance: FieldValue.increment(creditedAmount),
            updatedAt: Timestamp.now(),
          });
        }
      }

      transaction.update(depositRef, {
        status: "completed",
        providerStatus: providerStatusValue,
        balanceCredited: true,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      });
      return;
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
            : depositData.failureReason || null,
      });
      return;
    }

    transaction.update(depositRef, {
      status: depositData.balanceCredited ? "completed" : "processing",
      providerStatus: providerStatusValue,
      providerPayload: payload,
      updatedAt: Timestamp.now(),
    });
  });
}

async function applyCryptomusPayoutUpdate(withdrawalId, payload, providerStatus) {
  const withdrawalRef = db.collection("withdrawals").doc(withdrawalId);
  const normalizedStatus = normalizeCryptomusPayoutStatus(providerStatus);
  const providerStatusValue = typeof providerStatus === "string" ? providerStatus : "unknown";

  await db.runTransaction(async (transaction) => {
    const withdrawalSnapshot = await transaction.get(withdrawalRef);
    if (!withdrawalSnapshot.exists) {
      return;
    }

    const withdrawalData = withdrawalSnapshot.data() || {};
    const currentStatus = String(withdrawalData.status || "");

    if (currentStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      });
      return;
    }

    if (withdrawalData.balanceRefunded && normalizedStatus === "completed") {
      transaction.update(withdrawalRef, {
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
      });
      return;
    }

    if (normalizedStatus === "completed") {
      transaction.update(withdrawalRef, {
        status: "completed",
        providerStatus: providerStatusValue,
        providerPayload: payload,
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      });
      return;
    }

    if (normalizedStatus === "failed") {
      const userRef = db.collection("users").doc(String(withdrawalData.uid || ""));

      if (withdrawalData.balanceDeducted && !withdrawalData.balanceRefunded) {
        transaction.update(userRef, {
          userUsdBalance: FieldValue.increment(Number(withdrawalData.amount || 0)),
          updatedAt: Timestamp.now(),
        });
      }

      transaction.update(withdrawalRef, {
        status: "failed",
        providerStatus: providerStatusValue,
        providerPayload: payload,
        balanceRefunded: true,
        updatedAt: Timestamp.now(),
        failureReason:
          typeof payload.status === "string" ? payload.status : withdrawalData.failureReason || null,
      });
      return;
    }

    transaction.update(withdrawalRef, {
      status: "processing",
      providerStatus: providerStatusValue,
      providerPayload: payload,
      updatedAt: Timestamp.now(),
    });
  });
}

async function reconcileMpesaDepositDocument(docSnap, cache) {
  let data = docSnap.data() || {};

  if (!isMpesaPaymentRecord(data) || !isPendingPaymentStatus(data.status)) {
    return false;
  }

  const latestEvent = await findLatestKopoKopoDepositEvent(docSnap.id);

  if (latestEvent.payload) {
    await applyKopoKopoDepositUpdate(docSnap.id, latestEvent.payload);
    const refreshedSnapshot = await docSnap.ref.get();
    data = refreshedSnapshot.data() || {};

    if (!isPendingPaymentStatus(data.status)) {
      return true;
    }
  }

  const accessToken = await getKopoKopoAccessToken(cache);

  if (data.pollingRequestLocation || data.pollingRequestId) {
    const handledByPolling = await reconcileMpesaDepositPollingStatus({
      depositId: docSnap.id,
      depositData: data,
      accessToken,
    });

    if (handledByPolling) {
      return true;
    }

    const refreshedSnapshot = await docSnap.ref.get();
    data = refreshedSnapshot.data() || {};
  }

  const providerLocation =
    typeof data.providerLocation === "string" && data.providerLocation.trim()
      ? data.providerLocation.trim()
      : typeof data.paymentRequestId === "string" && data.paymentRequestId.trim()
        ? `${getKopoKopoBaseUrl()}/api/v1/incoming_payments/${data.paymentRequestId.trim()}`
        : "";

  if (providerLocation) {
    const { payload } = await getKopoKopoIncomingPaymentStatus({
      accessToken,
      location: providerLocation,
      paymentRequestId: data.paymentRequestId,
    });
    const incomingPaymentResult = extractKopoKopoDepositResult(payload);
    const incomingPaymentStatus = inferDocumentedIncomingPaymentStatus({
      status: incomingPaymentResult.status,
      resourceStatus: incomingPaymentResult.resourceStatus,
      paymentReference: incomingPaymentResult.paymentReference,
    });

    if (incomingPaymentStatus === "completed") {
      await applyKopoKopoDepositUpdate(docSnap.id, payload);
      return true;
    }

    if (incomingPaymentStatus === "failed") {
      if (shouldUseMpesaPollingFallback(incomingPaymentResult.errorMessage)) {
        await ensureMpesaDepositPollingRequest({
          depositId: docSnap.id,
          depositData: data,
          accessToken,
        });

        await docSnap.ref.set(
          {
            providerStatus: "reconciling",
            providerResourceStatus: null,
            pendingFailureReason:
              incomingPaymentResult.errorMessage ||
              incomingPaymentResult.status ||
              "We could not confirm this M-Pesa payment.",
            reconciliationStartedAt: data.reconciliationStartedAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          { merge: true }
        );
        return false;
      }

      await applyKopoKopoDepositUpdate(docSnap.id, payload);
      return true;
    }
  }

  return expireTimedOutMpesaDeposit(docSnap.id);
}

async function reconcileMpesaWithdrawalDocument(docSnap, cache) {
  const data = docSnap.data() || {};

  if (!isMpesaPaymentRecord(data) || !isPendingPaymentStatus(data.status)) {
    return false;
  }

  let providerLocation = getPaymentLocation(data);

  if (!providerLocation) {
    const recovered = await findKopoKopoWithdrawalReference(docSnap.id);
    providerLocation = recovered.providerLocation;

    if (providerLocation || recovered.paymentId) {
      await docSnap.ref.set(
        {
          providerLocation: providerLocation || null,
          paymentReference: recovered.paymentId || null,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
      data.providerLocation = providerLocation;
      data.paymentReference = recovered.paymentId;
    }
  }

  if (!providerLocation) {
    return false;
  }

  const accessToken = await getKopoKopoAccessToken(cache);
  const { PayService } = getKopoKopoServices();
  const response = await PayService.getStatus({ accessToken, location: providerLocation });
  await applyKopoKopoWithdrawalUpdate(docSnap.id, response.data);

  return true;
}

async function reconcileMpesaDeposits(cache) {
  const snapshot = await db.collection("deposits").where("status", "in", PENDING_STATUSES).get();
  let processed = 0;

  for (const docSnap of snapshot.docs) {
    try {
      if (await reconcileMpesaDepositDocument(docSnap, cache)) {
        processed += 1;
      }
    } catch (error) {
      logger.error("Failed to reconcile M-Pesa deposit", { depositId: docSnap.id, error: error.message });
    }
  }

  return processed;
}

async function reconcileMpesaWithdrawals(cache) {
  const snapshot = await db.collection("withdrawals").where("status", "in", PENDING_STATUSES).limit(50).get();
  let processed = 0;

  for (const docSnap of snapshot.docs) {
    try {
      if (await reconcileMpesaWithdrawalDocument(docSnap, cache)) {
        processed += 1;
      }
    } catch (error) {
      logger.error("Failed to reconcile M-Pesa withdrawal", { withdrawalId: docSnap.id, error: error.message });
    }
  }

  return processed;
}

async function reconcileCryptoDeposits() {
  const snapshot = await db.collection("deposits").where("status", "in", PENDING_STATUSES).limit(50).get();
  const docs = snapshot.docs.filter((docSnap) => String(docSnap.data().method || "").toLowerCase() === "crypto");
  let processed = 0;
  const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_API_KEY;

  for (const docSnap of docs) {
    try {
      const data = docSnap.data();
      const invoice = asRecord(data.cryptomusInvoice);
      const uuid = typeof invoice.uuid === "string" ? invoice.uuid : "";

      if (!uuid || !apiKey) {
        continue;
      }

      const response = await callCryptomus("payment/info", { uuid }, apiKey);
      if (response.state !== 0) {
        continue;
      }

      await applyCryptomusDepositUpdate(docSnap.id, response.result, response.result.status, response.result.is_final);
      processed += 1;
    } catch (error) {
      logger.error("Failed to reconcile crypto deposit", { depositId: docSnap.id, error: error.message });
    }
  }

  return processed;
}

async function reconcileCryptoPayouts() {
  const snapshot = await db.collection("withdrawals").where("status", "in", PENDING_STATUSES).limit(50).get();
  const docs = snapshot.docs.filter((docSnap) => String(docSnap.data().method || "").toLowerCase() === "crypto");
  let processed = 0;
  const apiKey = process.env.NEXT_SERVER_CRYPTOMUS_PAYOUT_API_KEY;

  for (const docSnap of docs) {
    try {
      if (!apiKey) {
        continue;
      }

      const response = await callCryptomus("payout/info", { order_id: docSnap.id }, apiKey);
      if (response.state !== 0) {
        continue;
      }

      await applyCryptomusPayoutUpdate(docSnap.id, response.result, response.result.status);
      processed += 1;
    } catch (error) {
      logger.error("Failed to reconcile crypto payout", { withdrawalId: docSnap.id, error: error.message });
    }
  }

  return processed;
}

exports.trackInitiatedMpesaDeposit = functionsV1
  .region(REGION)
  .firestore.document("deposits/{depositId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() || {};
    if (!shouldTrackMpesaDeposit({}, data)) {
      return;
    }

    try {
      await reconcileMpesaDepositDocument(snapshot, { accessToken: "" });
      logger.info("Tracked initiated M-Pesa deposit", { depositId: context.params.depositId });
    } catch (error) {
      logger.error("Immediate M-Pesa deposit tracking failed", {
        depositId: context.params.depositId,
        error: error.message,
      });
    }
  });

exports.trackUpdatedMpesaDeposit = functionsV1
  .region(REGION)
  .firestore.document("deposits/{depositId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data() || {};
    const afterSnapshot = change.after;
    const afterData = afterSnapshot.data() || {};

    if (!shouldTrackMpesaDeposit(beforeData, afterData)) {
      return;
    }

    try {
      await reconcileMpesaDepositDocument(afterSnapshot, { accessToken: "" });
      logger.info("Tracked updated M-Pesa deposit reference", { depositId: context.params.depositId });
    } catch (error) {
      logger.error("Updated M-Pesa deposit tracking failed", {
        depositId: context.params.depositId,
        error: error.message,
      });
    }
  });

exports.trackInitiatedMpesaWithdrawal = functionsV1
  .region(REGION)
  .firestore.document("withdrawals/{withdrawalId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data() || {};
    if (!shouldTrackMpesaWithdrawal({}, data)) {
      return;
    }

    try {
      await reconcileMpesaWithdrawalDocument(snapshot, { accessToken: "" });
      logger.info("Tracked initiated M-Pesa withdrawal", { withdrawalId: context.params.withdrawalId });
    } catch (error) {
      logger.error("Immediate M-Pesa withdrawal tracking failed", {
        withdrawalId: context.params.withdrawalId,
        error: error.message,
      });
    }
  });

exports.trackUpdatedMpesaWithdrawal = functionsV1
  .region(REGION)
  .firestore.document("withdrawals/{withdrawalId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data() || {};
    const afterSnapshot = change.after;
    const afterData = afterSnapshot.data() || {};

    if (!shouldTrackMpesaWithdrawal(beforeData, afterData)) {
      return;
    }

    try {
      await reconcileMpesaWithdrawalDocument(afterSnapshot, { accessToken: "" });
      logger.info("Tracked updated M-Pesa withdrawal reference", {
        withdrawalId: context.params.withdrawalId,
      });
    } catch (error) {
      logger.error("Updated M-Pesa withdrawal tracking failed", {
        withdrawalId: context.params.withdrawalId,
        error: error.message,
      });
    }
  });

exports.reconcilePendingPayments = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "Africa/Nairobi",
    region: REGION,
  },
  async () => {
    const kopoCache = { accessToken: "" };
    const summary = {
      mpesaDeposits: 0,
      mpesaWithdrawals: 0,
      cryptoDeposits: 0,
      cryptoPayouts: 0,
    };

    summary.mpesaDeposits = await reconcileMpesaDeposits(kopoCache);
    summary.mpesaWithdrawals = await reconcileMpesaWithdrawals(kopoCache);
    summary.cryptoDeposits = await reconcileCryptoDeposits();
    summary.cryptoPayouts = await reconcileCryptoPayouts();

    logger.info("Payment reconciliation run completed", summary);
  }
);
