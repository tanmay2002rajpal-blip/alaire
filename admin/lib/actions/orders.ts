'use server'

import { ObjectId } from 'mongodb'
import { getOrdersCollection, getOrderStatusHistoryCollection, getUsersCollection, getActivityLogCollection, getOrderItemsCollection, getProductVariantsCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth/jwt'

interface UpdateStatusResult {
  success: boolean
  error?: string
  warnings?: string[]
}

interface ShippingDetails {
  trackingNumber?: string
  courierName?: string
  estimatedDelivery?: string
}

// Server-side status transition rules (mirrors the client workflow, but is the
// authoritative check — the client cannot be trusted).
const STATUS_WORKFLOW: Record<string, string[]> = {
  pending: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
}

function isValidTransition(from: string, to: string): boolean {
  if (from === to) return false
  // Terminal states cannot transition anywhere.
  if (from === 'cancelled' || from === 'refunded') return false
  // Cancellation allowed from any non-terminal, non-delivered state.
  if (to === 'cancelled') return from !== 'delivered'
  // Refund allowed from any non-terminal state (blocks refunding twice via the
  // terminal check above).
  if (to === 'refunded') return true
  return (STATUS_WORKFLOW[from] || []).includes(to)
}

/**
 * Server action to update order status
 */
export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  note?: string,
  _clientAdminId?: string, // ignored: adminId is derived server-side (see below)
  shippingDetails?: ShippingDetails
): Promise<UpdateStatusResult> {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Unauthorized' }

    // Item 3: derive the acting admin from the session, never from the client.
    const adminId = session.sub

    const ordersCol = await getOrdersCollection()
    const historyCol = await getOrderStatusHistoryCollection()
    const oid = toObjectId(orderId)

    const warnings: string[] = []

    // Load the current order (authoritative state for transition validation
    // and for the fields needed by the side-effects / email notification).
    const current = await ordersCol.findOne(
      { _id: oid },
      {
        projection: {
          status: 1,
          order_number: 1,
          user_id: 1,
          total: 1,
          awb_number: 1,
          courier_name: 1,
          email: 1,
          shipping_address: 1,
        },
      }
    )

    if (!current) {
      return { success: false, error: 'Order not found' }
    }

    const previousStatus: string = current.status

    // Item 2: server-side transition validation. Reject invalid transitions
    // (double-cancel, refund-twice, cancelling a delivered order, etc.).
    if (!isValidTransition(previousStatus, status)) {
      return {
        success: false,
        error: `Cannot change order status from "${previousStatus}" to "${status}".`,
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date(),
    }

    // Add shipping details if provided (for shipped status)
    if (status === 'shipped' && shippingDetails) {
      // Item 5: never overwrite an existing FShip AWB with a manually typed
      // tracking number unless one was actually entered AND we don't already
      // have an AWB. Prefer keeping the FShip awb_number.
      if (shippingDetails.trackingNumber && !current.awb_number) {
        updateData.awb_number = shippingDetails.trackingNumber
      }
      if (shippingDetails.courierName) {
        updateData.courier_name = shippingDetails.courierName
      }
    }

    // Item 2: atomically guard the status change on the expected previous
    // status so racing / double-clicks cannot run the side-effects twice.
    const updateRes = await ordersCol.updateOne(
      { _id: oid, status: previousStatus },
      { $set: updateData }
    )
    if (updateRes.matchedCount === 0) {
      return {
        success: false,
        error: 'Order was updated concurrently. Please refresh and try again.',
      }
    }

    // Insert status history (created_by derived server-side).
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
      // Cancel FShip shipment — only on cancellation (not refund-only)
      if (status === 'cancelled' && current.awb_number) {
        try {
          const userAppUrl = process.env.USER_APP_URL || 'http://localhost:3002'
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
            const msg = `Shipment cancellation failed: ${cancelData.pickupError || cancelData.shipment_cancel_failed || 'unknown error'}`
            console.warn('FShip shipment cancellation issue:', cancelData.pickupError)
            warnings.push(msg)
          }
        } catch (cancelError) {
          const msg = `Shipment cancellation request failed: ${cancelError instanceof Error ? cancelError.message : 'unknown error'}`
          console.error('FShip cancellation failed (non-fatal):', cancelError)
          warnings.push(msg)
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
          const msg = `Stock restoration failed: ${stockError instanceof Error ? stockError.message : 'unknown error'}`
          console.error('Stock restoration failed (non-fatal):', stockError)
          warnings.push(msg)
        }
      }

      // Auto-refund Razorpay payment + wallet balance — for both cancelled and refunded
      try {
        const userAppUrl = process.env.USER_APP_URL || 'http://localhost:3002'
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
        if (refundData.success === false) {
          const msg = `Refund failed: ${refundData.error || refundData.razorpayError || 'unknown error'}`
          console.warn('Refund issue:', msg)
          warnings.push(msg)
        }
        if (refundData.razorpayRefund) {
          console.log('Razorpay refund issued:', refundData.razorpayRefund.id, '₹' + refundData.razorpayRefund.amount)
        }
        if (refundData.razorpayError) {
          const msg = `Razorpay refund failed: ${refundData.razorpayError}`
          console.warn('Razorpay refund issue:', refundData.razorpayError)
          warnings.push(msg)
        }
        if (refundData.walletRefunded) {
          console.log('Wallet refunded: ₹' + refundData.walletRefunded)
        }
      } catch (refundError) {
        const msg = `Refund request failed: ${refundError instanceof Error ? refundError.message : 'unknown error'}`
        console.error('Auto-refund failed (non-fatal):', refundError)
        warnings.push(msg)
      }
    }

    // Send email notification based on status.
    // Item 4: project + fall back to order.email (then shipping_address.email)
    // so GUEST orders (no user profile) still receive status emails.
    {
      let recipientEmail: string | null = null
      let recipientName = 'Customer'

      if (current.user_id) {
        const usersCol = await getUsersCollection()
        const profile = await usersCol.findOne(
          { _id: current.user_id },
          { projection: { full_name: 1, email: 1 } }
        )
        if (profile?.email) recipientEmail = profile.email
        if (profile?.full_name) recipientName = profile.full_name
      }

      const shippingAddr = (current.shipping_address as any) || {}
      if (!recipientEmail) {
        recipientEmail = (current as any).email || shippingAddr.email || null
      }
      if (recipientName === 'Customer' && shippingAddr.full_name) {
        recipientName = shippingAddr.full_name
      }

      if (recipientEmail) {
        try {
          const effectiveAwb =
            (updateData.awb_number as string | undefined) ||
            (current.awb_number as string | undefined) ||
            shippingDetails?.trackingNumber
          const effectiveCourier =
            (updateData.courier_name as string | undefined) ||
            (current.courier_name as string | undefined) ||
            shippingDetails?.courierName
          await sendStatusNotification(status, {
            orderNumber: current.order_number,
            customerName: recipientName,
            customerEmail: recipientEmail,
            trackingNumber: effectiveAwb,
            courierName: effectiveCourier,
            estimatedDelivery: shippingDetails?.estimatedDelivery,
            refundAmount: current.total,
          })
        } catch (emailError) {
          const msg = `Status email could not be sent: ${emailError instanceof Error ? emailError.message : 'unknown error'}`
          console.error('Status email failed (non-fatal):', emailError)
          warnings.push(msg)
        }
      }
    }

    // Log activity (admin derived server-side)
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

    return { success: true, warnings: warnings.length ? warnings : undefined }
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
  const adminSecret = process.env.ADMIN_API_SECRET
  if (!adminSecret) {
    console.error('ADMIN_API_SECRET environment variable is not configured - skipping email notification')
    throw new Error('ADMIN_API_SECRET not configured')
  }

  const userAppUrl = process.env.USER_APP_URL || 'http://localhost:3002'

  const res = await fetch(`${userAppUrl}/api/notifications/order-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': adminSecret,
    },
    body: JSON.stringify({ status, ...data }),
  })
  if (!res.ok) {
    throw new Error(`notification endpoint returned ${res.status}`)
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
