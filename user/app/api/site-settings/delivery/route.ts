import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const db = await getDb()
    const enabledSetting = await db.collection("admin_settings").findOne({ key: "delivery_fee_enabled" })
    const thresholdSetting = await db.collection("admin_settings").findOne({ key: "free_delivery_threshold" })

    const v = thresholdSetting?.value
    return NextResponse.json({
      deliveryFeeEnabled: enabledSetting?.value !== false,
      freeDeliveryThreshold: typeof v === "number" && isFinite(v) ? v : 999,
    })
  } catch {
    return NextResponse.json({ deliveryFeeEnabled: true, freeDeliveryThreshold: 999 })
  }
}
