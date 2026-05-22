import { jsPDF } from "jspdf"

export interface OrderItem {
  product_name: string
  variant_name?: string | null
  quantity: number
}

export interface ShippingLabelData {
  order_number: string
  shipping_address: {
    full_name: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
  }
  items: OrderItem[]
  awb_number?: string | null
  courier_name?: string | null
  payment_method: string
  total: number
  created_at: string
}

type LabelSize = "4x6" | "4x4" | "a4"

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function getDimensions(size: LabelSize) {
  switch (size) {
    case "4x6": return { w: 101.6, h: 152.4 }
    case "4x4": return { w: 101.6, h: 101.6 }
    case "a4":  return { w: 210, h: 297 }
  }
}

// Code128B barcode — simplified renderer for digits/uppercase
function drawBarcode(doc: jsPDF, text: string, x: number, y: number, w: number, h: number) {
  doc.setFillColor(0, 0, 0)
  const chars = text.replace(/[^A-Z0-9\-]/gi, "")
  const barCount = chars.length * 6 + 20
  const barW = w / barCount
  let cx = x
  // Pseudo-barcode — alternating pattern seeded from char codes for visual representation
  for (let i = 0; i < barCount; i++) {
    const charIdx = Math.floor(i / 6) % chars.length
    const code = chars.charCodeAt(charIdx) || 65
    const bit = ((code * (i + 1) * 7) % 11) > 4
    if (bit) {
      doc.rect(cx, y, barW * 0.9, h, "F")
    }
    cx += barW
  }
  // Text below barcode
  doc.setFont("courier", "normal")
  doc.setFontSize(6)
  doc.setTextColor(0)
  doc.text(text, x + w / 2, y + h + 3, { align: "center" })
}

