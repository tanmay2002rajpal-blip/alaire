import { Suspense } from 'react'
import { getNotificationEmails, getAdminUsers } from '@/lib/queries/settings'
import { getCurrentAdmin } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'
import SettingsLoading from './loading'

export default async function SettingsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/login')

  const [notificationEmails, adminUsers] = await Promise.all([
    getNotificationEmails(),
    getAdminUsers(),
  ])

  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsClient
        notificationEmails={notificationEmails}
        adminUsers={adminUsers}
        currentAdminId={admin.id}
      />
    </Suspense>
  )
}
