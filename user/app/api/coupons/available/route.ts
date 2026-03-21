import { NextResponse } from "next/server"
import { getDb } from "@/lib/db/client"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const subtotal = Number(searchParams.get("subtotal")) || 0

    const db = await getDb()
    const now = new Date()

    // Fetch active and upcoming coupons
    const coupons = await db
      .collection("coupons")
      .find({
        is_active: true,
        $or: [
          // Currently valid
          {
            valid_from: { $lte: now },
            $or: [{ valid_until: null }, { valid_until: { $gte: now } }],
          },
          // Upcoming (within next 7 days)
          {
            valid_from: { $gt: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      })
      .project({
        code: 1,
        type: 1,
        value: 1,
        min_order_amount: 1,
        max_discount: 1,
        valid_from: 1,
        valid_until: 1,
        usage_limit: 1,
        usage_count: 1,
      })
      .toArray()

    const available = coupons.map((c) => {
      const validFrom = c.valid_from ? new Date(c.valid_from) : null
      const isUpcoming = validFrom && validFrom > now
      const minOrder = Number(c.min_order_amount) || 0
      const isEligible = !isUpcoming && subtotal >= minOrder
      const usageLimit = c.usage_limit ?? null
      const usageCount = c.usage_count ?? 0
      const isUsedUp = usageLimit !== null && usageCount >= usageLimit

      let discount = 0
      if (isEligible && !isUsedUp) {
        const value = Number(c.value) || 0
        if (c.type === "percentage") {
          discount = (subtotal * value) / 100
          const maxDiscount = Number(c.max_discount) || null
          if (maxDiscount) discount = Math.min(discount, maxDiscount)
        } else {
          discount = Math.min(value, subtotal)
        }
        discount = Math.round(discount)
      }

      return {
        code: c.code,
        type: c.type,
        value: Number(c.value),
        min_order_amount: minOrder,
        max_discount: Number(c.max_discount) || null,
        is_eligible: isEligible && !isUsedUp,
        is_upcoming: !!isUpcoming,
        valid_from: c.valid_from,
        savings: discount,
        shortfall: !isUpcoming && subtotal < minOrder ? minOrder - subtotal : 0,
      }
    })

    // Sort: eligible first, then upcoming, then ineligible
    available.sort((a, b) => {
      if (a.is_eligible && !b.is_eligible) return -1
      if (!a.is_eligible && b.is_eligible) return 1
      if (a.is_upcoming && !b.is_upcoming) return -1
      if (!a.is_upcoming && b.is_upcoming) return 1
      return b.savings - a.savings
    })

    return NextResponse.json(available)
  } catch (error) {
    console.error("Error fetching available coupons:", error)
    return NextResponse.json([])
  }
}
