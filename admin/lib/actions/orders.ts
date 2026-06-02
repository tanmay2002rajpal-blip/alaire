'use server'

import { ObjectId } from 'mongodb'
import { getOrdersCollection, getOrderStatusHistoryCollection, getUsersCollection, getActivityLogCollection, getOrderItemsCollection, getProductVariantsCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

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
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    const ordersCol = await getOrdersCollection()
    const historyCol = await getOrderStatusHistoryCollection()
    const oid = toObjectId(orderId)

    // Build update object
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date(),
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
    await ordersCol.updateOne({ _id: oid }, { $set: updateData })

    // Insert status history
    await historyCol.insertOne({
      _id: new ObjectId(),
      order_id: oid,
      status,
      note: note || null,
      created_by: adminId ? toObjectId(adminId) : null,
      created_at: new Date(),
    })

    // On cancellation or refund: handle FShip + Razorpay + stock
    if (status === 'cancelled' || status === 'refunded') {
      const fullOrder = await ordersCol.findOne(
        { _id: oid },
        { projection: { awb_number: 1, pickup_token: 1, payment_method: 1, razorpay_payment_id: 1, total: 1 } }
      )

      // Cancel FShip shipment — only on cancellation (not refund-only)
      if (status === 'cancelled' && fullOrder?.awb_number) {
        try {
          const userAppUrl = process.env.USER_APP_URL || 'http://localhost:3000'
          const adminSecret = process.env.ADMIN_API_SECRET
          const cancelRes = await fetch(`${userAppUrl}/api/orders/cancel-shipment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Admin-Secret': adminSecret || '',
            },
            body: JSON.stringify({ orderId }),
          })
          const cancelData = await cancelRes.json()
          if (!cancelData.pickupCancelled) {
            console.warn('FShip shipment cancellation issue:', cancelData.pickupError)
          }
        } catch (cancelError) {
          console.error('FShip cancellation failed (non-fatal):', cancelError)
        }
      }

      // Restore stock — only on cancellation
      if (status === 'cancelled') {
        try {
          const orderItemsCol = await getOrderItemsCollection()
          const variantsCol = await getProductVariantsCollection()
          const cancelledItems = await orderItemsCol.find({ order_id: oid }).toArray()

          for (const item of cancelledItems) {
            if (item.variant_id) {
              await variantsCol.updateOne(
                { _id: typeof item.variant_id === 'string' ? toObjectId(item.variant_id) : item.variant_id },
                { $inc: { stock_quantity: item.quantity } }
              )
            }
          }
        } catch (stockError) {
          console.error('Stock restoration failed (non-fatal):', stockError)
        }
      }

      // Auto-refund Razorpay payment + wallet balance — for both cancelled and refunded
      try {
        const userAppUrl = process.env.USER_APP_URL || 'http://localhost:3000'
        const adminSecret = process.env.ADMIN_API_SECRET
        const refundRes = await fetch(`${userAppUrl}/api/orders/refund`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret || '',
          },
          body: JSON.stringify({ orderId }),
        })
        const refundData = await refundRes.json()
        if (refundData.razorpayRefund) {
          console.log('Razorpay refund issued:', refundData.razorpayRefund.id, '₹' + refundData.razorpayRefund.amount)
        }
        if (refundData.razorpayError) {
          console.warn('Razorpay refund issue:', refundData.razorpayError)
        }
        if (refundData.walletRefunded) {
          console.log('Wallet refunded: ₹' + refundData.walletRefunded)
        }
      } catch (refundError) {
        console.error('Auto-refund failed (non-fatal):', refundError)
      }
    }

    // Fetch order details for email notification
    const order = await ordersCol.findOne(
      { _id: oid },
      { projection: { order_number: 1, user_id: 1, total: 1, awb_number: 1, courier_name: 1 } }
    )

    if (order) {
      const usersCol = await getUsersCollection()
      const profile = await usersCol.findOne(
        { _id: order.user_id },
        { projection: { full_name: 1, email: 1 } }
      )

      // Send email notification based on status
      if (profile?.email) {
        await sendStatusNotification(status, {
          orderNumber: order.order_number,
          customerName: profile.full_name || 'Customer',
          customerEmail: profile.email,
          trackingNumber: (order as any).awb_number || shippingDetails?.trackingNumber,
          courierName: (order as any).courier_name || shippingDetails?.courierName,
          estimatedDelivery: shippingDetails?.estimatedDelivery,
          refundAmount: order.total,
        })
      }
    }

    // Log activity
    if (adminId) {
      const activityLog = await getActivityLogCollection()
      await activityLog.insertOne({
        _id: new ObjectId(),
        admin_id: toObjectId(adminId),
        admin_name: null,
        action: 'update_order_status',
        entity_type: 'order',
        entity_id: orderId,
        details: { status, note, shippingDetails },
        created_at: new Date(),
      })
    }

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
    const adminSecret = process.env.ADMIN_API_SECRET
    if (!adminSecret) {
      console.error('ADMIN_API_SECRET environment variable is not configured - skipping email notification')
      return
    }

    const userAppUrl = process.env.USER_APP_URL || 'http://localhost:3000'

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
