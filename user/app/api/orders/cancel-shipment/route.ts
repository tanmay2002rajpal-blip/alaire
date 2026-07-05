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

    const results: {
      pickupCancelled?: boolean
      pickupError?: string
      shipment_cancel_failed?: string
    } = {}

    if (order.awb_number) {
      try {
        const cancelResult = await fshipClient.cancelOrder(order.awb_number)
        // Only treat the shipment as cancelled when FShip explicitly confirms it.
        if (cancelResult.status === true) {
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

    // Persist the real outcome. Item 9: set shipment_cancelled=true ONLY when the
    // courier confirmed cancellation; otherwise record shipment_cancel_failed and
    // surface it in the response so admin can see the partial failure.
    const setFields: Record<string, unknown> = { updated_at: new Date() }
    if (results.pickupCancelled) {
      setFields.shipment_cancelled = true
      setFields.shipment_cancelled_at = new Date()
      setFields.shipment_cancel_failed = null
    } else {
      const failMsg = results.pickupError || "Shipment cancellation failed"
      setFields.shipment_cancel_failed = failMsg
      results.shipment_cancel_failed = failMsg
    }

    await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { $set: setFields }
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
