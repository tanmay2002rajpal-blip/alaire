import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const db = await getDb()
    const setting = await db.collection("admin_settings").findOne({ key: "cod_enabled" })

    return NextResponse.json({ enabled: setting?.value !== false })
  } catch {
    return NextResponse.json({ enabled: true })
  }
}
