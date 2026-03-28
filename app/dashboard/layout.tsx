import type React from 'react'
import { redirect } from 'next/navigation'

import DashboardShell from '@/components/dashboard-shell'
import { requireSessionUser } from '@/lib/serverAuth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireSessionUser()
  } catch {
    redirect('/auth')
  }

  return <DashboardShell>{children}</DashboardShell>
}
