/**
 * @fileoverview Update Profile API endpoint.
 * Handles user profile updates (name, phone number).
 *
 * Security:
 * - Requires authenticated user
 * - Users can only update their own profile
 *
 * @module app/api/account/update-profile
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// Types
// ============================================================================

/**
 * Request body for profile update.
 */
interface UpdateProfileRequest {
  /** User's full name */
  fullName: string
  /** User's phone number */
  phone: string
}

// ============================================================================
// Route Handler
// ============================================================================

/**
 * POST /api/account/update-profile
 *
 * Updates the authenticated user's profile information.
 * Uses upsert to handle both new and existing profiles.
 *
 * @param request - HTTP request with UpdateProfileRequest body
 * @returns Success confirmation or error message
 *
 * @example
 * ```ts
 * const response = await fetch('/api/account/update-profile', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     fullName: 'John Doe',
 *     phone: '+91 98765 43210',
 *   }),
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

    // ========================================================================
    // Update Profile
    // ========================================================================

    const body: UpdateProfileRequest = await request.json()
    const { fullName, phone } = body

    // Upsert handles both insert (new profile) and update (existing profile)
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
