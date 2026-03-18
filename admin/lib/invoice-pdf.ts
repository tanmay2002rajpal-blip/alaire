import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import QRCode from "qrcode"
import bwipjs from "bwip-js"

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

export interface InvoiceData {
  id: string
  order_number: string
  created_at: string
  subtotal: number
  discount_amount: number
  shipping_cost: number
  wallet_amount_used: number
  total: number
  payment_method: string
  status: string
  shipping_address: ShippingAddress
  customer_email: string
  items: OrderItem[]
}

const M = 16 // margin

function price(n: number) {
  return "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

// ── Main export ──────────────────────────────────────────────────────────────
export async function generateInvoicePDF(order: InvoiceData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pw = doc.internal.pageSize.getWidth() // 210
  const ph = doc.internal.pageSize.getHeight() // 297
  const cw = pw - M * 2 // content width 178

  let y = M

  // ────────────────────────────────────────────────────────────────────────────
  // HEADER
  // ────────────────────────────────────────────────────────────────────────────
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, pw, 32, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255)
  doc.text("ALAIRE", M, 14)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(180, 180, 180)
  doc.text("Premium Fashion & Lifestyle", M, 20)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text("TAX INVOICE", pw - M, 14, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(180, 180, 180)
  doc.text(`# ${order.order_number}`, pw - M, 21, { align: "right" })

  y = 40

  // ────────────────────────────────────────────────────────────────────────────
  // ORDER META ROW
  // ────────────────────────────────────────────────────────────────────────────
  doc.setFillColor(247, 247, 247)
  doc.rect(M, y, cw, 14, "F")

  const metaY = y + 5
  const col1 = M + 4
  const col2 = M + 50
  const col3 = M + 100

  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(120, 120, 120)
  doc.text("INVOICE DATE", col1, metaY)
  doc.text("PAYMENT METHOD", col2, metaY)
  doc.text("ORDER STATUS", col3, metaY)

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30, 30, 30)
  doc.text(fmtDate(order.created_at), col1, metaY + 6)
  doc.text(order.payment_method === "cod" ? "Cash on Delivery" : "Prepaid (Online)", col2, metaY + 6)

  const statusLabel = order.status.charAt(0).toUpperCase() + order.status.slice(1)
  doc.text(statusLabel, col3, metaY + 6)

  // QR code in the meta row area (right)
  try {
    const qrUrl = await QRCode.toDataURL(
      `https://alaire.in/orders/${order.id}`,
      { width: 160, margin: 0 }
    )
    doc.addImage(qrUrl, "PNG", pw - M - 14, y + 1, 12, 12)
  } catch { /* silent */ }

  y += 22

  // ────────────────────────────────────────────────────────────────────────────
  // ADDRESSES – two columns with a vertical separator
  // ────────────────────────────────────────────────────────────────────────────
  const addrTop = y
  const midX = pw / 2

  // Left – Sold By
  label(doc, "SOLD BY", M, y)
  y += 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("Alaire Fashion Pvt. Ltd.", M, y)
  y += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text("123, Fashion Street, Bandra West", M, y); y += 4
  doc.text("Mumbai, Maharashtra - 400050", M, y); y += 4
  doc.text("GSTIN: 27AABCA1234B1ZD", M, y); y += 4
  doc.text("PAN: AABCA1234B", M, y); y += 4
  doc.text("Phone: +91 98765 43210", M, y)

  // Right – Ship To
  let ry = addrTop
  const rx = midX + 6
  label(doc, "BILL TO / SHIP TO", rx, ry)
  ry += 6
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text(order.shipping_address.full_name, rx, ry)
  ry += 5
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text(order.shipping_address.line1, rx, ry); ry += 4
  if (order.shipping_address.line2) {
    doc.text(order.shipping_address.line2, rx, ry); ry += 4
  }
  doc.text(
    `${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}`,
    rx, ry
  ); ry += 4
  doc.text(`Phone: ${order.shipping_address.phone}`, rx, ry); ry += 4
  if (order.customer_email) {
    doc.text(order.customer_email, rx, ry)
  }

  // Vertical separator
  const addrBottom = Math.max(y, ry) + 2
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(midX, addrTop - 2, midX, addrBottom)

  y = addrBottom + 6

  // Horizontal rule
  doc.setDrawColor(220, 220, 220)
  doc.line(M, y, pw - M, y)
  y += 6

  // ────────────────────────────────────────────────────────────────────────────
  // ITEMS TABLE
  // ────────────────────────────────────────────────────────────────────────────
  const tableBody = order.items.map((item, i) => [
    String(i + 1),
    item.product_name + (item.variant_name ? `  (${item.variant_name})` : ""),
    String(item.quantity),
    price(item.price_at_purchase),
    price(item.price_at_purchase * item.quantity),
  ])

  autoTable(doc, {
    startY: y,
    head: [["#", "Product Description", "Qty", "Unit Price", "Amount"]],
    body: tableBody,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 5,
      textColor: [30, 30, 30],
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 20, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 34, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10

  // ────────────────────────────────────────────────────────────────────────────
  // SUMMARY TABLE (right side, using autoTable for clean alignment)
  // ────────────────────────────────────────────────────────────────────────────
  const summaryRows: string[][] = []
  summaryRows.push(["Subtotal", price(order.subtotal)])
  if (order.discount_amount > 0) {
    summaryRows.push(["Discount", "- " + price(order.discount_amount)])
  }
  if (order.wallet_amount_used > 0) {
    summaryRows.push(["Wallet Applied", "- " + price(order.wallet_amount_used)])
  }
  summaryRows.push(["Shipping", order.shipping_cost > 0 ? price(order.shipping_cost) : "FREE"])

  const summaryStartX = pw - M - 80

  autoTable(doc, {
    startY: y,
    body: summaryRows,
    theme: "plain",
    tableWidth: 80,
    margin: { left: summaryStartX },
    styles: {
      fontSize: 9,
      cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
      textColor: [80, 80, 80],
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "normal" },
      1: { cellWidth: 40, halign: "right" },
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sY = (doc as any).lastAutoTable.finalY + 2

  // Total line with emphasis
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.5)
  doc.line(summaryStartX, sY, pw - M, sY)
  sY += 7

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(10, 10, 10)
  doc.text("GRAND TOTAL", summaryStartX + 4, sY)
  doc.text(price(order.total), pw - M - 4, sY, { align: "right" })
  sY += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text("(Inclusive of all taxes)", summaryStartX + 4, sY)

  // ────────────────────────────────────────────────────────────────────────────
  // AMOUNT IN WORDS (left side, same vertical area as summary)
  // ────────────────────────────────────────────────────────────────────────────
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(140, 140, 140)
  doc.text("AMOUNT IN WORDS", M, y)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  const words = numberToWords(order.total) + " Only"
  doc.text(words, M, y + 6, { maxWidth: summaryStartX - M - 10 })

  // Tax breakup
  const taxTotal = Math.round((order.subtotal / 1.18) * 100) / 100
  const gstAmt = Math.round((order.subtotal - taxTotal) * 100) / 100

  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(140, 140, 140)
  doc.text("Tax Breakup (GST @18%):", M, y + 16)
  doc.text(`Taxable: ${price(taxTotal)}  |  CGST @9%: ${price(gstAmt / 2)}  |  SGST @9%: ${price(gstAmt / 2)}`, M, y + 21)

  // ────────────────────────────────────────────────────────────────────────────
  // BARCODE (centered)
  // ────────────────────────────────────────────────────────────────────────────
  sY += 12
  try {
    const buf = await bwipjs.toBuffer({
      bcid: "code128",
      text: order.order_number,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
      textsize: 9,
    })
    const b64 = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`
    doc.addImage(b64, "PNG", pw / 2 - 25, sY, 50, 14)
  } catch { /* silent */ }

  // ────────────────────────────────────────────────────────────────────────────
  // FOOTER (always at bottom of page)
  // ────────────────────────────────────────────────────────────────────────────
  const fY = ph - 22

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(M, fY - 8, pw - M, fY - 8)

  // Authorized signatory (right)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(30, 30, 30)
  doc.text("For Alaire Fashion Pvt. Ltd.", pw - M, fY - 2, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text("Authorized Signatory", pw - M, fY + 3, { align: "right" })

  // Contact info (left)
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text("Thank you for shopping with Alaire!", M, fY - 2)
  doc.text("support@alaire.in  |  www.alaire.in  |  +91 98765 43210", M, fY + 3)
  doc.text("This is a computer-generated invoice. No signature required.", M, fY + 8)

  return doc
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function label(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(text, x, y)
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees"
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ]
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]
  const convert = (n: number): string => {
    if (n < 20) return ones[n]
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "")
    if (n < 1000) return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "")
    if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "")
    if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "")
    return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + convert(n % 10000000) : "")
  }
  const rupees = Math.floor(num)
  const paise = Math.round((num - rupees) * 100)
  let result = "Rupees " + convert(rupees)
  if (paise > 0) result += " and " + convert(paise) + " Paise"
  return result
}
