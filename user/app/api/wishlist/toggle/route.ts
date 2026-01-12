/**
 * @fileoverview Wishlist Toggle API endpoint.
 * Adds or removes a product from the user's wishlist.
 *
 * Behavior:
 * - If product is NOT in wishlist: Add it
 * - If product IS in wishlist: Remove it
 *
 * Security:
 * - Requires authenticated user
 * - Returns special flag for unauthenticated requests
 *
 * @module app/api/wishlist/toggle
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/wishlist/toggle
 *
 * Toggles a product in the user's wishlist.
 * If the product exists, it's removed. If not, it's added.
 *
 * @param request - HTTP request with { productId: string } body
 * @returns { added: boolean } indicating final state
 *
 * @example
 * ```ts
 * // Add to wishlist (if not present) or remove (if present)
 * const response = await fetch('/api/wishlist/toggle', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ productId: 'uuid-here' }),
 * })
 * const { added } = await response.json()
 * // added: true = product was added
 * // added: false = product was removed
 * ```
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // ========================================================================
    // Authentication Check
    // ========================================================================

    if (!user) {
      // Return special flag so client can prompt login
      return NextResponse.json(
        { message: "Please login to add items to wishlist", requireAuth: true },
        { status: 401 }
      )
    }

    const { productId } = await request.json()

    // ========================================================================
    // Check Existing Wishlist Entry
    // ========================================================================

    const { data: existing } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .single()

    // ========================================================================
    // Toggle: Remove or Add
    // ========================================================================

    if (existing) {
      // Product is in wishlist - remove it
      await supabase
        .from("wishlists")
        .delete()
        .eq("id", existing.id)

      return NextResponse.json({ added: false })
    } else {
      // Product not in wishlist - add it
      await supabase
        .from("wishlists")
        .insert({
          user_id: user.id,
          product_id: productId,
        })

      return NextResponse.json({ added: true })
    }
  } catch (error) {
    console.error("Wishlist toggle error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
