"use server"

import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function trackProductView(productId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) return

  const db = await getDb()

  await db.collection("recently_viewed").updateOne(
    { user_id: session.user.id, product_id: productId },
    {
      $set: {
        user_id: session.user.id,
        product_id: productId,
        viewed_at: new Date().toISOString(),
      },
    },
    { upsert: true }
  )
}
