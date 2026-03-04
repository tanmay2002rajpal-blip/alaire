'use server'

import { getDb } from '@/lib/db/client'

export async function getActiveCarts() {
  const db = await getDb()
  const carts = await db.collection('active_carts')
    .find({})
    .sort({ updated_at: -1 })
    .toArray()
    
  return carts.map(cart => ({
    id: cart._id.toString(),
    user_id: cart.user_id,
    user_name: cart.user_name || null,
    total_items: cart.total_items,
    subtotal: cart.subtotal,
    updated_at: cart.updated_at,
    items: cart.items, // Detailed item data
  }))
}
