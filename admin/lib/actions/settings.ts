'use server'

import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { revalidatePath } from 'next/cache'
import { getAdminSettingsCollection, getAdminUsersCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { getSession } from '@/lib/auth/jwt'
import { logActivity } from '@/lib/queries/activity'

// Typed-confirmation sentinels for irreversible mass-delete actions.
// The UI must send the exact phrase before the deletion is allowed to run.
// NOTE: not exported — this is a 'use server' module where every export must be
// an async function. The client mirrors these phrases locally.
const CLEAR_ORDERS_CONFIRMATION = 'DELETE ALL ORDERS'
const CLEAR_CARTS_CONFIRMATION = 'DELETE ALL CARTS'

interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Ensure the caller is an authenticated admin (not staff).
 * Returns the session when authorized, or an error result to short-circuit.
 */
async function requireAdmin(): Promise<
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getSession>>> }
  | { ok: false; result: ActionResult }
> {
  const session = await getSession()
  if (!session) {
    return { ok: false, result: { success: false, error: 'Unauthorized' } }
  }
  if (session.role !== 'admin') {
    return { ok: false, result: { success: false, error: 'Forbidden: admin access required' } }
  }
  return { ok: true, session }
}

// ─── Notification Emails ────────────────────────────────────────────────────

/**
 * Save the full list of notification emails
 */
