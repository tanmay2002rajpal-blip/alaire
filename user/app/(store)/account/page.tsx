"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { ProfileForm } from "@/components/account/profile-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AccountPage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/account/profile?userId=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setProfile(data.profile || null)
          setAddresses(data.addresses || [])
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-72 bg-muted rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
              <div className="h-10 bg-muted rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null
  }

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
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            }}
            profile={profile}
            addresses={addresses}
          />
        </CardContent>
      </Card>
    </div>
  )
}
