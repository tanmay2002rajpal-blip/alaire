import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserOrders } from "@/lib/db/queries/orders"

export async function GET(request: Request) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const userId = session?.user?.id || searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ orders: [] })
    }
    let searchIds = [userId]
    if (userId.includes("@")) {
      const { getDb } = await import("@/lib/db/client")
      const db = await getDb()
      const userDoc = await db.collection("users").findOne({ email: userId })
      if (userDoc) searchIds.push(userDoc._id.toString())
    }

    const orders = await getUserOrders(searchIds)
    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json({ orders: [] })
  }
}
