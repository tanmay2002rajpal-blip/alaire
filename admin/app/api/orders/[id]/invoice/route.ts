import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getCurrentAdmin } from "@/lib/auth/actions"
import { getDb } from "@/lib/db/client"
import { generateInvoicePDF } from "@/lib/invoice-pdf"

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
    const db = await getDb()

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const items = await db
      .collection("order_items")
      .find({ order_id: new ObjectId(orderId) })
      .project({ product_name: 1, variant_name: 1, quantity: 1, price_at_purchase: 1 })
      .toArray()

    const pdf = await generateInvoicePDF({
      id: orderId,
      order_number: order.order_number,
      created_at: order.created_at,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount ?? 0,
      shipping_cost: order.shipping_amount ?? order.shipping_cost ?? 0,
      wallet_amount_used: order.wallet_amount_used ?? 0,
      total: order.total,
      payment_method: order.payment_method,
      status: order.status,
      shipping_address: order.shipping_address as any,
      customer_email: order.email ?? "",
      items: items as any[],
    })

    return new NextResponse(pdf.output("arraybuffer"), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.order_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Invoice generation error:", error)
    return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 })
  }
}
