import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, reason, details } = body

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Order ID and reason are required" },
        { status: 400 }
      )
    }

    const db = await getDb()

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
      user_id: new ObjectId(session.user.id),
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "Return requests can only be made for delivered orders" },
        { status: 400 }
      )
    }

    // Check return window (7 days from delivery)
    const deliveredEntry = await db.collection("order_status_history").findOne(
      { order_id: new ObjectId(orderId), status: "delivered" },
      { sort: { created_at: -1 } }
    )
    const deliveryDate = deliveredEntry
      ? new Date(deliveredEntry.created_at)
      : new Date(order.updated_at)
    const returnWindowEnd = new Date(deliveryDate)
    returnWindowEnd.setDate(returnWindowEnd.getDate() + 7)

    if (new Date() > returnWindowEnd) {
      return NextResponse.json(
        { error: "Return window has expired. Returns are accepted within 7 days of delivery." },
        { status: 400 }
      )
    }

    // Check for existing return request
    const existingRequest = await db.collection("return_requests").findOne({
      order_id: new ObjectId(orderId),
      status: "pending",
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "A return request for this order is already pending" },
        { status: 400 }
      )
    }

    // Create return request
    const result = await db.collection("return_requests").insertOne({
      order_id: new ObjectId(orderId),
      user_id: new ObjectId(session.user.id),
      reason,
      details: details || null,
      status: "pending",
      created_at: new Date(),
    })

    // Create notification
    await db.collection("notifications").insertOne({
      user_id: new ObjectId(session.user.id),
      title: "Return Request Submitted",
      message: `Your return request for order ${order.order_number} has been submitted. Our team will contact you within 24-48 hours.`,
      type: "order",
      link: `/account/orders/${orderId}`,
      read: false,
      created_at: new Date(),
    })

    // Add to order status history
    await db.collection("order_status_history").insertOne({
      order_id: new ObjectId(orderId),
      status: "return_requested",
      note: `Return requested: ${reason}. ${details || ""}`,
      created_at: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: "Return request submitted successfully",
      requestId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("Return request error:", error)
    return NextResponse.json(
      { error: "Failed to submit return request" },
      { status: 500 }
    )
  }
}
