import { Suspense } from 'react'
import { getNotificationEmails, getAdminUsers, getCodEnabled } from '@/lib/queries/settings'
import { getCurrentAdmin } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'
import SettingsLoading from './loading'

export default async function SettingsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/login')

  const [notificationEmails, adminUsers, codEnabled] = await Promise.all([
    getNotificationEmails(),
    getAdminUsers(),
    getCodEnabled(),
  ])

  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsClient
        notificationEmails={notificationEmails}
        adminUsers={adminUsers}
        currentAdminId={admin.id}
        codEnabled={codEnabled}
      />
    </Suspense>
  )
}
