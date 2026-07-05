import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ balance: 0 })
  }

  const db = await getDb()

  // Wallets store user_id as an ObjectId, but the session id is a string.
  // Match both forms so the balance is found regardless of how it was stored.
  const userId = session.user.id
  const userIdForms: (string | ObjectId)[] = [userId]
  if (ObjectId.isValid(userId)) {
    userIdForms.push(new ObjectId(userId))
  }

  const wallet = await db
    .collection("wallets")
    .findOne({ user_id: { $in: userIdForms } })

  return NextResponse.json({ balance: wallet?.balance ?? 0 })
}
