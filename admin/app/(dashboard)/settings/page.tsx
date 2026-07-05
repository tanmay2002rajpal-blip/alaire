import { Suspense } from 'react'
import { getNotificationEmails, getAdminUsers, getCodEnabled } from '@/lib/queries/settings'
import { getAdminSettingsCollection } from '@/lib/db/collections'
import { getCurrentAdmin } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'
import SettingsLoading from './loading'

async function getDeliverySettings(): Promise<{
  deliveryFeeEnabled: boolean
  freeDeliveryThreshold: number
}> {
  const settingsCol = await getAdminSettingsCollection()
  const [enabledDoc, thresholdDoc] = await Promise.all([
    settingsCol.findOne({ key: 'delivery_fee_enabled' }),
    settingsCol.findOne({ key: 'free_delivery_threshold' }),
  ])
  const thresholdValue = thresholdDoc?.value
  return {
    deliveryFeeEnabled: enabledDoc?.value !== false,
    freeDeliveryThreshold:
      typeof thresholdValue === 'number' && Number.isFinite(thresholdValue)
        ? thresholdValue
        : 999,
  }
}

export default async function SettingsPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/login')

  const [notificationEmails, adminUsers, codEnabled, deliverySettings] = await Promise.all([
    getNotificationEmails(),
    getAdminUsers(),
    getCodEnabled(),
    getDeliverySettings(),
  ])

  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsClient
        notificationEmails={notificationEmails}
        adminUsers={adminUsers}
        currentAdminId={admin.id}
        codEnabled={codEnabled}
        deliveryFeeEnabled={deliverySettings.deliveryFeeEnabled}
        freeDeliveryThreshold={deliverySettings.freeDeliveryThreshold}
      />
    </Suspense>
  )
}
