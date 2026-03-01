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
  userId: string
): Promise<OrderWithDetails | null> {
  const db = await getDb()

  const pipeline = [
    {
      $match: {
        $expr: { $eq: [{ $toString: "$_id" }, orderId] },
        user_id: userId,
      },
    },
    {
      $lookup: {
        from: "order_items",
        let: { oid: { $toString: "$_id" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },
          {
            $project: {
              product_id: 1,
              variant_id: 1,
              product_name: 1,
              variant_name: 1,
              quantity: 1,
              price_at_purchase: 1,
              image_url: 1,
            },
          },
        ],
        as: "items",
      },
    },
    {
      $lookup: {
        from: "order_status_history",
        let: { oid: { $toString: "$_id" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },
          {
            $project: {
              status: 1,
              note: 1,
              created_at: 1,
            },
          },
        ],
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

export async function getUserOrders(
  userId: string,
  limit = 50
): Promise<OrderWithDetails[]> {
  const db = await getDb()

  const pipeline = [
    { $match: { user_id: userId } },
    { $sort: { created_at: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "order_items",
        let: { oid: { $toString: "$_id" } },
        pipeline: [
          { $match: { $expr: { $eq: ["$order_id", "$$oid"] } } },
          {
            $project: {
              product_id: 1,
              variant_id: 1,
              product_name: 1,
              variant_name: 1,
              quantity: 1,
              price_at_purchase: 1,
              image_url: 1,
            },
          },
        ],
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
