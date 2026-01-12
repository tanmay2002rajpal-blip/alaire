import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/account/profile-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single()

  // Get addresses
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user?.id)
    .order("is_default", { ascending: false })

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
            user={user!}
            profile={profile}
            addresses={addresses ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
