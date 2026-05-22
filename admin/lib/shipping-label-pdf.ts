import { jsPDF } from "jspdf"

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

// ── Dimensions (mm) for each label size ─────────────────────────────────────
function getDimensions(size: LabelSize) {
  switch (size) {
    case "4x6":
      return { w: 101.6, h: 152.4 } // 4×6 inches
    case "4x4":
      return { w: 101.6, h: 101.6 } // 4×4 inches
    case "a4":
      return { w: 210, h: 297 }     // A4
  }
}

// ── Main export ─────────────────────────────────────────────────────────────
export function generateShippingLabel(
  order: ShippingLabelData,
  size: LabelSize = "4x6"
): jsPDF {
  const dim = getDimensions(size)
  const doc = new jsPDF({ unit: "mm", format: [dim.w, dim.h] })

  // For A4, we center a 4×6-sized label on the page
  const isA4 = size === "a4"
  const labelW = isA4 ? 101.6 : dim.w
  const labelH = isA4 ? 152.4 : dim.h
  const ox = isA4 ? (dim.w - labelW) / 2 : 0 // offset x
  const oy = isA4 ? (dim.h - labelH) / 2 : 0 // offset y

  const M = 6 // margin inside label
  const innerW = labelW - M * 2

  // ── Label border ──────────────────────────────────────────────────────────
  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.8)
  doc.rect(ox, oy, labelW, labelH)

  // Inner border for visual separation
  doc.setLineWidth(0.3)
  doc.rect(ox + 2, oy + 2, labelW - 4, labelH - 4)

  let y = oy + M + 2

  // ── Header: Order Number + Date ───────────────────────────────────────────
  doc.setFillColor(10, 10, 10)
  doc.rect(ox + 3, y - 2, labelW - 6, 12, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text(order.order_number, ox + M + 2, y + 4)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(200, 200, 200)
  doc.text(fmtDate(order.created_at), ox + labelW - M - 2, y + 4, { align: "right" })

  y += 16

  // ── Payment badge ─────────────────────────────────────────────────────────
  const isCod = order.payment_method === "cod"
  const badgeText = isCod
    ? `COD  Rs. ${order.total.toLocaleString("en-IN")}`
    : "PREPAID"

  if (isCod) {
    doc.setFillColor(220, 38, 38) // red
  } else {
    doc.setFillColor(22, 163, 74) // green
  }

  const badgeW = doc.getTextWidth(badgeText) * 1.2 + 8
  doc.roundedRect(ox + M, y - 4, badgeW, 8, 1.5, 1.5, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(badgeText, ox + M + 4, y + 1)

  // Weight on the right
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text("Wt: 0.5 KG", ox + labelW - M, y + 1, { align: "right" })

  y += 10

  // ── Horizontal separator ──────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(ox + M, y, ox + labelW - M, y)
  y += 5

  // ── FROM section ──────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text("FROM", ox + M, y)
  y += 5

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)
  doc.text("LPR Hosiery", ox + M, y)
  y += 4

  doc.setFont("helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(60, 60, 60)
  const fromLines = [
    "Plot 170-p, Gali 8, Shiv Colony",
    "Hisar, Haryana 125001",
    "Ph: 9671030886",
  ]
  for (const line of fromLines) {
    doc.text(line, ox + M, y)
    y += 3.8
  }

  y += 2

  // ── Horizontal separator ──────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 180)
  doc.line(ox + M, y, ox + labelW - M, y)
  y += 5

  // ── TO section ────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold")
  doc.setFontSize(7)
  doc.setTextColor(140, 140, 140)
  doc.text("TO", ox + M, y)
  y += 5

  const addr = order.shipping_address

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(10, 10, 10)
  doc.text(addr.full_name, ox + M, y, { maxWidth: innerW })
  y += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(30, 30, 30)

  const toLines: string[] = [addr.line1]
  if (addr.line2) toLines.push(addr.line2)
  toLines.push(`${addr.city}, ${addr.state} - ${addr.pincode}`)
  toLines.push(`Ph: ${addr.phone}`)

  for (const line of toLines) {
    const splitLines = doc.splitTextToSize(line, innerW)
    doc.text(splitLines, ox + M, y)
    y += splitLines.length * 4.5
  }

  // Pincode large
  y += 2
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(10, 10, 10)
  doc.text(addr.pincode, ox + labelW - M, y, { align: "right" })

  y += 6

  // ── Horizontal separator ──────────────────────────────────────────────────
  doc.setDrawColor(180, 180, 180)
  doc.line(ox + M, y, ox + labelW - M, y)
  y += 5

  // ── Courier + AWB section ─────────────────────────────────────────────────
  if (order.courier_name) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(140, 140, 140)
    doc.text("COURIER", ox + M, y)
    y += 5

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text(order.courier_name, ox + M, y)
    y += 6
  }

  if (order.awb_number) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(140, 140, 140)
    doc.text("TRACKING / AWB", ox + M, y)
    y += 6

    // Extra large tracking number
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(10, 10, 10)
    doc.text(order.awb_number, ox + M, y, { maxWidth: innerW })
    y += 10
  }

  // ── Footer: ALAIRE branding ───────────────────────────────────────────────
  const footerY = oy + labelH - 10
  doc.setDrawColor(180, 180, 180)
  doc.setLineWidth(0.3)
  doc.line(ox + M, footerY - 4, ox + labelW - M, footerY - 4)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  doc.text("ALAIRE", ox + M, footerY)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(6)
  doc.text("www.alaire.in", ox + labelW - M, footerY, { align: "right" })

  return doc
}
