import { NextResponse } from "next/server"
import { getRecentReviewsForPopup } from "@/lib/db/queries/reviews"

export const dynamic = "force-dynamic"

// Feeds the storefront's rotating "customer review" social-proof popup.
export async function GET() {
  try {
    const reviews = await getRecentReviewsForPopup(20)
    return NextResponse.json(reviews, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
