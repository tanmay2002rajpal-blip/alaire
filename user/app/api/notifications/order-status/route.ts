/**
 * @fileoverview Order status notification email API.
 * Called by admin panel to send status change emails.
 */

import { NextRequest, NextResponse } from "next/server"
import {
  sendOrderProcessingEmail,
  sendOrderCancelledEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderRefundEmail,
} from "@/lib/emails/order-status"

export async function POST(request: NextRequest) {
  try {
    // Verify admin secret - MUST be set via environment variable
    const expectedSecret = process.env.ADMIN_API_SECRET
    if (!expectedSecret) {
      console.error("ADMIN_API_SECRET environment variable is not configured")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const adminSecret = request.headers.get("X-Admin-Secret")
    if (adminSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      orderNumber,
      customerName,
      customerEmail,
      trackingNumber,
      courierName,
      estimatedDelivery,
      refundAmount,
    } = body

    if (!status || !orderNumber || !customerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let success = false

    switch (status) {
      case "processing":
        success = await sendOrderProcessingEmail({
          status: "processing",
          orderNumber,
          customerName,
          customerEmail,
        })
        break

      case "shipped":
        success = await sendOrderShippedEmail({
          status: "shipped",
          orderNumber,
          customerName,
          customerEmail,
          trackingNumber,
          courierName,
          estimatedDelivery,
        })
        break

      case "delivered":
        success = await sendOrderDeliveredEmail({
          status: "delivered",
          orderNumber,
          customerName,
          customerEmail,
        })
        break

      case "cancelled":
        success = await sendOrderCancelledEmail({
          status: "cancelled",
          orderNumber,
          customerName,
          customerEmail,
        })
        break

      case "refunded":
        success = await sendOrderRefundEmail({
          status: "refunded",
          orderNumber,
          customerName,
          customerEmail,
          refundAmount,
        })
        break

      default:
        // No email for other statuses
        success = true
    }

    return NextResponse.json({ success })
  } catch (error) {
    console.error("Order status notification error:", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}
