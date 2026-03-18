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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    let searchIds = [userId]

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
