import { type DecodedIdToken } from 'firebase-admin/auth'
import { FieldValue, type DocumentReference, type Transaction } from 'firebase-admin/firestore'

import { adminDb } from '@/lib/firebaseAdmin'
import { createNotifications, getGroupDashboardLink } from '@/lib/serverNotifications'
import { type UserProfileSnapshot, getUserProfileSnapshot } from '@/lib/serverUserProfiles'

type GroupRole = 'buyer' | 'seller'
type GroupCurrency = 'USD' | 'KES'
type EscrowFeeResponsibility = 'buyer' | 'seller' | '50/50'
type GroupAction =
  | 'request-complete'
  | 'respond-complete'
  | 'clear-complete-rejection'
  | 'request-cancel'
  | 'respond-cancel'
  | 'clear-cancel-rejection'

interface CreateGroupInput {
  transactionType: 'buying'
  price: number
  escrowFee: number
  currency: GroupCurrency
  itemDescription: string
  escrowFeeResponsibility: EscrowFeeResponsibility
}

interface JoinGroupInput {
  groupId: string
  itemDescription?: string
  price?: number
  serviceNature?: string
  currency?: string
  escrowFeeResponsibility?: string
}

interface GroupParticipants {
  participants: string[]
  buyerUid: string
  sellerUid: string
}

interface TransactionStatusState {
  buyerComplete: boolean
  sellerComplete: boolean
  initiator: GroupRole | null
  rejection: Record<string, unknown> | null
  buyerCancel: boolean
  sellerCancel: boolean
  cancelInitiator: GroupRole | null
  cancelRejection: Record<string, unknown> | null
}

export interface GroupActionInput {
  action: GroupAction
  agree?: boolean
  reason?: string
}

export interface GroupActionResult {
  message: string
  status: string
}

export class GroupSecurityError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function ensureTrimmedString(value: unknown, fieldName: string, maxLength = 500) {
  const normalized = typeof value === 'string' ? value.trim() : ''

  if (!normalized) {
    throw new GroupSecurityError(`${fieldName} is required.`)
  }

  if (normalized.length > maxLength) {
    throw new GroupSecurityError(`${fieldName} is too long.`)
  }

  return normalized
}

function ensureNumber(value: unknown, fieldName: string, { allowZero = false } = {}) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    throw new GroupSecurityError(`${fieldName} must be a valid number.`)
  }

  if (allowZero ? numericValue < 0 : numericValue <= 0) {
    throw new GroupSecurityError(`${fieldName} must be ${allowZero ? 'zero or greater' : 'greater than zero'}.`)
  }

  return numericValue
}

function ensureCurrency(value: unknown): GroupCurrency {
  if (value === 'USD' || value === 'KES') {
    return value
  }

  throw new GroupSecurityError('Unsupported currency.')
}

function ensureEscrowFeeResponsibility(value: unknown): EscrowFeeResponsibility {
  if (value === 'buyer' || value === 'seller' || value === '50/50') {
    return value
  }

  throw new GroupSecurityError('Invalid escrow fee responsibility.')
}

function getBuyerPayableAmount(
  price: number,
  escrowFee: number,
  escrowFeeResponsibility: EscrowFeeResponsibility
) {
  if (escrowFeeResponsibility === 'buyer') {
    return price + escrowFee
  }

  if (escrowFeeResponsibility === '50/50') {
    return price + escrowFee / 2
  }

  return price
}

function getDisplayName(profile: UserProfileSnapshot | null, fallback: string) {
  const firstName = profile?.firstName?.trim() ?? ''
  const lastName = profile?.lastName?.trim() ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || fallback
}

function getFallbackIdentity(sessionUser: DecodedIdToken) {
  return (
    (typeof sessionUser.name === 'string' && sessionUser.name.trim()) ||
    (typeof sessionUser.email === 'string' && sessionUser.email.trim()) ||
    sessionUser.uid
  )
}

