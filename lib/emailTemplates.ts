type EmailCallToAction = {
  label: string
  url: string
}

type EmailDetail = {
  label: string
  value: string
}

type EmailTemplateInput = {
  preheader: string
  eyebrow: string
  title: string
  intro: string
  highlightLabel?: string
  highlightValue?: string
  details?: EmailDetail[]
  sections?: string[]
  callToAction?: EmailCallToAction
  footerNote?: string
}

type VerificationCodeEmailInput = {
  firstName?: string
  code: string
}

type SupportInboxEmailInput = {
  subject: string
  title: string
  intro: string
  details: EmailDetail[]
  sections?: string[]
  callToAction?: EmailCallToAction
}

type SupportAcknowledgementEmailInput = {
  recipientName?: string
  requestType: string
  requestId: string
  summary: string
  callToAction?: EmailCallToAction
}

type TransactionAlertEmailInput = {
  userId: string
  userEmail: string
  transactionId: string
  amount: number
  paymentMethod: string
  transactionType: 'buying' | 'selling'
  itemDescription: string
}

const FALLBACK_BASE_URL = 'https://xcrowtrust.com'

function getEmailBaseUrl() {
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '').trim()

  if (!configuredBaseUrl || configuredBaseUrl.includes('localhost')) {
    return FALLBACK_BASE_URL
  }

  return configuredBaseUrl.replace(/\/$/, '')
}

function getLogoUrl() {
  return `${getEmailBaseUrl()}/logo11X.png`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderParagraphs(paragraphs: string[]) {
  return paragraphs
    .filter(Boolean)
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 14px; color: #cbd5e1; font-size: 15px; line-height: 1.75;">${escapeHtml(paragraph)}</p>`
    )
    .join('')
}

function renderDetails(details: EmailDetail[]) {
  if (!details.length) {
    return ''
  }

  return `
    <div style="margin: 24px 0; border: 1px solid rgba(148, 163, 184, 0.18); border-radius: 18px; overflow: hidden;">
      ${details
        .map(
          (detail, index) => `
            <div style="display: flex; gap: 16px; justify-content: space-between; padding: 14px 18px; background: ${
              index % 2 === 0 ? 'rgba(15, 23, 42, 0.72)' : 'rgba(15, 23, 42, 0.9)'
            };">
              <span style="color: #94a3b8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">${escapeHtml(
                detail.label
              )}</span>
              <span style="color: #f8fafc; font-size: 14px; font-weight: 600; text-align: right; white-space: pre-line;">${escapeHtml(
                detail.value
              )}</span>
            </div>
          `
        )
        .join('')}
    </div>
  `
}

function renderCallToAction(callToAction?: EmailCallToAction) {
  if (!callToAction) {
    return ''
  }

  return `
    <div style="margin-top: 28px;">
      <a
        href="${escapeHtml(callToAction.url)}"
        style="display: inline-block; padding: 14px 22px; border-radius: 999px; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.02em;"
      >
        ${escapeHtml(callToAction.label)}
      </a>
    </div>
  `
}

function renderEmailTemplate({
  preheader,
  eyebrow,
  title,
  intro,
  highlightLabel,
  highlightValue,
  details = [],
  sections = [],
  callToAction,
  footerNote,
}: EmailTemplateInput) {
  const logoUrl = getLogoUrl()

  const html = `
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
      ${escapeHtml(preheader)}
    </div>
    <div style="margin: 0; padding: 32px 12px; background: #020617; background-image: radial-gradient(circle at top left, rgba(139, 92, 246, 0.18), transparent 32%), radial-gradient(circle at top right, rgba(236, 72, 153, 0.12), transparent 28%); font-family: Arial, Helvetica, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; border-radius: 28px; overflow: hidden; border: 1px solid rgba(148, 163, 184, 0.16); background: linear-gradient(180deg, #0f172a 0%, #111827 100%); box-shadow: 0 24px 70px rgba(15, 23, 42, 0.35);">
        <div style="padding: 28px 32px; border-bottom: 1px solid rgba(148, 163, 184, 0.14); background: linear-gradient(135deg, rgba(91, 33, 182, 0.42) 0%, rgba(15, 23, 42, 0.96) 68%);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="${logoUrl}" alt="XcrowTrust" width="58" height="58" style="display: block; width: 58px; height: auto;" />
            <div>
              <div style="color: #f8fafc; font-size: 22px; font-weight: 800; letter-spacing: 0.01em;">XcrowTrust</div>
              <div style="margin-top: 4px; color: #e879f9; font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em;">${escapeHtml(
                eyebrow
              )}</div>
            </div>
          </div>
        </div>
        <div style="padding: 32px;">
          <h1 style="margin: 0 0 14px; color: #f8fafc; font-size: 28px; line-height: 1.2;">${escapeHtml(
            title
          )}</h1>
          <p style="margin: 0 0 18px; color: #cbd5e1; font-size: 15px; line-height: 1.75;">${escapeHtml(
            intro
          )}</p>
          ${
            highlightValue
              ? `
                <div style="margin: 26px 0; padding: 22px; border-radius: 24px; background: linear-gradient(135deg, rgba(124, 58, 237, 0.18) 0%, rgba(236, 72, 153, 0.14) 100%); border: 1px solid rgba(192, 132, 252, 0.2); text-align: center;">
                  ${
                    highlightLabel
                      ? `<div style="color: #c4b5fd; font-size: 12px; text-transform: uppercase; letter-spacing: 0.16em; margin-bottom: 10px;">${escapeHtml(
                          highlightLabel
                        )}</div>`
                      : ''
                  }
                  <div style="color: #ffffff; font-size: 30px; line-height: 1.1; font-weight: 800; letter-spacing: 0.22em;">${escapeHtml(
                    highlightValue
                  )}</div>
                </div>
              `
              : ''
          }
          ${renderDetails(details)}
          ${renderParagraphs(sections)}
          ${renderCallToAction(callToAction)}
        </div>
        <div style="padding: 24px 32px; border-top: 1px solid rgba(148, 163, 184, 0.14); background: rgba(2, 6, 23, 0.82);">
          ${
            footerNote
              ? `<p style="margin: 0 0 10px; color: #94a3b8; font-size: 13px; line-height: 1.6;">${escapeHtml(
                  footerNote
                )}</p>`
              : ''
          }
          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.6;">
            XcrowTrust, secure escrow for modern online transactions.<br />
            Support: <a href="mailto:support@xcrowtrust.com" style="color: #f0abfc; text-decoration: none;">support@xcrowtrust.com</a>
          </p>
        </div>
      </div>
    </div>
  `

  const text = [
    `XcrowTrust | ${eyebrow}`,
    '',
    title,
    '',
    intro,
    '',
    highlightValue
      ? `${highlightLabel ? `${highlightLabel}: ` : ''}${highlightValue}`
      : '',
    ...details.map((detail) => `${detail.label}: ${detail.value}`),
    '',
    ...sections,
    '',
    callToAction ? `${callToAction.label}: ${callToAction.url}` : '',
    footerNote ?? '',
    'Support: support@xcrowtrust.com',
  ]
    .filter(Boolean)
    .join('\n')

  return { html, text }
}

