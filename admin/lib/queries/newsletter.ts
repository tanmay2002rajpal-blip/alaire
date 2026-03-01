"use server"

import { getNewsletterSubscribersCollection } from '@/lib/db/collections'

export interface NewsletterSubscriber {
  id: string
  email: string
  is_active: boolean
  subscribed_at: string
  unsubscribed_at: string | null
}

/**
 * Get newsletter stats
 */
export async function getNewsletterStats() {
  try {
    const subscribersCol = await getNewsletterSubscribersCollection()

    const data = await subscribersCol.find(
      {},
      { projection: { is_active: 1 } }
    ).toArray()

    return {
      total: data.length,
      active: data.filter(s => s.is_active).length,
      unsubscribed: data.filter(s => !s.is_active).length,
    }
  } catch (err) {
    console.error("Unexpected error fetching newsletter stats:", err)
    return { total: 0, active: 0, unsubscribed: 0 }
  }
}

/**
 * Get all newsletter subscribers
 */
export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  try {
    const subscribersCol = await getNewsletterSubscribersCollection()

    const data = await subscribersCol.find().sort({ subscribed_at: -1 }).toArray()

    return data.map(sub => ({
      id: sub._id.toString(),
      email: sub.email,
      is_active: sub.is_active,
      subscribed_at: sub.subscribed_at.toISOString(),
      unsubscribed_at: sub.unsubscribed_at?.toISOString() || null,
    }))
  } catch (err) {
    console.error("Unexpected error fetching newsletter subscribers:", err)
    return []
  }
}
