'use server'

import { getDb } from '@/lib/db/client'
import type { CartItem } from '@/hooks/use-cart'

export async function syncCartToDb(
  userId: string,
  items: CartItem[],
  userName?: string | null,
  replaceGuestId?: string | null
) {
  const db = await getDb()
  const col = db.collection('active_carts')

  // If replacing a guest cart (user just logged in), delete the old guest entry first
  if (replaceGuestId && replaceGuestId !== userId) {
    await col.deleteOne({ user_id: replaceGuestId })
  }
  
  if (items.length === 0) {
    // If cart is cleared, delete from active carts
    await col.deleteOne({ user_id: userId })
    return { success: true }
  }

  // Calculate generic total
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0)
  const subtotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0)

  await col.updateOne(
    { user_id: userId },
    {
      $set: {
        user_id: userId,
        user_name: userName || null,
        items,
        total_items: totalItems,
        subtotal,
        updated_at: new Date()
      }
    },
    { upsert: true }
  )

  return { success: true }
}
