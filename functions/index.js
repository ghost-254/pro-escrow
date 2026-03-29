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
const MPESA_DEPOSIT_TIMEOUT_REASON = "This M-Pesa payment request expired. Please try again.";
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

async function findKopoKopoDepositReference(depositId) {
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
    return { paymentRequestId: "", paymentReference: "", providerLocation: "" };
  }

  const latest = snapshot.docs
    .map((docSnap) => docSnap.data())
    .sort((left, right) => getTimestampMillis(right.receivedAt) - getTimestampMillis(left.receivedAt))[0];
  const payload = asRecord(latest.payload);
  const data = asRecord(payload.data);
  const result = extractKopoKopoDepositResult(payload);
  const paymentRequestId = typeof data.id === "string" ? data.id : "";

  return {
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
  const normalizedStatus = inferGenericTransactionStatus(result.status, result.resourceStatus);
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
      updatedAt: Timestamp.now(),
    });
  });
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
  const data = docSnap.data() || {};

  if (!isMpesaPaymentRecord(data) || !isPendingPaymentStatus(data.status)) {
    return false;
  }

  let providerLocation = getIncomingPaymentLocation(data);

  if (!providerLocation) {
    const recovered = await findKopoKopoDepositReference(docSnap.id);
    providerLocation = recovered.providerLocation;

    if (providerLocation || recovered.paymentRequestId || recovered.paymentReference) {
      await docSnap.ref.set(
        {
          providerLocation: providerLocation || null,
          paymentRequestId: recovered.paymentRequestId || null,
          paymentReference: recovered.paymentReference || null,
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
      data.providerLocation = providerLocation;
      data.paymentRequestId = recovered.paymentRequestId;
      data.paymentReference = recovered.paymentReference;
    }
  }

  if (!providerLocation) {
    await expireTimedOutMpesaDeposit(docSnap.id);
    return false;
  }

  const accessToken = await getKopoKopoAccessToken(cache);
  const { payload } = await getKopoKopoIncomingPaymentStatus({
    accessToken,
    location: providerLocation,
    paymentRequestId: data.paymentRequestId,
  });
  await applyKopoKopoDepositUpdate(docSnap.id, payload);
  await expireTimedOutMpesaDeposit(docSnap.id);

  return true;
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
