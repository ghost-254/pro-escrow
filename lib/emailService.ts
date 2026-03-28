import {
  createSupportAcknowledgementEmail,
  createSupportInboxEmail,
  createTransactionAlertEmail,
} from '@/lib/emailTemplates'
import { getSupportInboxAddress, sendServerEmail } from '@/lib/serverMailer'

export const sendAdminNotification = async (data: {
  userId: string
  userEmail: string
  transactionId: string
  amount: number
  paymentMethod: string
  transactionType: 'buying' | 'selling'
  itemDescription: string
}) => {
  const template = createTransactionAlertEmail(data)

  await sendServerEmail({
    to: getSupportInboxAddress(),
    subject: template.subject,
    text: template.text,
    html: template.html,
    replyTo: data.userEmail,
  })
}

export const sendSupportContactEmails = async (data: {
  requestId: string
  name: string
  email: string
  message: string
}) => {
  const inboxTemplate = createSupportInboxEmail({
    subject: `New XcrowTrust support message from ${data.name}`,
    title: 'New support contact request',
    intro: 'A visitor submitted the support contact form on XcrowTrust.',
    details: [
      { label: 'Reference', value: data.requestId },
      { label: 'Name', value: data.name },
      { label: 'Email', value: data.email },
    ],
    sections: [data.message],
  })

  const acknowledgementTemplate = createSupportAcknowledgementEmail({
    recipientName: data.name,
    requestType: 'Support',
    requestId: data.requestId,
    summary:
      'Your message is now with the XcrowTrust support team. We will review it and respond as soon as possible.',
  })

  await Promise.all([
    sendServerEmail({
      to: getSupportInboxAddress(),
      subject: inboxTemplate.subject,
      text: inboxTemplate.text,
      html: inboxTemplate.html,
      replyTo: data.email,
    }),
    sendServerEmail({
      to: data.email,
      subject: acknowledgementTemplate.subject,
      text: acknowledgementTemplate.text,
      html: acknowledgementTemplate.html,
    }),
  ])
}

export const sendGroupSupportEmails = async (data: {
  requestId: string
  requesterName: string
  requesterEmail: string
  userId: string
  reason: string
  comments?: string
  groupUrl?: string
}) => {
  const inboxTemplate = createSupportInboxEmail({
    subject: `Group support requested by ${data.requesterName}`,
    title: 'Group support was requested',
    intro: 'A signed-in XcrowTrust user requested direct support from inside a group chat.',
    details: [
      { label: 'Reference', value: data.requestId },
      { label: 'Requester', value: data.requesterName },
      { label: 'Email', value: data.requesterEmail },
      { label: 'User ID', value: data.userId },
      { label: 'Reason', value: data.reason },
    ],
    sections: data.comments ? [data.comments] : ['No extra comments were provided.'],
    callToAction: data.groupUrl
      ? {
          label: 'Open group chat',
          url: data.groupUrl,
        }
      : undefined,
  })

  const acknowledgementTemplate = createSupportAcknowledgementEmail({
    recipientName: data.requesterName,
    requestType: 'Group Support',
    requestId: data.requestId,
    summary:
      'Your support request has been delivered to the XcrowTrust team. We will review the conversation context and follow up shortly.',
    callToAction: data.groupUrl
      ? {
          label: 'Return to group chat',
          url: data.groupUrl,
        }
      : undefined,
  })

  await Promise.all([
    sendServerEmail({
      to: getSupportInboxAddress(),
      subject: inboxTemplate.subject,
      text: inboxTemplate.text,
      html: inboxTemplate.html,
      replyTo: data.requesterEmail,
    }),
    sendServerEmail({
      to: data.requesterEmail,
      subject: acknowledgementTemplate.subject,
      text: acknowledgementTemplate.text,
      html: acknowledgementTemplate.html,
    }),
  ])
}
