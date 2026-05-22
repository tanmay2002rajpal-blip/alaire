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

function hLine(doc: jsPDF, x: number, y: number, w: number, thick = false) {
  doc.setDrawColor(0)
  doc.setLineWidth(thick ? 0.6 : 0.2)
  doc.line(x, y, x + w, y)
}

function dashedLine(doc: jsPDF, x1: number, y1: number, x2: number) {
  doc.setDrawColor(150)
  doc.setLineWidth(0.15)
  const dashLen = 1.5
  const gap = 1.2
  let cx = x1
  while (cx < x2) {
    const end = Math.min(cx + dashLen, x2)
    doc.line(cx, y1, end, y1)
    cx = end + gap
  }
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

  // ── Outer border ──────────────────────────────────────────────────────
  doc.setDrawColor(0)
  doc.setLineWidth(1)
  doc.rect(ox, oy, lw, lh)

  let y = oy + M

  // ═══════════════════════════════════════════════════════════════════════
  // TOP BAR — Brand + Order Number + Date
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFillColor(0, 0, 0)
  doc.rect(ox + 1, y, lw - 2, 10, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(255)
  doc.text("ALAIRE", ox + M + 1, y + 7)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text(order.order_number, ox + lw - M - 1, y + 4.5, { align: "right" })
  doc.setFontSize(6)
  doc.text(fmtDate(order.created_at), ox + lw - M - 1, y + 8, { align: "right" })

  y += 13

  // ═══════════════════════════════════════════════════════════════════════
  // PAYMENT BADGE + TRACKING ID ROW
  // ═══════════════════════════════════════════════════════════════════════
  const isCod = order.payment_method === "cod"
  const badgeText = isCod ? `COD  ₹${order.total.toLocaleString("en-IN")}` : "PREPAID"
  doc.setFillColor(isCod ? 220 : 22, isCod ? 38 : 163, isCod ? 38 : 74)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  const bw = doc.getTextWidth(badgeText) + 8
  doc.roundedRect(ox + M, y - 3, bw, 7, 1, 1, "F")
  doc.setTextColor(255)
  doc.text(badgeText, ox + M + 4, y + 1.5)

  if (order.awb_number) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(0)
    doc.text(`AWB: ${order.awb_number}`, ox + lw - M, y + 1.5, { align: "right" })
  }

  y += 8
  hLine(doc, ox + M, y, iw, true)
  y += 4

  // ═══════════════════════════════════════════════════════════════════════
  // FROM (Sender) — compact
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6)
  doc.setTextColor(120)
  doc.text("FROM / SHIP BY", ox + M, y)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(0)
  doc.text("LPR HOSIERY", ox + M + 25, y)
  y += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6.5)
  doc.setTextColor(60)
  doc.text("Plot 170-p, Gali 8, Shiv Colony, Hisar, Haryana 125001  |  Ph: 9671030886", ox + M, y, { maxWidth: iw })
  y += 5

  hLine(doc, ox + M, y, iw)
  y += 4

  // ═══════════════════════════════════════════════════════════════════════
  // TO (Recipient) — prominent
  // ═══════════════════════════════════════════════════════════════════════
  doc.setFont("helvetica", "bold")
  doc.setFontSize(6)
  doc.setTextColor(120)
  doc.text("SHIP TO", ox + M, y)
  y += 4

  const addr = order.shipping_address

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text(addr.full_name.toUpperCase(), ox + M, y, { maxWidth: iw - 25 })
  y += 5.5

  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  doc.setTextColor(20)

  const addrLines: string[] = [addr.line1]
  if (addr.line2) addrLines.push(addr.line2)
  addrLines.push(`${addr.city}, ${addr.state}`)

  for (const line of addrLines) {
    const split = doc.splitTextToSize(line, iw)
    doc.text(split, ox + M, y)
    y += split.length * 4
  }

  // Pincode — big and bold, right-aligned
  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(0)
  doc.text(addr.pincode, ox + lw - M, y + 2, { align: "right" })

  // Phone next to address
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(40)
  doc.text(`Ph: ${addr.phone}`, ox + M, y + 2)
  y += 10

  hLine(doc, ox + M, y, iw, true)
  y += 4

  // ═══════════════════════════════════════════════════════════════════════
  // TRACKING NUMBER — extra large, centered
  // ═══════════════════════════════════════════════════════════════════════
  if (order.awb_number) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)
    doc.setTextColor(120)
    doc.text("TRACKING NUMBER", ox + lw / 2, y, { align: "center" })
    y += 5

    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(0)
    doc.text(order.awb_number, ox + lw / 2, y, { align: "center", maxWidth: iw })
    y += 8

    if (order.courier_name) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(80)
      doc.text(`via ${order.courier_name}`, ox + lw / 2, y, { align: "center" })
      y += 5
    }

    dashedLine(doc, ox + M, y, ox + lw - M)
    y += 4
  } else if (order.courier_name) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)
    doc.setTextColor(120)
    doc.text("COURIER", ox + M, y)
    y += 4
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(0)
    doc.text(order.courier_name, ox + M, y)
    y += 6
    dashedLine(doc, ox + M, y, ox + lw - M)
    y += 4
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ORDER ITEMS — compact list
  // ═══════════════════════════════════════════════════════════════════════
  const remainingH = (oy + lh - 12) - y
  if (order.items.length > 0 && remainingH > 15) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(6)
    doc.setTextColor(120)
    doc.text("ITEMS", ox + M, y)
    doc.text("QTY", ox + lw - M, y, { align: "right" })
    y += 3.5

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(30)

    const maxItems = size === "4x4" ? 3 : 6
    const itemsToShow = order.items.slice(0, maxItems)

    for (const item of itemsToShow) {
      if (y > oy + lh - 16) break
      const name = item.variant_name
        ? `${item.product_name} (${item.variant_name})`
        : item.product_name
      const truncated = name.length > 45 ? name.substring(0, 42) + "..." : name
      doc.text(truncated, ox + M, y)
      doc.text(`×${item.quantity}`, ox + lw - M, y, { align: "right" })
      y += 3.5
    }

    if (order.items.length > maxItems) {
      doc.setTextColor(100)
      doc.text(`+ ${order.items.length - maxItems} more item(s)`, ox + M, y)
      y += 3.5
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // FOOTER — Weight + Brand
  // ═══════════════════════════════════════════════════════════════════════
  const fy = oy + lh - 9
  hLine(doc, ox + M, fy - 2, iw)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.setTextColor(100)
  doc.text("Wt: 0.5 KG", ox + M, fy + 2)
  doc.text("alaire.in", ox + lw / 2, fy + 2, { align: "center" })

  const isCodFooter = order.payment_method === "cod"
  if (isCodFooter) {
    doc.setFont("helvetica", "bold")
    doc.setTextColor(220, 38, 38)
    doc.text(`COLLECT: ₹${order.total.toLocaleString("en-IN")}`, ox + lw - M, fy + 2, { align: "right" })
  } else {
    doc.setTextColor(22, 163, 74)
    doc.setFont("helvetica", "bold")
    doc.text("PAID", ox + lw - M, fy + 2, { align: "right" })
  }

  return doc
}
