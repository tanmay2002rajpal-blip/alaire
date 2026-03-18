'use server'

import { getUsersCollection, getOrdersCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

interface ActionResult {
  success: boolean
  error?: string
}

/**
 * Server action to toggle customer active status
 */
export async function toggleCustomerStatusAction(
  customerId: string
): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!customerId) {
      return { success: false, error: 'Customer ID is required' }
    }

    const usersCol = await getUsersCollection()
    const oid = toObjectId(customerId)

    const customer = await usersCol.findOne(
      { _id: oid },
      { projection: { is_active: 1 } }
    )

    if (!customer) {
      return { success: false, error: 'Customer not found' }
    }

    await usersCol.updateOne(
      { _id: oid },
      { $set: { is_active: !customer.is_active } }
    )

    revalidatePath('/customers')
    return { success: true }
  } catch (error) {
    console.error('Error toggling customer status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Server action to update customer details
 */
export async function updateCustomerAction(
  customerId: string,
  data: {
    full_name?: string
    phone?: string
    is_active?: boolean
  }
): Promise<ActionResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    if (!customerId) {
      return { success: false, error: 'Customer ID is required' }
    }

    const usersCol = await getUsersCollection()

    const updateData: Record<string, any> = {}
    if (data.full_name !== undefined) updateData.full_name = data.full_name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No data to update' }
    }

    await usersCol.updateOne(
      { _id: toObjectId(customerId) },
      { $set: updateData }
    )

    revalidatePath('/customers')
    revalidatePath(`/customers/${customerId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating customer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Export customers to CSV format
 */
export async function exportCustomersAction(): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const usersCol = await getUsersCollection()
    const ordersCol = await getOrdersCollection()

    const users = await usersCol.find().sort({ created_at: -1 }).toArray()

    // Get all orders for user stats
    const userIds = users.map(u => u._id)
    const orders = userIds.length > 0
      ? await ordersCol.find(
          { user_id: { $in: userIds } },
          { projection: { user_id: 1, total: 1 } }
        ).toArray()
      : []

    // Aggregate order stats per user
    const orderStats = new Map<string, { count: number; totalSpent: number }>()
    for (const order of orders) {
      const uid = order.user_id.toString()
      if (!orderStats.has(uid)) {
        orderStats.set(uid, { count: 0, totalSpent: 0 })
      }
      const stats = orderStats.get(uid)!
      stats.count += 1
      stats.totalSpent += order.total || 0
    }

    // Build CSV
    const headers = ['ID', 'Email', 'Name', 'Phone', 'Created At', 'Total Orders', 'Total Spent', 'Status']
    const rows = users.map(user => {
      const stats = orderStats.get(user._id.toString()) || { count: 0, totalSpent: 0 }

      return [
        user._id.toString(),
        user.email || '',
        user.full_name || '',
        user.phone || '',
        user.created_at.toLocaleDateString(),
        stats.count.toString(),
        stats.totalSpent.toFixed(2),
        user.is_active ? 'Active' : 'Inactive',
      ]
    })

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    return { success: true, data: csv }
  } catch (error) {
    console.error('Error exporting customers:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
