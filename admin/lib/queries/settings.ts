'use server'

import { getAdminSettingsCollection, getAdminUsersCollection } from '@/lib/db/collections'

/**
 * Get notification emails from admin_settings
 */
export async function getNotificationEmails(): Promise<string[]> {
  const settingsCol = await getAdminSettingsCollection()
  const doc = await settingsCol.findOne({ key: 'notification_emails' })
  return (doc?.value as string[]) || []
}

export async function getCodEnabled(): Promise<boolean> {
  const settingsCol = await getAdminSettingsCollection()
  const doc = await settingsCol.findOne({ key: 'cod_enabled' })
  return doc?.value !== false
}

export interface AdminUserListItem {
  id: string
  name: string
  email: string
  role: 'admin' | 'staff'
  is_active: boolean
  created_at: string
}

/**
 * Get all admin users (excluding password hash)
 */
export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  const adminUsersCol = await getAdminUsersCollection()
  const users = await adminUsersCol
    .find({}, { projection: { password_hash: 0, two_factor_enabled: 0 } })
    .sort({ created_at: -1 })
    .toArray()

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    is_active: u.is_active,
    created_at: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
  }))
}
