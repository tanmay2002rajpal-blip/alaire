import { getDb } from "@/lib/db/client"

export interface DeliverySettings {
  deliveryFeeEnabled: boolean
  freeDeliveryThreshold: number
}

/**
 * Read the admin-configurable delivery settings (server-side).
 * Mirrors GET /api/site-settings/delivery so server components (shipping/faq
 * pages) can show the same threshold the checkout will actually charge.
 */
export async function getDeliverySettings(): Promise<DeliverySettings> {
  try {
    const db = await getDb()
    const enabled = await db.collection("admin_settings").findOne({ key: "delivery_fee_enabled" })
    const threshold = await db.collection("admin_settings").findOne({ key: "free_delivery_threshold" })
    const v = threshold?.value
    return {
      deliveryFeeEnabled: enabled?.value !== false,
      freeDeliveryThreshold: typeof v === "number" && isFinite(v) ? v : 999,
    }
  } catch {
    return { deliveryFeeEnabled: true, freeDeliveryThreshold: 999 }
  }
}
