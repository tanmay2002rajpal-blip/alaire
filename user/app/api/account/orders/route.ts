import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getUserOrders } from "@/lib/db/queries/orders"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    let searchIds = [userId]

    const orders = await getUserOrders(searchIds)
    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json({ orders: [] })
  }
}
