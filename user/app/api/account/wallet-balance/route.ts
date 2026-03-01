import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ balance: 0 })
  }

  const db = await getDb()
  const wallet = await db
    .collection("wallets")
    .findOne({ user_id: session.user.id })

  return NextResponse.json({ balance: wallet?.balance ?? 0 })
}
