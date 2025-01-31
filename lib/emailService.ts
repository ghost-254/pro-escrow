// lib/emailService.ts

import emailjs from '@emailjs/browser'

export const sendAdminNotification = async (data: {
  userId: string
  userEmail: string
  transactionId: string
  amount: number
  paymentMethod: string
  transactionType: 'buying' | 'selling'
  itemDescription: string
}) => {
  try {
    const templateParams = {
      userId: data.userId,
      userEmail: data.userEmail,
      transactionId: data.transactionId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionType: data.transactionType,
      itemDescription: data.itemDescription,
    }

    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
      templateParams,
      process.env.NEXT_PUBLIC_EMAILJS_USER_ID!
    )
  } catch (error) {
    throw new Error('Error sending email: ' + error)
  }
}
