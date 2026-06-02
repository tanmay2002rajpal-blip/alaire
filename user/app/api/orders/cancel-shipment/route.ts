import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/db/client"
import { fshipClient } from "@/lib/fship/client"

export async function POST(request: Request) {
  try {
    const adminSecret = request.headers.get("X-Admin-Secret")
    if (!adminSecret || adminSecret !== process.env.ADMIN_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    const db = await getDb()
    const order = await db.collection("orders").findOne(
      { _id: new ObjectId(orderId) },
      { projection: { awb_number: 1, pickup_token: 1, status: 1 } }
    )

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const results: { pickupCancelled?: boolean; pickupError?: string } = {}

    if (order.awb_number) {
      try {
        const cancelResult = await fshipClient.cancelOrder(order.awb_number)
        if (cancelResult.status) {
          results.pickupCancelled = true
        } else {
          results.pickupCancelled = false
          results.pickupError = cancelResult.response || "Unknown error"
        }
      } catch (err) {
        results.pickupCancelled = false
        results.pickupError = err instanceof Error ? err.message : "Cancel shipment failed"
      }
    } else {
      results.pickupCancelled = false
      results.pickupError = "No AWB number stored for this order"
    }

    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          shipment_cancelled: true,
          shipment_cancelled_at: new Date(),
          updated_at: new Date(),
        },
      }
    )

    return NextResponse.json({ success: true, ...results })
  } catch (error) {
    console.error("Cancel shipment error:", error)
    return NextResponse.json(
      { error: "Failed to cancel shipment" },
      { status: 500 }
    )
  }
}
