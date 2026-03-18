import { ObjectId } from "mongodb"
import { getDb } from "../client"
import { serializeDoc, serializeDocs } from "../helpers"
import type { ShippingAddress } from "@/types"

// ============================================================================
// Types
// ============================================================================

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

export interface OrderStatusEntry {
  id: string
  status: string
  note: string | null
  created_at: string
}

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

export async function getOrderById(
  orderId: string,
  userId: string | string[]
): Promise<OrderWithDetails | null> {
  const db = await getDb()

  // Match both string and ObjectId forms of user_id
  const ids = Array.isArray(userId) ? userId : [userId]
  const allIds: (string | ObjectId)[] = []
  for (const id of ids) {
    allIds.push(id)
    if (ObjectId.isValid(id)) allIds.push(new ObjectId(id))
  }
  const matchCondition = { user_id: { $in: allIds } }

  const pipeline = [
    {
      $match: {
        _id: new ObjectId(orderId),
        ...matchCondition,
      },
    },
    {
      $lookup: {
        from: "order_items",
        localField: "_id",
        foreignField: "order_id",
        as: "items",
      },
    },
    {
      $lookup: {
        from: "order_status_history",
        localField: "_id",
        foreignField: "order_id",
        as: "status_history",
      },
    },
  ]

  const docs = await db.collection("orders").aggregate(pipeline).toArray()

  if (docs.length === 0) return null

  const doc = docs[0]
  const s = serializeDoc(doc)
  return {
    ...s,
    items: serializeDocs(s.items || []),
    status_history: serializeDocs(s.status_history || []),
  } as unknown as OrderWithDetails
}

/**
 * Get order confirmation data (no auth required, limited fields for security).
 * Used by the order confirmation page shown right after placing an order.
 */
export async function getOrderConfirmation(
  orderId: string,
  userId?: string
): Promise<{
  id: string
  order_number: string
  status: string
  subtotal: number
  discount_amount: number
  shipping_cost: number
  total: number
  payment_method: string
  created_at: string
  items: OrderItem[]
  shipping_address: ShippingAddress
} | null> {
  const db = await getDb()

  const pipeline = [
    {
      $match: {
        _id: new ObjectId(orderId),
        ...(userId ? { user_id: new ObjectId(userId) } : {}),
      },
    },
    {
      $lookup: {
        from: "order_items",
        localField: "_id",
        foreignField: "order_id",
        as: "items",
      },
    },
    {
      $project: {
        order_number: 1,
        status: 1,
        subtotal: 1,
        discount_amount: 1,
        shipping_cost: { $ifNull: ["$shipping_cost", { $ifNull: ["$shipping_amount", 0] }] },
        total: 1,
        payment_method: 1,
        created_at: 1,
        shipping_address: 1,
        items: 1,
      },
    },
  ]

  const docs = await db.collection("orders").aggregate(pipeline).toArray()

  if (docs.length === 0) return null

  const doc = docs[0]
  const s = serializeDoc(doc)
  return {
    ...s,
    items: serializeDocs(s.items || []),
  } as any
}

export async function getUserOrders(
  userId: string | string[],
  limit = 50
): Promise<OrderWithDetails[]> {
  const db = await getDb()

  // Match both string and ObjectId forms of user_id
  const ids = Array.isArray(userId) ? userId : [userId]
  const allIds: (string | ObjectId)[] = []
  for (const id of ids) {
    allIds.push(id)
    if (ObjectId.isValid(id)) allIds.push(new ObjectId(id))
  }
  const matchCondition = { user_id: { $in: allIds } }

  const pipeline = [
    { $match: matchCondition },
    { $sort: { created_at: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "order_items",
        localField: "_id",
        foreignField: "order_id",
        as: "items",
      },
    },
  ]

  const docs = await db.collection("orders").aggregate(pipeline).toArray()

  return docs.map((doc) => {
    const s = serializeDoc(doc)
    return {
      ...s,
      items: serializeDocs(s.items || []),
      status_history: [],
    } as unknown as OrderWithDetails
  })
}
