/**
 * @fileoverview Wishlist Remove API endpoint.
 * Removes a specific item from the user's wishlist by item ID.
 *
 * Note: This differs from /toggle which uses productId.
 * This endpoint uses the wishlist item's own ID.
 *
 * Security:
 * - Requires authenticated user
 * - Only removes items belonging to the authenticated user
 *
 * @module app/api/wishlist/remove
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/wishlist/remove
 *
 * Removes a wishlist item by its ID.
 * Includes user_id check to prevent unauthorized deletions.
 *
 * @param request - HTTP request with { itemId: string } body
 * @returns Success confirmation or error message
 *
 * @example
 * ```ts
 * // Remove specific wishlist entry
 * const response = await fetch('/api/wishlist/remove', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ itemId: 'wishlist-item-uuid' }),
 * })
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
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { itemId } = await request.json()

    // ========================================================================
    // Delete Wishlist Item
    // ========================================================================

    // Include user_id in WHERE clause for security
    // Prevents users from deleting other users' wishlist items
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", itemId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Wishlist remove error:", error)
      return NextResponse.json(
        { message: "Failed to remove item" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Wishlist remove error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
