import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const db = await getDb()
    const oid = new ObjectId(orderId)

    const order = await db.collection("orders").findOne({
      _id: oid,
      status: "pending",
      user_id: new ObjectId(session.user.id),
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found or not pending" }, { status: 404 })
    }

    await db.collection("order_items").deleteMany({ order_id: oid })
    await db.collection("order_status_history").deleteMany({ order_id: oid })
    await db.collection("orders").deleteOne({ _id: oid })

    if (order.discount_code_id) {
      await db.collection("coupons").updateOne(
        { _id: new ObjectId(order.discount_code_id) },
        { $inc: { usage_count: -1 } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel pending order error:", error)
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
  }
}
