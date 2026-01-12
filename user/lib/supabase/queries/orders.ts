/**
 * @fileoverview Order-related database queries.
 * Handles fetching order details and history for customers.
 *
 * @module lib/supabase/queries/orders
 */

import { createClient } from "../server"
import type { ShippingAddress } from "@/types"

// ============================================================================
// Types
// ============================================================================

/**
 * Order item as stored in the database.
 */
export interface OrderItem {
  id: string
  product_id: string | null
  variant_id: string | null
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
  image_url: string | null
}

/**
 * Order status history entry.
 */
export interface OrderStatusEntry {
  id: string
  status: string
  note: string | null
  created_at: string
}

/**
 * Complete order with all related data.
 * Used for order detail pages and confirmation.
 */
export interface OrderWithDetails {
  id: string
  order_number: string
  user_id: string
  status: string
  subtotal: number
  discount_amount: number
  shipping_cost: number
  total: number
  shipping_address: ShippingAddress
  wallet_amount_used: number
  notes: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  payment_method: "prepaid" | "cod"
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  awb_number: string | null
  courier_name: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
  status_history: OrderStatusEntry[]
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetches a single order by ID for a specific user.
 * Includes order items and status history.
 *
 * Security: Only returns order if it belongs to the specified user.
 *
 * @param orderId - Order UUID
 * @param userId - User UUID (for authorization)
 * @returns Order with all details, or null if not found/unauthorized
 *
 * @example
 * ```ts
 * const order = await getOrderById(orderId, user.id)
 * if (order) {
 *   console.log(`Order ${order.order_number}: ${order.status}`)
 *   console.log(`Items: ${order.items.length}`)
 * }
 * ```
 */
export async function getOrderById(
  orderId: string,
  userId: string
): Promise<OrderWithDetails | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        quantity,
        price_at_purchase,
        image_url
      ),
      status_history:order_status_history(
        id,
        status,
        note,
        created_at
      )
    `)
    .eq("id", orderId)
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("[getOrderById] Error fetching order:", error)
    return null
  }

  return data as OrderWithDetails
}

/**
 * Fetches all orders for a user.
 * Used for order history page.
 *
 * @param userId - User UUID
 * @param limit - Maximum orders to return (default: 50)
 * @returns Array of orders with items
 *
 * @example
 * ```ts
 * const orders = await getUserOrders(user.id)
 * orders.map(order => (
 *   <OrderCard key={order.id} order={order} />
 * ))
 * ```
 */
export async function getUserOrders(
  userId: string,
  limit = 50
): Promise<OrderWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        id,
        product_id,
        variant_id,
        product_name,
        variant_name,
        quantity,
        price_at_purchase,
        image_url
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[getUserOrders] Error fetching orders:", error)
    return []
  }

  return (data as OrderWithDetails[]) ?? []
}
