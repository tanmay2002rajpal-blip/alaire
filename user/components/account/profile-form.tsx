"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import type { Profile, Address } from "@/types"

interface ProfileFormProps {
  user: User
  profile: Profile | null
  addresses: Address[]
}

export function ProfileForm({ user, profile, addresses }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/account/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast.success("Profile updated successfully")
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="9876543210"
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-lg font-medium">Saved Addresses</h3>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved addresses yet
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="rounded-lg border p-4"
              >
                {address.is_default && (
                  <span className="mb-2 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Default
                  </span>
                )}
                <p className="font-medium">{address.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {address.line1}
                  {address.line2 && `, ${address.line2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-sm text-muted-foreground">
                  Phone: {address.phone}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
