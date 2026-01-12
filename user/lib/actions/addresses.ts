/**
 * @fileoverview Server actions for user address management.
 * Handles CRUD operations for saved shipping addresses.
 *
 * Features:
 * - Get all user addresses
 * - Add new addresses
 * - Update existing addresses
 * - Delete addresses
 * - Set default address
 *
 * Security:
 * - All operations require authentication
 * - Users can only access their own addresses
 *
 * @module lib/actions/addresses
 *
 * @example
 * ```tsx
 * import { getAddresses, addAddress } from "@/lib/actions/addresses"
 *
 * // Get user's saved addresses
 * const addresses = await getAddresses()
 *
 * // Add new address
 * const result = await addAddress({
 *   full_name: "John Doe",
 *   phone: "9876543210",
 *   line1: "123 Main Street",
 *   city: "Mumbai",
 *   state: "Maharashtra",
 *   pincode: "400001",
 * })
 * ```
 */

"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// ============================================================================
// Types
// ============================================================================

/**
 * Complete address record from database.
 */
export interface Address {
  /** Unique address ID */
  id: string
  /** Recipient full name */
  full_name: string
  /** Contact phone number */
  phone: string
  /** Primary address line (street, building) */
  line1: string
  /** Secondary address line (apartment, floor) */
  line2?: string
  /** City name */
  city: string
  /** State name */
  state: string
  /** 6-digit postal code */
  pincode: string
  /** Whether this is the user's default address */
  is_default: boolean
}

/**
 * Input for creating/updating an address.
 * Omits id and is_default (handled separately).
 */
export interface AddressInput {
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  is_default?: boolean
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Fetches all addresses for the authenticated user.
 * Sorted with default address first, then by creation date.
 *
 * @returns Array of user addresses (empty if not logged in)
 *
 * @example
 * ```tsx
 * const addresses = await getAddresses()
 * if (addresses.length === 0) {
 *   showAddAddressPrompt()
 * }
 * ```
 */
export async function getAddresses(): Promise<Address[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("user_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching addresses:", error)
    return []
  }

  return data || []
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Adds a new address for the authenticated user.
 * First address is automatically set as default.
 *
 * @param input - Address details
 * @returns Success status with optional error message or new address
 *
 * @example
 * ```tsx
 * const { success, address, error } = await addAddress({
 *   full_name: "Jane Doe",
 *   phone: "9876543210",
 *   line1: "456 Park Avenue",
 *   city: "Delhi",
 *   state: "Delhi",
 *   pincode: "110001",
 *   is_default: true,
 * })
 *
 * if (!success) {
 *   showError(error)
 * }
 * ```
 */
export async function addAddress(input: AddressInput): Promise<{ success: boolean; error?: string; address?: Address }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // If marking as default, clear other defaults first
  if (input.is_default) {
    await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
  }

  // Check if this is the first address (should be default)
  const { count } = await supabase
    .from("user_addresses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  const isFirst = count === 0

  const { data, error } = await supabase
    .from("user_addresses")
    .insert({
      user_id: user.id,
      full_name: input.full_name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      is_default: input.is_default || isFirst,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding address:", error)
    return { success: false, error: "Failed to add address" }
  }

  // Revalidate relevant pages
  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return { success: true, address: data }
}

/**
 * Updates an existing address.
 * If setting as default, clears other defaults.
 *
 * @param id - Address ID to update
 * @param input - Updated address details
 * @returns Success status with optional error message
 *
 * @example
 * ```tsx
 * const { success, error } = await updateAddress("address-uuid", {
 *   full_name: "Jane Smith",
 *   phone: "9876543210",
 *   line1: "789 New Street",
 *   city: "Mumbai",
 *   state: "Maharashtra",
 *   pincode: "400002",
 * })
 * ```
 */
export async function updateAddress(id: string, input: AddressInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // If setting as default, clear other defaults first
  if (input.is_default) {
    await supabase
      .from("user_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id)
      .neq("id", id)
  }

  const { error } = await supabase
    .from("user_addresses")
    .update({
      full_name: input.full_name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2 || null,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      is_default: input.is_default || false,
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating address:", error)
    return { success: false, error: "Failed to update address" }
  }

  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return { success: true }
}

/**
 * Deletes an address.
 * If deleting the default, promotes another address to default.
 *
 * @param id - Address ID to delete
 * @returns Success status with optional error message
 *
 * @example
 * ```tsx
 * const { success, error } = await deleteAddress("address-uuid")
 * if (success) {
 *   toast.success("Address deleted")
 * }
 * ```
 */
export async function deleteAddress(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if it's the default address
  const { data: address } = await supabase
    .from("user_addresses")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  const { error } = await supabase
    .from("user_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting address:", error)
    return { success: false, error: "Failed to delete address" }
  }

  // If deleted address was default, promote another
  if (address?.is_default) {
    const { data: remaining } = await supabase
      .from("user_addresses")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (remaining) {
      await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", remaining.id)
    }
  }

  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return { success: true }
}

/**
 * Sets an address as the user's default.
 * Clears default status from all other addresses.
 *
 * @param id - Address ID to set as default
 * @returns Success status with optional error message
 *
 * @example
 * ```tsx
 * const { success } = await setDefaultAddress("address-uuid")
 * ```
 */
export async function setDefaultAddress(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Clear all defaults
  await supabase
    .from("user_addresses")
    .update({ is_default: false })
    .eq("user_id", user.id)

  // Set new default
  const { error } = await supabase
    .from("user_addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error setting default address:", error)
    return { success: false, error: "Failed to set default address" }
  }

  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return { success: true }
}
