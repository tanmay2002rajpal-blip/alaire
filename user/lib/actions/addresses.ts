"use server"

import { revalidatePath } from "next/cache"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

// ============================================================================
// Types
// ============================================================================

export interface Address {
  id: string
  full_name: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  is_default: boolean
}

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

export async function getAddresses(): Promise<Address[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const db = await getDb()
  const docs = await db
    .collection("user_addresses")
    .find({ user_id: session.user.id })
    .sort({ is_default: -1, created_at: -1 })
    .toArray()

  return docs.map((doc) => ({
    id: doc._id.toString(),
    full_name: doc.full_name,
    phone: doc.phone,
    line1: doc.line1,
    line2: doc.line2 || undefined,
    city: doc.city,
    state: doc.state,
    pincode: doc.pincode,
    is_default: doc.is_default || false,
  }))
}

// ============================================================================
// Mutation Functions
// ============================================================================

export async function addAddress(input: AddressInput): Promise<{ success: boolean; error?: string; address?: Address }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const db = await getDb()
  const col = db.collection("user_addresses")

  if (input.is_default) {
    await col.updateMany(
      { user_id: session.user.id },
      { $set: { is_default: false } }
    )
  }

  const count = await col.countDocuments({ user_id: session.user.id })
  const isFirst = count === 0

  const result = await col.insertOne({
    user_id: session.user.id,
    full_name: input.full_name,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 || null,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    is_default: input.is_default || isFirst,
    created_at: new Date().toISOString(),
  })

  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return {
    success: true,
    address: {
      id: result.insertedId.toString(),
      full_name: input.full_name,
      phone: input.phone,
      line1: input.line1,
      line2: input.line2,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      is_default: input.is_default || isFirst,
    },
  }
}

export async function updateAddress(id: string, input: AddressInput): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const db = await getDb()
  const col = db.collection("user_addresses")

  if (input.is_default) {
    await col.updateMany(
      { user_id: session.user.id, _id: { $ne: new ObjectId(id) } },
      { $set: { is_default: false } }
    )
  }

  await col.updateOne(
    { _id: new ObjectId(id), user_id: session.user.id },
    {
      $set: {
        full_name: input.full_name,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 || null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        is_default: input.is_default || false,
        updated_at: new Date().toISOString(),
      },
    }
  )

  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return { success: true }
}

export async function deleteAddress(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const db = await getDb()
  const col = db.collection("user_addresses")

  const address = await col.findOne({
    _id: new ObjectId(id),
    user_id: session.user.id,
  })

  await col.deleteOne({
    _id: new ObjectId(id),
    user_id: session.user.id,
  })

  // If deleted address was default, promote another
  if (address?.is_default) {
    const remaining = await col.findOne({ user_id: session.user.id })
    if (remaining) {
      await col.updateOne(
        { _id: remaining._id },
        { $set: { is_default: true } }
      )
    }
  }

  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return { success: true }
}

export async function setDefaultAddress(id: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const db = await getDb()
  const col = db.collection("user_addresses")

  await col.updateMany(
    { user_id: session.user.id },
    { $set: { is_default: false } }
  )

  await col.updateOne(
    { _id: new ObjectId(id), user_id: session.user.id },
    { $set: { is_default: true } }
  )

  revalidatePath("/account/addresses")
  revalidatePath("/checkout")

  return { success: true }
}