export function generateShippingLabel(
  order: ShippingLabelData,
  size: LabelSize = "4x6"
): jsPDF {
  const dim = getDimensions(size)
  const doc = new jsPDF({ unit: "mm", format: [dim.w, dim.h] })

  const isA4 = size === "a4"
  const lw = isA4 ? 101.6 : dim.w
  const lh = isA4 ? 152.4 : dim.h
  const ox = isA4 ? (dim.w - lw) / 2 : 0
  const oy = isA4 ? (dim.h - lh) / 2 : 0

  const M = 5
  const iw = lw - M * 2
  const midX = ox + lw / 2

  // ── Outer border ──────────────────────────────────────────────────────
  doc.setDrawColor(0)
  doc.setLineWidth(0.4)
  doc.rect(ox + 0.5, oy + 0.5, lw - 1, lh - 1)

  let y = oy + M

  // ═══════════════════════════════════════════════════════════════════════
  // ROW 1: Barcode (left) + Brand (right)
  // ═══════════════════════════════════════════════════════════════════════
  const barcodeText = order.awb_number || order.order_number
  drawBarcode(doc, barcodeText, ox + M, y, 38, 10)

  // Brand — ALAIRE top-right
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(0)
  doc.text("ALAIRE", ox + lw - M, y + 6, { align: "right" })

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(100)
  doc.text("www.alaire.in", ox + lw - M, y + 10, { align: "right" })

  y += 17

  // Thin line
  doc.setDrawColor(200)
  doc.setLineWidth(0.15)
  doc.line(ox + M, y, ox + lw - M, y)
  y += 4

  // ═══════════════════════════════════════════════════════════════════════
  // ROW 2: SHIP DATE + Packing Slip (two columns)
  // ═══════════════════════════════════════════════════════════════════════
  const colL = ox + M
  const colR = midX + 2

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(0)
  doc.text("SHIP DATE", colL, y)
  doc.text("Packing slip " + order.order_number, colR, y)
  y += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(40)
  doc.text(fmtDate(order.created_at), colL, y)

  // Payment badge on right
  const isCod = order.payment_method === "cod"
  if (isCod) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(200, 30, 30)
    doc.text(`COD: Rs.${order.total.toLocaleString("en-IN")}`, ox + lw - M, y, { align: "right" })
  } else {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(22, 140, 60)
    doc.text("PREPAID", ox + lw - M, y, { align: "right" })
  }

  y += 6

  // Thin line
  doc.setDrawColor(200)
  doc.line(ox + M, y, ox + lw - M, y)
  y += 5

  // ═══════════════════════════════════════════════════════════════════════
  // ROW 3: SHIP TO (left) + RETURN ADDRESS (right)
  // ═══════════════════════════════════════════════════════════════════════
  const addr = order.shipping_address
  const halfW = iw / 2 - 2

  // Left column — SHIP TO
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(0)
  doc.text("SHIP TO", colL, y)

  // Right column — RETURN ADDRESS
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(0)
  doc.text("RETURN ADDRESS", colR, y)
  y += 4.5

  // Ship To content
  let ly = y
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(20)
  doc.text(addr.full_name, colL, ly, { maxWidth: halfW })
  ly += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(40)

  const shipLines = [addr.line1]
  if (addr.line2) shipLines.push(addr.line2)
  shipLines.push(`${addr.city}, ${addr.state} ${addr.pincode}`)
  shipLines.push(`Ph: ${addr.phone}`)

  for (const line of shipLines) {
    const split = doc.splitTextToSize(line, halfW)
    doc.text(split, colL, ly)
    ly += split.length * 3.5
  }

  // Return Address content
  let ry = y
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(20)
  doc.text("LPR Hosiery (Alaire)", colR, ry, { maxWidth: halfW })
  ry += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(40)

  const returnLines = [
    "Plot 170-p, Gali 8",
    "Shiv Colony, Hisar",
    "Haryana 125001",
    "Ph: 9671030886",
  ]

  for (const line of returnLines) {
    doc.text(line, colR, ry, { maxWidth: halfW })
    ry += 3.5
  }

  y = Math.max(ly, ry) + 3

  // Thin line
  doc.setDrawColor(200)
  doc.line(ox + M, y, ox + lw - M, y)
  y += 4

  // ═══════════════════════════════════════════════════════════════════════
  // ROW 4: Courier + Tracking
  // ═══════════════════════════════════════════════════════════════════════
  if (order.awb_number || order.courier_name) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(100)

    if (order.courier_name) {
      doc.text(`Courier: ${order.courier_name}`, colL, y)
    }

    if (order.awb_number) {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0)
      doc.text(`AWB: ${order.awb_number}`, ox + lw - M, y, { align: "right" })
    }

    y += 5

    doc.setDrawColor(200)
    doc.line(ox + M, y, ox + lw - M, y)
    y += 4
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ROW 5: Order details line
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.setTextColor(80)
  doc.text(`Your order of ${fmtDate(order.created_at)}`, colL, y)
  doc.text(`Order ID: ${order.order_number}`, ox + lw - M, y, { align: "right" })
  y += 4

  // ═══════════════════════════════════════════════════════════════════════
  // ROW 6: Items table — Product | Qty
  // ═══════════════════════════════════════════════════════════════════════
  // Table header
  doc.setDrawColor(0)
  doc.setLineWidth(0.3)
  doc.line(ox + M, y, ox + lw - M, y)
  y += 3.5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(0)
  doc.text("Product", colL, y)
  doc.text("Qty", ox + lw - M, y, { align: "right" })
  y += 3

  doc.setDrawColor(0)
  doc.setLineWidth(0.15)
  doc.line(ox + M, y, ox + lw - M, y)
  y += 3.5

  // Table rows
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(30)

  const maxY = oy + lh - 15
  const maxItems = size === "4x4" ? 3 : 8

  for (let i = 0; i < Math.min(order.items.length, maxItems); i++) {
    if (y > maxY) break
    const item = order.items[i]
    const name = item.variant_name
      ? `${item.product_name} - ${item.variant_name}`
      : item.product_name
    const maxNameW = iw - 12
    const truncated = doc.getTextWidth(name) > maxNameW
      ? name.substring(0, Math.floor(maxNameW / doc.getTextWidth("A") * name.length / doc.getTextWidth(name))) + "..."
      : name
    doc.text(truncated, colL, y, { maxWidth: maxNameW })
    doc.text(String(item.quantity), ox + lw - M, y, { align: "right" })
    y += 4
  }

  if (order.items.length > maxItems) {
    doc.setTextColor(100)
    doc.setFontSize(6)
    doc.text(`+ ${order.items.length - maxItems} more item(s)`, colL, y)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════
  const fy = oy + lh - 7
  doc.setDrawColor(200)
  doc.setLineWidth(0.15)
  doc.line(ox + M, fy - 2, ox + lw - M, fy - 2)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(5.5)
  doc.setTextColor(140)
  doc.text("alaireinnerwear@gmail.com  |  alaire.in", ox + lw / 2, fy + 1, { align: "center" })

  return doc
}
