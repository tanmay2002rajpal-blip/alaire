'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateStatusResult {
  success: boolean
  error?: string
}

/**
 * Server action to update order status
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  note?: string,
  adminId?: string
): Promise<UpdateStatusResult> {
  try {
    const supabase = await createClient()

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order status:', updateError)
      return { success: false, error: updateError.message }
    }

    // Insert status history
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        status,
        note: note || null,
        created_by: adminId || null,
      })

    if (historyError) {
      console.error('Error inserting status history:', historyError)
      // Don't fail the whole operation, just log
    }

    // Log activity
    if (adminId) {
      await supabase.from('activity_log').insert({
        admin_id: adminId,
        action: 'update_order_status',
        entity_type: 'order',
        entity_id: orderId,
        details: { status, note },
      })
    }

    // Revalidate the orders pages
    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)

    return { success: true }
  } catch (error) {
    console.error('Error in updateOrderStatusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
