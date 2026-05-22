import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCurrentAdmin } from "@/lib/auth/actions"
import { getDb } from "@/lib/db/client"
import { generateShippingLabel } from "@/lib/shipping-label-pdf"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: orderId } = await params
    const { searchParams } = new URL(request.url)
    const size = (searchParams.get("size") || "4x6") as "4x6" | "4x4" | "a4"

    if (!["4x6", "4x4", "a4"].includes(size)) {
      return NextResponse.json({ error: "Invalid label size" }, { status: 400 })
    }

    const db = await getDb()
    const oid = new ObjectId(orderId)

    const [order, orderItems] = await Promise.all([
      db.collection("orders").findOne({ _id: oid }),
      db.collection("order_items").find({ order_id: oid }).toArray(),
    ])

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!order.shipping_address) {
      return NextResponse.json({ error: "Order has no shipping address" }, { status: 400 })
    }

    const pdf = generateShippingLabel(
      {
        order_number: order.order_number,
        shipping_address: order.shipping_address,
        items: orderItems.map((item) => ({
          product_name: item.product_name,
          variant_name: item.variant_name,
          quantity: item.quantity,
        })),
        awb_number: order.bluedart_waybill_no || order.awb_number || null,
        courier_name: order.courier_name || null,
        payment_method: order.payment_method || "prepaid",
        total: order.total,
        created_at: order.created_at,
      },
      size
    )

    return new NextResponse(pdf.output("arraybuffer"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Label-${order.order_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Label generation error:", error)
    return NextResponse.json({ error: "Failed to generate shipping label" }, { status: 500 })
  }
}
