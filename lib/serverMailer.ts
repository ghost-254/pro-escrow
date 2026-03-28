import nodemailer from 'nodemailer'

import { AuthFlowError } from '@/lib/serverAuthFlow'

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null

function getMailerConfig() {
  const host = process.env.NEXT_SERVER_SMTP_HOST ?? ''
  const port = Number(process.env.NEXT_SERVER_SMTP_PORT ?? '587')
  const user = process.env.NEXT_SERVER_SMTP_USER ?? ''
  const pass = process.env.NEXT_SERVER_SMTP_PASS ?? ''
  const from = process.env.NEXT_SERVER_EMAIL_FROM ?? ''

  return {
    host,
    port,
    user,
    pass,
    from,
  }
}

export function assertServerMailerConfigured() {
  const { host, port, user, pass, from } = getMailerConfig()

  if (!host || !port || !user || !pass || !from) {
    throw new AuthFlowError(
      'Missing SMTP configuration. Set NEXT_SERVER_SMTP_HOST, NEXT_SERVER_SMTP_PORT, NEXT_SERVER_SMTP_USER, NEXT_SERVER_SMTP_PASS, and NEXT_SERVER_EMAIL_FROM.',
      500
    )
  }
}

export function getSupportInboxAddress() {
  return (
    process.env.NEXT_SERVER_SUPPORT_INBOX ??
    process.env.NEXT_SERVER_SMTP_USER ??
    process.env.NEXT_SERVER_EMAIL_FROM ??
    'support@xcrowtrust.com'
  )
}

function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter
  }

  assertServerMailerConfigured()

  const { host, port, user, pass } = getMailerConfig()

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  })

  return cachedTransporter
}

export async function sendServerEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
}) {
  const transporter = getTransporter()
  const { from } = getMailerConfig()

  try {
    await transporter.sendMail({
      from: `XcrowTrust <${from}>`,
      to,
      subject,
      text,
      html,
      replyTo,
    })
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Failed to send server email.', error)
    throw new AuthFlowError(
      'We could not send the email. Please confirm the SMTP settings and try again.',
      500
    )
  }
}
