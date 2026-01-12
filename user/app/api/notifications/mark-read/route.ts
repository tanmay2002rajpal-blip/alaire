/**
 * @fileoverview Mark Notification Read API endpoint.
 * Updates a notification's read status to true.
 *
 * Security:
 * - Requires authenticated user
 * - Only marks notifications belonging to the authenticated user
 *
 * @module app/api/notifications/mark-read
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/notifications/mark-read
 *
 * Marks a specific notification as read.
 * Includes user_id check to prevent unauthorized updates.
 *
 * @param request - HTTP request with { notificationId: string } body
 * @returns Success confirmation or error message
 *
 * @example
 * ```ts
 * // Mark notification as read
 * const response = await fetch('/api/notifications/mark-read', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ notificationId: 'notification-uuid' }),
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

    const { notificationId } = await request.json()

    // ========================================================================
    // Update Notification
    // ========================================================================

    // Include user_id in WHERE clause for security
    // Prevents users from marking other users' notifications as read
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark read error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