export function createVerificationCodeEmail({ firstName, code }: VerificationCodeEmailInput) {
  const intro = firstName
    ? `Hello ${firstName}, use the secure code below to verify your XcrowTrust email address.`
    : 'Use the secure code below to verify your XcrowTrust email address.'

  const subject = 'Your XcrowTrust verification code'

  return {
    subject,
    ...renderEmailTemplate({
      preheader: `Your XcrowTrust verification code is ${code}.`,
      eyebrow: 'Email Verification',
      title: 'Confirm your email address',
      intro,
      highlightLabel: 'Verification code',
      highlightValue: code,
      sections: [
        'This code expires in 10 minutes.',
        'If you did not request this code, you can safely ignore this email.',
      ],
      footerNote: 'For your security, never share this code with anyone.',
    }),
  }
}

export function createSupportInboxEmail({
  subject,
  title,
  intro,
  details,
  sections = [],
  callToAction,
}: SupportInboxEmailInput) {
  return {
    subject,
    ...renderEmailTemplate({
      preheader: `${title} received by XcrowTrust.`,
      eyebrow: 'Support Inbox',
      title,
      intro,
      details,
      sections,
      callToAction,
      footerNote: 'This message was generated automatically from your XcrowTrust platform workflow.',
    }),
  }
}

export function createSupportAcknowledgementEmail({
  recipientName,
  requestType,
  requestId,
  summary,
  callToAction,
}: SupportAcknowledgementEmailInput) {
  const title = `We received your ${requestType.toLowerCase()} request`
  const intro = recipientName
    ? `Hello ${recipientName}, our team has received your ${requestType.toLowerCase()} request and will review it shortly.`
    : `Our team has received your ${requestType.toLowerCase()} request and will review it shortly.`

  return {
    subject: `We received your XcrowTrust ${requestType.toLowerCase()} request`,
    ...renderEmailTemplate({
      preheader: `Your XcrowTrust ${requestType.toLowerCase()} request has been received.`,
      eyebrow: 'Support Update',
      title,
      intro,
      details: [
        { label: 'Reference', value: requestId },
        { label: 'Request type', value: requestType },
      ],
      sections: [
        summary,
        'If we need more information, we will reply to this email address.',
      ],
      callToAction,
      footerNote: 'Thank you for choosing XcrowTrust.',
    }),
  }
}

export function createTransactionAlertEmail({
  userId,
  userEmail,
  transactionId,
  amount,
  paymentMethod,
  transactionType,
  itemDescription,
}: TransactionAlertEmailInput) {
  return {
    subject: `XcrowTrust transaction alert: ${transactionId}`,
    ...renderEmailTemplate({
      preheader: `Transaction alert for ${transactionId}.`,
      eyebrow: 'Operations Alert',
      title: 'A transaction needs your attention',
      intro:
        'A transaction-related event was raised inside XcrowTrust and has been delivered to the operations inbox.',
      details: [
        { label: 'Transaction ID', value: transactionId },
        { label: 'User ID', value: userId },
        { label: 'User email', value: userEmail },
        { label: 'Type', value: transactionType },
        { label: 'Amount', value: String(amount) },
        { label: 'Payment method', value: paymentMethod },
      ],
      sections: [`Item description: ${itemDescription}`],
      footerNote: 'Review this event in your internal workflow before taking action.',
    }),
  }
}
