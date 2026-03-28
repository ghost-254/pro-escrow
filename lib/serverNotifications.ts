import { FieldValue } from 'firebase-admin/firestore'

import { adminDb } from '@/lib/firebaseAdmin'

export interface ServerNotificationInput {
  userId: string
  message: string
  link?: string
}

export function getGroupDashboardLink(groupId: string) {
  return `/dashboard/group-chat/${groupId}`
}

export async function createNotifications(inputs: ServerNotificationInput[]) {
  if (!inputs.length) {
    return
  }

  const batch = adminDb.batch()

  for (const input of inputs) {
    const notificationRef = adminDb.collection('notifications').doc()

    batch.set(notificationRef, {
      userId: input.userId,
      message: input.message,
      link: input.link ?? '',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
}
