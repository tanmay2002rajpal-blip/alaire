"use server"

import { createClient } from "@/lib/supabase/server"

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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("is_active")

    if (error) {
      console.error("Error fetching newsletter stats:", error)
      return { total: 0, active: 0, unsubscribed: 0 }
    }

    const subscribers = data || []
    return {
      total: subscribers.length,
      active: subscribers.filter(s => s.is_active).length,
      unsubscribed: subscribers.filter(s => !s.is_active).length,
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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("subscribed_at", { ascending: false })

    if (error) {
      console.error("Error fetching newsletter subscribers:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Unexpected error fetching newsletter subscribers:", err)
    return []
  }
}