export async function saveNotificationEmails(emails: string[]): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const cleaned = emails.map((e) => e.trim().toLowerCase()).filter((e) => e.length > 0)

    for (const email of cleaned) {
      if (!emailRegex.test(email)) {
        return { success: false, error: `Invalid email address: ${email}` }
      }
    }

    // Remove duplicates
    const unique = [...new Set(cleaned)]

    const settingsCol = await getAdminSettingsCollection()
    await settingsCol.updateOne(
      { key: 'notification_emails' },
      {
        $set: {
          key: 'notification_emails',
          value: unique,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    )

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in saveNotificationEmails:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

// ─── COD Toggle ────────────────────────────────────────────────────────────

export async function saveCodSetting(enabled: boolean): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result

    const settingsCol = await getAdminSettingsCollection()
    await settingsCol.updateOne(
      { key: 'cod_enabled' },
      {
        $set: {
          key: 'cod_enabled',
          value: enabled,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    )

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in saveCodSetting:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

// ─── Delivery Settings ─────────────────────────────────────────────────────

export async function saveDeliverySettings(data: {
  deliveryFeeEnabled: boolean
  freeDeliveryThreshold: number
}): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result

    const { deliveryFeeEnabled, freeDeliveryThreshold } = data

    if (
      typeof freeDeliveryThreshold !== 'number' ||
      !Number.isFinite(freeDeliveryThreshold) ||
      freeDeliveryThreshold < 0
    ) {
      return { success: false, error: 'Free delivery threshold must be a number greater than or equal to 0' }
    }

    const settingsCol = await getAdminSettingsCollection()
    await settingsCol.updateOne(
      { key: 'delivery_fee_enabled' },
      {
        $set: {
          key: 'delivery_fee_enabled',
          value: deliveryFeeEnabled,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    )
    await settingsCol.updateOne(
      { key: 'free_delivery_threshold' },
      {
        $set: {
          key: 'free_delivery_threshold',
          value: freeDeliveryThreshold,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    )

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in saveDeliverySettings:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

// ─── Data Management ───────────────────────────────────────────────────────

export async function clearActiveCartsAction(confirmationText: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result

    // Require exact typed confirmation before this irreversible mass-delete runs.
    if (confirmationText !== CLEAR_CARTS_CONFIRMATION) {
      return { success: false, error: 'Confirmation text did not match' }
    }

    const { getDb } = await import('@/lib/db/client')
    const db = await getDb()
    const cartsResult = await db.collection('carts').deleteMany({})
    const activeResult = await db.collection('active_carts').deleteMany({})

    await logActivity({
      adminId: auth.session.sub,
      action: 'clear_active_carts',
      details: {
        admin_name: auth.session.name,
        carts_deleted: cartsResult.deletedCount,
        active_carts_deleted: activeResult.deletedCount,
      },
    })

    revalidatePath('/carts')
    return { success: true }
  } catch (error) {
    console.error('Error clearing carts:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to clear carts' }
  }
}

export async function clearOrdersAction(confirmationText: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result

    // Require exact typed confirmation before this irreversible mass-delete runs.
    if (confirmationText !== CLEAR_ORDERS_CONFIRMATION) {
      return { success: false, error: 'Confirmation text did not match' }
    }

    const { getDb } = await import('@/lib/db/client')
    const db = await getDb()
    const ordersResult = await db.collection('orders').deleteMany({})
    const itemsResult = await db.collection('order_items').deleteMany({})
    const historyResult = await db.collection('order_status_history').deleteMany({})

    await logActivity({
      adminId: auth.session.sub,
      action: 'clear_orders',
      details: {
        admin_name: auth.session.name,
        orders_deleted: ordersResult.deletedCount,
        order_items_deleted: itemsResult.deletedCount,
        order_status_history_deleted: historyResult.deletedCount,
      },
    })

    revalidatePath('/orders')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Error clearing orders:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to clear orders' }
  }
}

// ─── Admin Users CRUD ───────────────────────────────────────────────────────

/**
 * Create a new admin user
 */
export async function createAdminUser(data: {
  name: string
  email: string
  password: string
  role: 'admin' | 'staff'
}): Promise<ActionResult & { userId?: string }> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result

    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' }
    }
    if (!data.email || !data.email.includes('@')) {
      return { success: false, error: 'A valid email is required' }
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }

    const adminUsersCol = await getAdminUsersCollection()
    const normalizedEmail = data.email.trim().toLowerCase()

    // Check for duplicate email
    const existing = await adminUsersCol.findOne({ email: normalizedEmail })
    if (existing) {
      return { success: false, error: 'An admin with this email already exists' }
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const now = new Date()
    const userId = new ObjectId()

    await adminUsersCol.insertOne({
      _id: userId,
      email: normalizedEmail,
      name: data.name.trim(),
      password_hash: passwordHash,
      role: data.role,
      is_active: true,
      two_factor_enabled: false,
      created_at: now,
      updated_at: now,
    })

    revalidatePath('/settings')
    return { success: true, userId: userId.toString() }
  } catch (error) {
    console.error('Error in createAdminUser:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Change password for an admin user
 */
export async function changeAdminPassword(data: {
  userId: string
  newPassword: string
  currentPassword?: string
}): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!data.newPassword || data.newPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' }
    }

    const isSelf = data.userId === session.sub

    // Changing another admin's password requires the admin role.
    // Changing your own requires verifying your current password.
    if (!isSelf && session.role !== 'admin') {
      return { success: false, error: 'Forbidden: admin access required' }
    }

    const adminUsersCol = await getAdminUsersCollection()
    const oid = toObjectId(data.userId)

    const user = await adminUsersCol.findOne({ _id: oid })
    if (!user) {
      return { success: false, error: 'Admin user not found' }
    }

    if (isSelf) {
      if (!data.currentPassword) {
        return { success: false, error: 'Current password is required' }
      }
      const validCurrent = await bcrypt.compare(data.currentPassword, user.password_hash)
      if (!validCurrent) {
        return { success: false, error: 'Current password is incorrect' }
      }
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12)

    await adminUsersCol.updateOne(
      { _id: oid },
      { $set: { password_hash: passwordHash, updated_at: new Date() } }
    )

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in changeAdminPassword:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Toggle active status for an admin user
 */
export async function toggleAdminStatus(userId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result
    const session = auth.session

    // Prevent toggling self
    if (userId === session.sub) {
      return { success: false, error: 'You cannot deactivate your own account' }
    }

    const adminUsersCol = await getAdminUsersCollection()
    const oid = toObjectId(userId)

    const user = await adminUsersCol.findOne(
      { _id: oid },
      { projection: { is_active: 1 } }
    )

    if (!user) {
      return { success: false, error: 'Admin user not found' }
    }

    await adminUsersCol.updateOne(
      { _id: oid },
      { $set: { is_active: !user.is_active, updated_at: new Date() } }
    )

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in toggleAdminStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Delete an admin user
 */
export async function deleteAdminUser(userId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.result
    const session = auth.session

    // Prevent self-deletion
    if (userId === session.sub) {
      return { success: false, error: 'You cannot delete your own account' }
    }

    const adminUsersCol = await getAdminUsersCollection()
    const oid = toObjectId(userId)

    const user = await adminUsersCol.findOne({ _id: oid })
    if (!user) {
      return { success: false, error: 'Admin user not found' }
    }

    await adminUsersCol.deleteOne({ _id: oid })

    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteAdminUser:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
