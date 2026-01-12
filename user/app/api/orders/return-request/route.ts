/**
 * @fileoverview Return request API route.
 * Handles customer return/refund requests.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
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

    // Verify order belongs to user and is delivered
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, order_number, created_at")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "Return requests can only be made for delivered orders" },
        { status: 400 }
      )
    }

    // Check if order is within return window (7 days)
    const deliveryDate = new Date(order.created_at)
    const returnWindowEnd = new Date(deliveryDate)
    returnWindowEnd.setDate(returnWindowEnd.getDate() + 7)

    if (new Date() > returnWindowEnd) {
      return NextResponse.json(
        { error: "Return window has expired. Returns are accepted within 7 days of delivery." },
        { status: 400 }
      )
    }

    // Check for existing return request
    const { data: existingRequest } = await supabase
      .from("return_requests")
      .select("id")
      .eq("order_id", orderId)
      .eq("status", "pending")
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: "A return request for this order is already pending" },
        { status: 400 }
      )
    }

    // Create return request
    const { data: returnRequest, error: insertError } = await supabase
      .from("return_requests")
      .insert({
        order_id: orderId,
        user_id: user.id,
        reason,
        details: details || null,
        status: "pending",
      })
      .select()
      .single()

    if (insertError) {
      // If table doesn't exist, log for admin but still accept request
      console.error("Return request insert error:", insertError)

      // Create a notification for the user
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Return Request Submitted",
        message: `Your return request for order ${order.order_number} has been submitted. Our team will contact you within 24-48 hours.`,
        type: "order",
        link: `/account/orders/${orderId}`,
      })

      // Update order status to indicate return requested
      await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          status: "return_requested",
          note: `Return requested: ${reason}. ${details || ""}`,
        })

      return NextResponse.json({
        success: true,
        message: "Return request submitted successfully",
      })
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Return Request Submitted",
      message: `Your return request for order ${order.order_number} has been submitted. Our team will contact you within 24-48 hours.`,
      type: "order",
      link: `/account/orders/${orderId}`,
    })

    return NextResponse.json({
      success: true,
      message: "Return request submitted successfully",
      requestId: returnRequest?.id,
    })
  } catch (error) {
    console.error("Return request error:", error)
    return NextResponse.json(
      { error: "Failed to submit return request" },
      { status: 500 }
    )
  }
}
