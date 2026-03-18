import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const db = await getDb()
    const isEmail = userId.includes("@")

    // Get profile data
    let profileDoc
    if (isEmail) {
      profileDoc = await db.collection("users").findOne({ email: userId })
    } else {
      profileDoc = ObjectId.isValid(userId)
        ? await db.collection("users").findOne({ _id: new ObjectId(userId) })
        : null
    }

    const realUserId = profileDoc ? profileDoc._id.toString() : userId

    const profile = profileDoc
      ? {
          id: profileDoc._id.toString(),
          full_name: profileDoc.full_name || profileDoc.name || null,
          email: profileDoc.email || null,
          phone: profileDoc.phone || null,
        }
      : null

    // Get addresses
    const addressDocs = await db
      .collection("user_addresses")
      .find({ user_id: realUserId })
      .sort({ is_default: -1 })
      .toArray()

    const addresses = addressDocs.map((doc) => ({
      id: doc._id.toString(),
      full_name: doc.full_name,
      phone: doc.phone,
      line1: doc.line1,
      line2: doc.line2 || "",
      city: doc.city,
      state: doc.state,
      pincode: doc.pincode,
      is_default: doc.is_default || false,
    }))

    return NextResponse.json({ profile, addresses })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { profile: null, addresses: [] },
      { status: 200 }
    )
  }
}
