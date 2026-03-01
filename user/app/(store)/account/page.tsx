import { auth } from "@/lib/auth"
import { getDb } from "@/lib/db/client"
import { serializeDoc, serializeDocs } from "@/lib/db/helpers"
import { ProfileForm } from "@/components/account/profile-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AccountPage() {
  const session = await auth()
  const userId = session?.user?.id

  const db = await getDb()

  // Get profile data
  const profileDoc = await db
    .collection("users")
    .findOne({ $expr: { $eq: [{ $toString: "$_id" }, userId] } })

  const profile = profileDoc ? serializeDoc(profileDoc) : null

  // Get addresses
  const addressDocs = await db
    .collection("user_addresses")
    .find({ user_id: userId })
    .sort({ is_default: -1 })
    .toArray()

  const addresses = serializeDocs(addressDocs)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your account details and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            user={{
              id: session!.user!.id as string,
              name: session!.user!.name,
              email: session!.user!.email,
              image: session!.user!.image,
            }}
            profile={profile as unknown as import("@/types").Profile | null}
            addresses={addresses as unknown as import("@/types").Address[]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
