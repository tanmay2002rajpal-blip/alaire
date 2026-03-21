import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const db = await getDb()
    const settings = await db.collection("site_settings").findOne({ key: "promo_banner" })

    if (!settings?.value) {
      return NextResponse.json({
        text: "",
        is_active: false,
      })
    }

    return NextResponse.json(settings.value)
  } catch {
    return NextResponse.json({
      text: "",
      is_active: false,
    })
  }
}
