"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { User, Package, Heart, Wallet, Bell, Settings, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"

const accountNavItems = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
]

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, openAuthDialog } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      openAuthDialog()
      router.push("/")
    }
  }, [isLoading, user, router, openAuthDialog])

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded-lg" />
              ))}
            </div>
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">My Account</h1>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar Navigation */}
        <aside className="space-y-1">
          {accountNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                  isActive
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </aside>

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
