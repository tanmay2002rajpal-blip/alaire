import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface OrderItem {
  product_name: string
  variant_name: string | null
  quantity: number
  price_at_purchase: number
}

interface ShippingAddress {
  full_name: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  phone: string
}

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
      $expr: { $eq: [{ $toString: "$_id" }, orderId] },
      user_id: session.user.id,
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
      .find({ order_id: orderId })
      .project({
        product_name: 1,
        variant_name: 1,
        quantity: 1,
        price_at_purchase: 1,
      })
      .toArray()

    const pdf = generateInvoicePDF({
      id: orderId,
      order_number: order.order_number,
      created_at: order.created_at,
      subtotal: order.subtotal,
      discount_amount: order.discount_amount ?? 0,
      shipping_cost: order.shipping_amount ?? order.shipping_cost ?? 0,
      wallet_amount_used: order.wallet_amount_used ?? 0,
      total: order.total,
      payment_method: order.payment_method,
      shipping_address: order.shipping_address as ShippingAddress,
      items: items as unknown as OrderItem[],
    })
    const pdfBuffer = pdf.output("arraybuffer")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${order.order_number}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Invoice generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    )
  }
}

function generateInvoicePDF(order: {
  id: string
  order_number: string
  created_at: string
  subtotal: number
  discount_amount: number
  shipping_cost: number
  wallet_amount_used: number
  total: number
  payment_method: string
  shipping_address: ShippingAddress
  items: OrderItem[]
}) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  const primaryColor = "#000000"
  const grayColor = "#666666"

  doc.setFontSize(28)
  doc.setFont("helvetica", "bold")
  doc.text("ALAIRE", pageWidth / 2, 25, { align: "center" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(grayColor)
  doc.text("Premium Fashion & Lifestyle", pageWidth / 2, 32, { align: "center" })

  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryColor)
  doc.text("TAX INVOICE", pageWidth / 2, 50, { align: "center" })

  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(14, 58, pageWidth - 28, 25, 2, 2, "F")

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(grayColor)
  doc.text("Invoice Number:", 20, 67)
  doc.text("Order Date:", 20, 75)
  doc.text("Payment Method:", pageWidth / 2 + 10, 67)
  doc.text("Order Status:", pageWidth / 2 + 10, 75)

  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryColor)
  doc.text(order.order_number, 55, 67)
  doc.text(formatDate(order.created_at), 50, 75)
  doc.text(order.payment_method === "cod" ? "Cash on Delivery" : "Prepaid (Online)", pageWidth / 2 + 55, 67)
  doc.text("Confirmed", pageWidth / 2 + 45, 75)

  const address = order.shipping_address
  let yPos = 95

  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text("Bill To / Ship To:", 14, yPos)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(grayColor)
  yPos += 8
  doc.text(address.full_name, 14, yPos)
  yPos += 5
  doc.text(address.line1, 14, yPos)
  if (address.line2) {
    yPos += 5
    doc.text(address.line2, 14, yPos)
  }
  yPos += 5
  doc.text(`${address.city}, ${address.state} - ${address.pincode}`, 14, yPos)
  yPos += 5
  doc.text(`Phone: ${address.phone}`, 14, yPos)

  doc.setTextColor(primaryColor)
  doc.setFont("helvetica", "bold")
  doc.text("Sold By:", pageWidth - 14, 95, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setTextColor(grayColor)
  doc.text("Alaire Fashion Pvt. Ltd.", pageWidth - 14, 103, { align: "right" })
  doc.text("123, Fashion Street", pageWidth - 14, 108, { align: "right" })
  doc.text("Mumbai, Maharashtra - 400001", pageWidth - 14, 113, { align: "right" })
  doc.text("GSTIN: 27AABCA1234B1ZD", pageWidth - 14, 118, { align: "right" })

  yPos = 135

  const tableData = order.items.map((item, index) => [
    (index + 1).toString(),
    item.product_name + (item.variant_name ? `\n(${item.variant_name})` : ""),
    item.quantity.toString(),
    formatPrice(item.price_at_purchase),
    formatPrice(item.price_at_purchase * item.quantity),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [["#", "Description", "Qty", "Unit Price", "Amount"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 80 },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 35, halign: "right" },
      4: { cellWidth: 35, halign: "right" },
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 10

  const summaryX = pageWidth - 90
  let summaryY = finalY

  doc.setFillColor(250, 250, 250)
  doc.roundedRect(summaryX - 5, summaryY - 5, 85, 60, 2, 2, "F")

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(grayColor)

  doc.text("Subtotal:", summaryX, summaryY)
  doc.text(formatPrice(order.subtotal), pageWidth - 20, summaryY, { align: "right" })
  summaryY += 8

  if (order.discount_amount > 0) {
    doc.setTextColor(34, 197, 94)
    doc.text("Discount:", summaryX, summaryY)
    doc.text(`-${formatPrice(order.discount_amount)}`, pageWidth - 20, summaryY, { align: "right" })
    summaryY += 8
  }

  if (order.wallet_amount_used > 0) {
    doc.setTextColor(34, 197, 94)
    doc.text("Wallet Applied:", summaryX, summaryY)
    doc.text(`-${formatPrice(order.wallet_amount_used)}`, pageWidth - 20, summaryY, { align: "right" })
    summaryY += 8
  }

  doc.setTextColor(grayColor)
  doc.text("Shipping:", summaryX, summaryY)
  doc.text(order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "FREE", pageWidth - 20, summaryY, { align: "right" })
  summaryY += 10

  doc.setDrawColor(0)
  doc.line(summaryX, summaryY - 2, pageWidth - 15, summaryY - 2)
  summaryY += 5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(primaryColor)
  doc.text("Total:", summaryX, summaryY)
  doc.text(formatPrice(order.total), pageWidth - 20, summaryY, { align: "right" })

  const footerY = doc.internal.pageSize.getHeight() - 30

  doc.setDrawColor(200, 200, 200)
  doc.line(14, footerY - 10, pageWidth - 14, footerY - 10)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(grayColor)
  doc.text("Thank you for shopping with Alaire!", pageWidth / 2, footerY, { align: "center" })
  doc.text("For any queries, contact us at support@alaire.in | www.alaire.in", pageWidth / 2, footerY + 5, { align: "center" })
  doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, footerY + 10, { align: "center" })

  return doc
}

function formatPrice(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN")}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
