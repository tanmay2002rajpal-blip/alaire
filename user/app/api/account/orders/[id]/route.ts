import { NextResponse } from "next/server"
import { getOrderById } from "@/lib/db/queries"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const session = await auth()

    const rawUserId = session?.user?.id || searchParams.get("userId")

    if (!rawUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let searchIds = [rawUserId]

    if (rawUserId.includes("@")) {
      const db = await getDb()
      const userDoc = await db.collection("users").findOne({ email: rawUserId })
      if (userDoc) searchIds.push(userDoc._id.toString())
    } else {
      const db = await getDb()
      try {
        const userDoc = await db.collection("users").findOne({ _id: new ObjectId(rawUserId) })
        if (userDoc && userDoc.email) searchIds.push(userDoc.email)
      } catch (e) {
        // ignore invalid object ID format
      }
    }

    const order = await getOrderById(id, searchIds)

    if (!order) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (err: any) {
    console.error("Order GET Error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
