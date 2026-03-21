import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"

export const revalidate = 60 // revalidate every 60 seconds

export async function GET() {
  try {
    const db = await getDb()
    const settings = await db.collection("site_settings").findOne({ key: "promo_banner" })

    if (!settings?.value) {
      return NextResponse.json({
        text: "Free shipping on orders over ₹999",
        is_active: true,
      })
    }

    return NextResponse.json(settings.value)
  } catch {
    return NextResponse.json({
      text: "Free shipping on orders over ₹999",
      is_active: true,
    })
  }
}
