'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    if (!customerId) {
      return { success: false, error: 'Customer ID is required' }
    }

    const supabase = await createClient()

    // Get current status
    const { data: customer, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', customerId)
      .single()

    if (fetchError) {
      return { success: false, error: 'Customer not found' }
    }

    // Toggle status
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_active: !customer.is_active })
      .eq('id', customerId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

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
    if (!customerId) {
      return { success: false, error: 'Customer ID is required' }
    }

    const supabase = await createClient()

    const updateData: Record<string, any> = {}
    if (data.full_name !== undefined) updateData.full_name = data.full_name
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No data to update' }
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', customerId)

    if (error) {
      return { success: false, error: error.message }
    }

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
    const supabase = await createClient()

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        created_at,
        is_active,
        orders (
          id,
          total
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Build CSV
    const headers = ['ID', 'Email', 'Name', 'Phone', 'Created At', 'Total Orders', 'Total Spent', 'Status']
    const rows = (users || []).map(user => {
      const orders = Array.isArray(user.orders) ? user.orders : []
      const totalSpent = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)

      return [
        user.id,
        user.email,
        user.full_name || '',
        user.phone || '',
        new Date(user.created_at).toLocaleDateString(),
        orders.length.toString(),
        totalSpent.toFixed(2),
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
