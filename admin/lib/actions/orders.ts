'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface UpdateStatusResult {
  success: boolean
  error?: string
}

interface ShippingDetails {
  trackingNumber?: string
  courierName?: string
  estimatedDelivery?: string
}

/**
 * Server action to update order status
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  note?: string,
  adminId?: string,
  shippingDetails?: ShippingDetails
): Promise<UpdateStatusResult> {
  try {
    const supabase = await createClient()

    // Build update object
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }

    // Add shipping details if provided (for shipped status)
    if (status === 'shipped' && shippingDetails) {
      if (shippingDetails.trackingNumber) {
        updateData.awb_number = shippingDetails.trackingNumber
      }
      if (shippingDetails.courierName) {
        updateData.courier_name = shippingDetails.courierName
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
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

    // Fetch order details for email notification
    const { data: order } = await supabase
      .from('orders')
      .select(`
        order_number,
        user_id,
        total,
        awb_number,
        courier_name
      `)
      .eq('id', orderId)
      .single()

    // Fetch customer details for email
    if (order) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', order.user_id)
        .single()

      // Send email notification based on status
      if (profile?.email) {
        await sendStatusNotification(status, {
          orderNumber: order.order_number,
          customerName: profile.full_name || 'Customer',
          customerEmail: profile.email,
          trackingNumber: order.awb_number || shippingDetails?.trackingNumber,
          courierName: order.courier_name || shippingDetails?.courierName,
          estimatedDelivery: shippingDetails?.estimatedDelivery,
          refundAmount: order.total,
        })
      }

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: getNotificationTitle(status),
        message: getNotificationMessage(status, order.order_number),
        type: 'order',
        link: `/account/orders/${orderId}`,
      })
    }

    // Log activity
    if (adminId) {
      await supabase.from('activity_log').insert({
        admin_id: adminId,
        action: 'update_order_status',
        entity_type: 'order',
        entity_id: orderId,
        details: { status, note, shippingDetails },
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

/**
 * Send status notification email (calls user app API)
 */
async function sendStatusNotification(
  status: string,
  data: {
    orderNumber: string
    customerName: string
    customerEmail: string
    trackingNumber?: string
    courierName?: string
    estimatedDelivery?: string
    refundAmount?: number
  }
) {
  try {
    // Verify ADMIN_API_SECRET is configured
    const adminSecret = process.env.ADMIN_API_SECRET
    if (!adminSecret) {
      console.error('ADMIN_API_SECRET environment variable is not configured - skipping email notification')
      return
    }

    // Call the user app's email API
    const userAppUrl = process.env.USER_APP_URL || 'http://localhost:3001'

    await fetch(`${userAppUrl}/api/notifications/order-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Secret': adminSecret,
      },
      body: JSON.stringify({ status, ...data }),
    })
  } catch (error) {
    console.error('Failed to send status notification:', error)
    // Don't fail the operation
  }
}

function getNotificationTitle(status: string): string {
  switch (status) {
    case 'processing':
      return 'Order Being Processed'
    case 'shipped':
      return 'Order Shipped!'
    case 'delivered':
      return 'Order Delivered!'
    case 'cancelled':
      return 'Order Cancelled'
    case 'refunded':
      return 'Refund Processed'
    default:
      return 'Order Status Updated'
  }
}

function getNotificationMessage(status: string, orderNumber: string): string {
  switch (status) {
    case 'processing':
      return `Your order ${orderNumber} is now being processed and will be shipped soon.`
    case 'shipped':
      return `Great news! Your order ${orderNumber} has been shipped and is on its way.`
    case 'delivered':
      return `Your order ${orderNumber} has been delivered. We hope you love your purchase!`
    case 'cancelled':
      return `Your order ${orderNumber} has been cancelled. Refund will be processed if applicable.`
    case 'refunded':
      return `Refund for order ${orderNumber} has been processed. It will reflect in 5-7 business days.`
    default:
      return `Your order ${orderNumber} status has been updated to ${status}.`
  }
}
