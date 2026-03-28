import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto'

import { FieldValue, Timestamp } from 'firebase-admin/firestore'

import { normalizeEmail } from '@/lib/authValidation'
import { createVerificationCodeEmail } from '@/lib/emailTemplates'
import { adminAuth, adminDb, assertFirebaseAdminConfigured } from '@/lib/firebaseAdmin'
import { AuthFlowError } from '@/lib/serverAuthFlow'
import { assertServerMailerConfigured, sendServerEmail } from '@/lib/serverMailer'

const EMAIL_VERIFICATION_COLLECTION = 'authEmailVerifications'
const OTP_EXPIRY_MS = 10 * 60 * 1000
const OTP_RESEND_COOLDOWN_MS = 60 * 1000
const OTP_MAX_ATTEMPTS = 5

interface EmailVerificationRecord {
  email: string
  userId: string
  codeHash: string
  attemptsRemaining: number
  expiresAt: Timestamp
  lastSentAt: Timestamp
}

function getVerificationSecret() {
  const secret = process.env.NEXT_SERVER_AUTH_OTP_SECRET ?? ''

  if (!secret) {
    throw new AuthFlowError(
      'Missing NEXT_SERVER_AUTH_OTP_SECRET. Configure it before sending verification codes.',
      500
    )
  }

  return secret
}

export function assertEmailVerificationConfigured() {
  assertFirebaseAdminConfigured()
  assertServerMailerConfigured()
  getVerificationSecret()
}

function getVerificationDocumentId(email: string) {
  return createHash('sha256').update(email).digest('hex')
}

function hashVerificationCode(email: string, code: string) {
  return createHmac('sha256', getVerificationSecret())
    .update(`${email}:${code}`)
    .digest('hex')
}

function verificationCodeMatches(email: string, code: string, expectedHash: string) {
  const expected = Buffer.from(expectedHash, 'hex')
  const actual = Buffer.from(hashVerificationCode(email, code), 'hex')

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export function generateVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export async function clearEmailVerificationState(email: string) {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return
  }

  await adminDb
    .collection(EMAIL_VERIFICATION_COLLECTION)
    .doc(getVerificationDocumentId(normalizedEmail))
    .delete()
    .catch(() => null)
}

export async function issueEmailVerificationCode({
  email,
  userId,
  firstName,
}: {
  email: string
  userId: string
  firstName?: string
}) {
  assertEmailVerificationConfigured()

  const normalizedEmail = normalizeEmail(email)
  const verificationRef = adminDb
    .collection(EMAIL_VERIFICATION_COLLECTION)
    .doc(getVerificationDocumentId(normalizedEmail))
  const now = Date.now()
  const existingSnapshot = await verificationRef.get()
  const existingData = existingSnapshot.data() as Partial<EmailVerificationRecord> | undefined
  const existingCreatedAt = existingSnapshot.get('createdAt') as Timestamp | null
  const lastSentAt = existingData?.lastSentAt?.toMillis?.() ?? 0

  if (lastSentAt && now - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    const secondsRemaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now - lastSentAt)) / 1000)
    throw new AuthFlowError(
      `Please wait ${secondsRemaining} seconds before requesting a new code.`,
      429
    )
  }

  const verificationCode = generateVerificationCode()

  await verificationRef.set({
    email: normalizedEmail,
    userId,
    codeHash: hashVerificationCode(normalizedEmail, verificationCode),
    attemptsRemaining: OTP_MAX_ATTEMPTS,
    expiresAt: Timestamp.fromMillis(now + OTP_EXPIRY_MS),
    lastSentAt: Timestamp.fromMillis(now),
    createdAt: existingCreatedAt ?? FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  const template = createVerificationCodeEmail({
    firstName,
    code: verificationCode,
  })

  await sendServerEmail({
    to: normalizedEmail,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
}

export async function verifyEmailVerificationCode({
  email,
  code,
}: {
  email: string
  code: string
}) {
  assertFirebaseAdminConfigured()

  const normalizedEmail = normalizeEmail(email)
  const verificationRef = adminDb
    .collection(EMAIL_VERIFICATION_COLLECTION)
    .doc(getVerificationDocumentId(normalizedEmail))
  const verificationSnapshot = await verificationRef.get()

  if (!verificationSnapshot.exists) {
    throw new AuthFlowError(
      'Verification not found. Request a new code to continue.',
      404
    )
  }

  const verificationData = verificationSnapshot.data() as EmailVerificationRecord
  const attemptsRemaining =
    typeof verificationData.attemptsRemaining === 'number'
      ? verificationData.attemptsRemaining
      : OTP_MAX_ATTEMPTS

  if (attemptsRemaining <= 0) {
    throw new AuthFlowError('Too many incorrect attempts. Request a new code.', 429)
  }

  if (verificationData.expiresAt.toMillis() < Date.now()) {
    await verificationRef.delete().catch(() => null)
    throw new AuthFlowError('This verification code has expired. Request a new one.', 410)
  }

  if (!verificationCodeMatches(normalizedEmail, code, verificationData.codeHash)) {
    const nextAttemptsRemaining = Math.max(attemptsRemaining - 1, 0)

    await verificationRef.set(
      {
        attemptsRemaining: nextAttemptsRemaining,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    throw new AuthFlowError(
      nextAttemptsRemaining > 0
        ? 'Invalid verification code.'
        : 'Too many incorrect attempts. Request a new code.',
      nextAttemptsRemaining > 0 ? 400 : 429
    )
  }

  const userRecord = await adminAuth.getUser(verificationData.userId)
  const completedAt = new Date().toISOString()

  if (!userRecord.emailVerified) {
    await adminAuth.updateUser(userRecord.uid, {
      emailVerified: true,
    })
  }

  await adminDb.collection('users').doc(userRecord.uid).set(
    {
      emailVerified: true,
      signupStatus: 'active',
      signupCompletedAt: completedAt,
      updatedAt: completedAt,
    },
    { merge: true }
  )

  await verificationRef.delete().catch(() => null)

  return userRecord
}