function asRecord(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function normalizeTransactionStatus(value: unknown): TransactionStatusState {
  const record = asRecord(value)

  return {
    buyerComplete: Boolean(record.buyerComplete),
    sellerComplete: Boolean(record.sellerComplete),
    initiator: record.initiator === 'seller' ? 'seller' : record.initiator === 'buyer' ? 'buyer' : null,
    rejection:
      typeof record.rejection === 'object' && record.rejection !== null
        ? (record.rejection as Record<string, unknown>)
        : null,
    buyerCancel: Boolean(record.buyerCancel),
    sellerCancel: Boolean(record.sellerCancel),
    cancelInitiator:
      record.cancelInitiator === 'seller'
        ? 'seller'
        : record.cancelInitiator === 'buyer'
          ? 'buyer'
          : null,
    cancelRejection:
      typeof record.cancelRejection === 'object' && record.cancelRejection !== null
        ? (record.cancelRejection as Record<string, unknown>)
        : null,
  }
}

function resolveParticipants(groupData: unknown): GroupParticipants {
  const record = asRecord(groupData)
  const participants = Array.isArray(record.participants)
    ? record.participants.filter((participant: unknown): participant is string => typeof participant === 'string')
    : []

  const buyerUid =
    typeof record.buyerUid === 'string' && record.buyerUid
      ? record.buyerUid
      : participants[0] ?? ''

  const sellerUid =
    typeof record.sellerUid === 'string' && record.sellerUid
      ? record.sellerUid
      : participants[1] ?? ''

  return {
    participants,
    buyerUid,
    sellerUid,
  }
}

function getParticipantRole(uid: string, participants: GroupParticipants): GroupRole | null {
  if (uid === participants.buyerUid) {
    return 'buyer'
  }

  if (uid === participants.sellerUid) {
    return 'seller'
  }

  return null
}

function buildFullGroupUrl(baseUrl: string, groupId: string) {
  return `${baseUrl}${getGroupDashboardLink(groupId)}`
}

async function settleCompletedGroup(
  transaction: Transaction,
  groupRef: DocumentReference,
  groupData: Record<string, unknown>,
  participants: GroupParticipants,
  transactionStatus: TransactionStatusState
) {
  const currency = ensureCurrency(groupData.currency)
  const totalFrozen =
    currency === 'KES'
      ? Number(groupData.frozenKesBalance || 0)
      : Number(groupData.frozenUsdBalance || 0)
  const escrowFee = Number(groupData.escrowFee || 0)

  if (escrowFee > totalFrozen) {
    throw new GroupSecurityError('Escrow fee exceeds the frozen balance.', 409)
  }

  if (
    totalFrozen > 0 &&
    groupData.settlementStatus !== 'released' &&
    participants.buyerUid &&
    participants.sellerUid
  ) {
    const buyerRef = adminDb.collection('users').doc(participants.buyerUid)
    const sellerRef = adminDb.collection('users').doc(participants.sellerUid)
    const buyerSnapshot = await transaction.get(buyerRef)
    const sellerSnapshot = await transaction.get(sellerRef)

    if (!buyerSnapshot.exists || !sellerSnapshot.exists) {
      throw new GroupSecurityError('A participant profile is missing.', 409)
    }

    const buyerData = buyerSnapshot.data() || {}
    const sellerData = sellerSnapshot.data() || {}
    const sellerAmount = totalFrozen - escrowFee
    const frozenField = currency === 'KES' ? 'frozenUserKesBalance' : 'frozenUserUsdBalance'
    const sellerBalanceField = currency === 'KES' ? 'userKesBalance' : 'userUsdBalance'
    const buyerFrozenBalance = Number(buyerData[frozenField] || 0)

    if (buyerFrozenBalance < totalFrozen) {
      throw new GroupSecurityError('Frozen funds are inconsistent for this group.', 409)
    }

    const currentBuyerFrozen = buyerFrozenBalance - totalFrozen
    const currentSellerBalance = Number(sellerData[sellerBalanceField] || 0) + sellerAmount

    transaction.set(
      buyerRef,
      {
        [frozenField]: currentBuyerFrozen,
      },
      { merge: true }
    )

    transaction.set(
      sellerRef,
      {
        [sellerBalanceField]: currentSellerBalance,
      },
      { merge: true }
    )
  }

  transaction.update(groupRef, {
    transactionStatus: {
      ...transactionStatus,
      buyerComplete: true,
      sellerComplete: true,
      initiator: null,
      rejection: null,
    },
    status: 'complete',
    settlementStatus: totalFrozen > 0 ? 'released' : 'not_required',
    releasedAmount: Math.max(totalFrozen - escrowFee, 0),
    escrowFeeCaptured: escrowFee,
    frozenKesBalance: 0,
    frozenUsdBalance: 0,
    completedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return {
    totalFrozen,
    escrowFee,
    sellerAmount: Math.max(totalFrozen - escrowFee, 0),
    currency,
  }
}

async function settleCancelledGroup(
  transaction: Transaction,
  groupRef: DocumentReference,
  groupData: Record<string, unknown>,
  participants: GroupParticipants,
  transactionStatus: TransactionStatusState
) {
  const currency = ensureCurrency(groupData.currency)
  const totalFrozen =
    currency === 'KES'
      ? Number(groupData.frozenKesBalance || 0)
      : Number(groupData.frozenUsdBalance || 0)

  if (totalFrozen > 0 && groupData.settlementStatus !== 'refunded' && participants.buyerUid) {
    const buyerRef = adminDb.collection('users').doc(participants.buyerUid)
    const buyerSnapshot = await transaction.get(buyerRef)

    if (!buyerSnapshot.exists) {
      throw new GroupSecurityError('Buyer profile is missing.', 409)
    }

    const buyerData = buyerSnapshot.data() || {}
    const balanceField = currency === 'KES' ? 'userKesBalance' : 'userUsdBalance'
    const frozenField = currency === 'KES' ? 'frozenUserKesBalance' : 'frozenUserUsdBalance'
    const buyerFrozenBalance = Number(buyerData[frozenField] || 0)

    if (buyerFrozenBalance < totalFrozen) {
      throw new GroupSecurityError('Frozen funds are inconsistent for this group.', 409)
    }

    const updatedBalance = Number(buyerData[balanceField] || 0) + totalFrozen
    const updatedFrozen = buyerFrozenBalance - totalFrozen

    transaction.set(
      buyerRef,
      {
        [balanceField]: updatedBalance,
        [frozenField]: updatedFrozen,
      },
      { merge: true }
    )
  }

  transaction.update(groupRef, {
    transactionStatus: {
      ...transactionStatus,
      buyerCancel: true,
      sellerCancel: true,
      cancelInitiator: null,
      cancelRejection: null,
    },
    status: 'cancelled',
    settlementStatus: totalFrozen > 0 ? 'refunded' : 'not_required',
    refundedAmount: totalFrozen,
    frozenKesBalance: 0,
    frozenUsdBalance: 0,
    cancelledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  return {
    totalFrozen,
    currency,
  }
}

export async function createSecureGroup(
  sessionUser: DecodedIdToken,
  input: CreateGroupInput,
  baseUrl: string
) {
  const transactionType = input.transactionType

  if (transactionType !== 'buying') {
    throw new GroupSecurityError('Only buyer-funded group creation is supported here.', 400)
  }

  const price = ensureNumber(input.price, 'Price')
  const escrowFee = ensureNumber(input.escrowFee, 'Escrow fee', { allowZero: true })
  const currency = ensureCurrency(input.currency)
  const itemDescription = ensureTrimmedString(input.itemDescription, 'Item description')
  const escrowFeeResponsibility = ensureEscrowFeeResponsibility(input.escrowFeeResponsibility)
  const buyerPayableAmount = getBuyerPayableAmount(price, escrowFee, escrowFeeResponsibility)
  const profile = await getUserProfileSnapshot(sessionUser.uid, {
    email: typeof sessionUser.email === 'string' ? sessionUser.email : undefined,
  })
  const creatorName = getDisplayName(profile, getFallbackIdentity(sessionUser))
  const userRef = adminDb.collection('users').doc(sessionUser.uid)
  const groupRef = adminDb.collection('groups').doc()

  await adminDb.runTransaction(async (transaction) => {
    const userSnapshot = await transaction.get(userRef)

    if (!userSnapshot.exists) {
      throw new GroupSecurityError('Your user profile is missing. Please finish account setup first.', 409)
    }

    const userData = userSnapshot.data() || {}
    const balanceField = currency === 'KES' ? 'userKesBalance' : 'userUsdBalance'
    const frozenField = currency === 'KES' ? 'frozenUserKesBalance' : 'frozenUserUsdBalance'
    const currentBalance = Number(userData[balanceField] || 0)
    const currentFrozen = Number(userData[frozenField] || 0)

    if (currentBalance < buyerPayableAmount) {
      throw new GroupSecurityError(`Insufficient ${currency} balance to secure this group.`, 409)
    }

    transaction.set(
      userRef,
      {
        [balanceField]: currentBalance - buyerPayableAmount,
        [frozenField]: currentFrozen + buyerPayableAmount,
      },
      { merge: true }
    )

    transaction.set(groupRef, {
      transactionType,
      price,
      escrowFee,
      currency,
      itemDescription,
      escrowFeeResponsibility,
      participants: [sessionUser.uid],
      buyerUid: sessionUser.uid,
      sellerUid: null,
      createdBy: sessionUser.uid,
      creatorName,
      status: 'active',
      settlementStatus: buyerPayableAmount > 0 ? 'held' : 'not_required',
      frozenKesBalance: currency === 'KES' ? buyerPayableAmount : 0,
      frozenUsdBalance: currency === 'USD' ? buyerPayableAmount : 0,
      transactionStatus: {
        buyerComplete: false,
        sellerComplete: false,
        initiator: null,
        rejection: null,
        buyerCancel: false,
        sellerCancel: false,
        cancelInitiator: null,
        cancelRejection: null,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  })

  const groupLink = getGroupDashboardLink(groupRef.id)
  const groupLabel = `Xcrow_${groupRef.id.slice(0, 4)}`

  await createNotifications([
    {
      userId: sessionUser.uid,
      message: `New ${groupLabel} group created for ${itemDescription}. Share the secure link with the other party.`,
      link: groupLink,
    },
  ])

  return {
    groupId: groupRef.id,
    groupLink,
    groupUrl: buildFullGroupUrl(baseUrl, groupRef.id),
  }
}

export async function joinSecureGroup(sessionUser: DecodedIdToken, input: JoinGroupInput) {
  const groupId = ensureTrimmedString(input.groupId, 'Group link', 128)
  const groupRef = adminDb.collection('groups').doc(groupId)
  const sellerSummaryRef = adminDb.collection('sellerSummaries').doc()
  const profile = await getUserProfileSnapshot(sessionUser.uid, {
    email: typeof sessionUser.email === 'string' ? sessionUser.email : undefined,
  })
  const displayName = getDisplayName(profile, getFallbackIdentity(sessionUser))
  let existingParticipants: string[] = []
  let addedParticipant = false

  await adminDb.runTransaction(async (transaction) => {
    const groupSnapshot = await transaction.get(groupRef)

    if (!groupSnapshot.exists) {
      throw new GroupSecurityError('This group does not exist.', 404)
    }

    const groupData = groupSnapshot.data() || {}
    const participants = Array.isArray(groupData.participants)
      ? groupData.participants.filter((participant: unknown): participant is string => typeof participant === 'string')
      : []

    existingParticipants = participants

    if (participants.includes(sessionUser.uid)) {
      return
    }

    if (groupData.status !== 'active') {
      throw new GroupSecurityError('Only active groups can be joined.', 409)
    }

    if (participants.length >= 2) {
      throw new GroupSecurityError('This group already has both participants.', 409)
    }

    transaction.update(groupRef, {
      participants: [...participants, sessionUser.uid],
      sellerUid: groupData.sellerUid || sessionUser.uid,
      updatedAt: FieldValue.serverTimestamp(),
    })
    addedParticipant = true

    transaction.set(sellerSummaryRef, {
      groupId,
      sellerId: sessionUser.uid,
      itemDescription: typeof input.itemDescription === 'string' ? input.itemDescription.trim() : '',
      price: Number(input.price || 0),
      serviceNature: typeof input.serviceNature === 'string' ? input.serviceNature.trim() : '',
      currency: typeof input.currency === 'string' ? input.currency : '',
      escrowFeeResponsibility:
        typeof input.escrowFeeResponsibility === 'string' ? input.escrowFeeResponsibility : '',
      createdAt: FieldValue.serverTimestamp(),
    })
  })

  const groupLink = getGroupDashboardLink(groupId)
  const groupLabel = `Xcrow_${groupId.slice(0, 4)}`
  const notifications = [
    {
      userId: sessionUser.uid,
      message: `You joined ${groupLabel}.`,
      link: groupLink,
    },
    ...existingParticipants
      .filter((participantUid) => participantUid !== sessionUser.uid)
      .map((participantUid) => ({
        userId: participantUid,
        message: `${displayName} joined ${groupLabel}.`,
        link: groupLink,
      })),
  ]

  if (addedParticipant) {
    await createNotifications(notifications)
  }

  return {
    groupId,
    groupLink,
  }
}

export async function applySecureGroupAction(
  sessionUser: DecodedIdToken,
  groupId: string,
  input: GroupActionInput
): Promise<GroupActionResult> {
  const safeGroupId = ensureTrimmedString(groupId, 'Group id', 128)
  const action = input.action

  if (
    action !== 'request-complete' &&
    action !== 'respond-complete' &&
    action !== 'clear-complete-rejection' &&
    action !== 'request-cancel' &&
    action !== 'respond-cancel' &&
    action !== 'clear-cancel-rejection'
  ) {
    throw new GroupSecurityError('Unsupported group action.')
  }

  const actorProfile = await getUserProfileSnapshot(sessionUser.uid, {
    email: typeof sessionUser.email === 'string' ? sessionUser.email : undefined,
  })
  const actorName = getDisplayName(actorProfile, getFallbackIdentity(sessionUser))
  const groupRef = adminDb.collection('groups').doc(safeGroupId)
  const groupLink = getGroupDashboardLink(safeGroupId)
  const notifications: Array<{ userId: string; message: string; link?: string }> = []
  let result: GroupActionResult = {
    message: 'Action completed.',
    status: 'active',
  }

  await adminDb.runTransaction(async (transaction) => {
    const groupSnapshot = await transaction.get(groupRef)

    if (!groupSnapshot.exists) {
      throw new GroupSecurityError('Group not found.', 404)
    }

    const groupData = groupSnapshot.data() || {}
    const participants = resolveParticipants(groupData)
    const actorRole = getParticipantRole(sessionUser.uid, participants)

    if (!participants.participants.includes(sessionUser.uid) || !actorRole) {
      throw new GroupSecurityError('You are not allowed to change this group.', 403)
    }

    if (participants.participants.length < 2) {
      throw new GroupSecurityError('Both participants must be present before changing escrow status.', 409)
    }

    const otherUid = actorRole === 'buyer' ? participants.sellerUid : participants.buyerUid

    if (!otherUid) {
      throw new GroupSecurityError('The other participant has not joined yet.', 409)
    }

    const transactionStatus = normalizeTransactionStatus(groupData.transactionStatus)

    if (action === 'request-complete') {
      if (groupData.status === 'complete') {
        result = {
          message: 'This transaction is already complete.',
          status: 'complete',
        }
        return
      }

      if (groupData.status === 'cancelled') {
        throw new GroupSecurityError('Cancelled groups cannot be completed.', 409)
      }

      if (!transactionStatus.buyerComplete && !transactionStatus.sellerComplete) {
        transactionStatus.initiator = actorRole
        transactionStatus.rejection = null
      }

      if (actorRole === 'buyer') {
        transactionStatus.buyerComplete = true
      } else {
        transactionStatus.sellerComplete = true
      }

      if (transactionStatus.buyerComplete && transactionStatus.sellerComplete) {
        const settlement = await settleCompletedGroup(
          transaction,
          groupRef,
          groupData,
          participants,
          transactionStatus
        )

        notifications.push(
          {
            userId: participants.buyerUid,
            message: `Transaction ${safeGroupId} completed securely. ${settlement.currency} ${settlement.totalFrozen.toFixed(2)} was settled from escrow.`,
            link: groupLink,
          },
          {
            userId: participants.sellerUid,
            message: `Transaction ${safeGroupId} completed securely. ${settlement.currency} ${settlement.sellerAmount.toFixed(2)} was released to you.`,
            link: groupLink,
          }
        )

        result = {
          message: 'Both parties completed the transaction. Escrow was released securely.',
          status: 'complete',
        }

        return
      }

      transaction.update(groupRef, {
        transactionStatus,
        updatedAt: FieldValue.serverTimestamp(),
      })

      notifications.push({
        userId: otherUid,
        message: `${actorName} marked ${safeGroupId} as complete. Please review and respond.`,
        link: groupLink,
      })

      result = {
        message: 'Your completion request was recorded securely.',
        status: String(groupData.status || 'active'),
      }

      return
    }

    if (action === 'respond-complete') {
      if (!transactionStatus.initiator) {
        throw new GroupSecurityError('There is no completion request to respond to.', 409)
      }

      if (transactionStatus.initiator === actorRole) {
        throw new GroupSecurityError('You already initiated this completion request.', 409)
      }

      if (input.agree) {
        const settlement = await settleCompletedGroup(
          transaction,
          groupRef,
          groupData,
          participants,
          transactionStatus
        )

        notifications.push(
          {
            userId: participants.buyerUid,
            message: `Transaction ${safeGroupId} completed securely. ${settlement.currency} ${settlement.totalFrozen.toFixed(2)} was settled from escrow.`,
            link: groupLink,
          },
          {
            userId: participants.sellerUid,
            message: `Transaction ${safeGroupId} completed securely. ${settlement.currency} ${settlement.sellerAmount.toFixed(2)} was released to you.`,
            link: groupLink,
          }
        )

        result = {
          message: 'Transaction completed securely and escrow was released.',
          status: 'complete',
        }

        return
      }

      transaction.update(groupRef, {
        transactionStatus: {
          ...transactionStatus,
          buyerComplete: false,
          sellerComplete: false,
          rejection: {
            by: actorRole,
            reason: typeof input.reason === 'string' ? input.reason.trim() : '',
            time: new Date().toISOString(),
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      })

      notifications.push({
        userId: otherUid,
        message: `${actorName} rejected the completion request for ${safeGroupId}.`,
        link: groupLink,
      })

      result = {
        message: 'You rejected the completion request.',
        status: String(groupData.status || 'active'),
      }

      return
    }

    if (action === 'clear-complete-rejection') {
      if (!transactionStatus.rejection) {
        result = {
          message: 'Nothing to clear.',
          status: String(groupData.status || 'active'),
        }
        return
      }

      if (transactionStatus.initiator !== actorRole) {
        throw new GroupSecurityError('Only the requester can clear this rejection.', 403)
      }

      transaction.update(groupRef, {
        transactionStatus: {
          ...transactionStatus,
          rejection: null,
        },
        updatedAt: FieldValue.serverTimestamp(),
      })

      result = {
        message: 'Completion rejection cleared.',
        status: String(groupData.status || 'active'),
      }

      return
    }

    if (action === 'request-cancel') {
      if (groupData.status === 'complete') {
        throw new GroupSecurityError('Completed groups cannot be cancelled.', 409)
      }

      if (groupData.status === 'cancelled') {
        result = {
          message: 'This transaction is already cancelled.',
          status: 'cancelled',
        }
        return
      }

      if (!transactionStatus.buyerCancel && !transactionStatus.sellerCancel) {
        transactionStatus.cancelInitiator = actorRole
        transactionStatus.cancelRejection = null
      }

      if (actorRole === 'buyer') {
        transactionStatus.buyerCancel = true
      } else {
        transactionStatus.sellerCancel = true
      }

      if (transactionStatus.buyerCancel && transactionStatus.sellerCancel) {
        const refund = await settleCancelledGroup(
          transaction,
          groupRef,
          groupData,
          participants,
          transactionStatus
        )

        notifications.push(
          {
            userId: participants.buyerUid,
            message: `Transaction ${safeGroupId} was cancelled. ${refund.currency} ${refund.totalFrozen.toFixed(2)} was returned to your wallet.`,
            link: groupLink,
          },
          {
            userId: participants.sellerUid,
            message: `Transaction ${safeGroupId} was cancelled by agreement.`,
            link: groupLink,
          }
        )

        result = {
          message: 'Both parties agreed to cancel. Escrow was refunded securely.',
          status: 'cancelled',
        }

        return
      }

      transaction.update(groupRef, {
        transactionStatus,
        updatedAt: FieldValue.serverTimestamp(),
      })

      notifications.push({
        userId: otherUid,
        message: `${actorName} requested to cancel ${safeGroupId}. Please review and respond.`,
        link: groupLink,
      })

      result = {
        message: 'Your cancellation request was recorded securely.',
        status: String(groupData.status || 'active'),
      }

      return
    }

    if (action === 'respond-cancel') {
      if (!transactionStatus.cancelInitiator) {
        throw new GroupSecurityError('There is no cancellation request to respond to.', 409)
      }

      if (transactionStatus.cancelInitiator === actorRole) {
        throw new GroupSecurityError('You already initiated this cancellation request.', 409)
      }

      if (input.agree) {
        const refund = await settleCancelledGroup(
          transaction,
          groupRef,
          groupData,
          participants,
          transactionStatus
        )

        notifications.push(
          {
            userId: participants.buyerUid,
            message: `Transaction ${safeGroupId} was cancelled. ${refund.currency} ${refund.totalFrozen.toFixed(2)} was returned to your wallet.`,
            link: groupLink,
          },
          {
            userId: participants.sellerUid,
            message: `Transaction ${safeGroupId} was cancelled by agreement.`,
            link: groupLink,
          }
        )

        result = {
          message: 'Cancellation confirmed and funds were refunded securely.',
          status: 'cancelled',
        }

        return
      }

      transaction.update(groupRef, {
        transactionStatus: {
          ...transactionStatus,
          buyerCancel: false,
          sellerCancel: false,
          cancelRejection: {
            by: actorRole,
            reason: typeof input.reason === 'string' ? input.reason.trim() : '',
            time: new Date().toISOString(),
          },
        },
        updatedAt: FieldValue.serverTimestamp(),
      })

      notifications.push({
        userId: otherUid,
        message: `${actorName} rejected the cancellation request for ${safeGroupId}.`,
        link: groupLink,
      })

      result = {
        message: 'You rejected the cancellation request.',
        status: String(groupData.status || 'active'),
      }

      return
    }

    if (!transactionStatus.cancelRejection) {
      result = {
        message: 'Nothing to clear.',
        status: String(groupData.status || 'active'),
      }
      return
    }

    if (transactionStatus.cancelInitiator !== actorRole) {
      throw new GroupSecurityError('Only the requester can clear this cancellation rejection.', 403)
    }

    transaction.update(groupRef, {
      transactionStatus: {
        ...transactionStatus,
        cancelRejection: null,
      },
      updatedAt: FieldValue.serverTimestamp(),
    })

    result = {
      message: 'Cancellation rejection cleared.',
      status: String(groupData.status || 'active'),
    }
  })

  await createNotifications(notifications)

  return result
}
