import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { generateInvoicePDF } from "@/lib/invoice-pdf"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDb()

    const order = await db.collection("orders").findOne({
      _id: new ObjectId(orderId),
      user_id: new ObjectId(session.user.id),
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (!["paid", "confirmed", "processing", "shipped", "delivered"].includes(order.status)) {
      return NextResponse.json(
        { error: "Invoice not available for pending orders" },
        { status: 400 }
      )
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
      customer_email: order.email ?? session.user.email ?? "",
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
