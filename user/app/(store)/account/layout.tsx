import { redirect } from "next/navigation"
import Link from "next/link"
import { User, Package, Heart, Wallet, Bell, Settings } from "lucide-react"
import { auth } from "@/lib/auth"

const accountNavItems = [
  { href: "/account", label: "Profile", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/wallet", label: "Wallet", icon: Wallet },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
]

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/")
  }

  return (
    <div className="container py-8">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">My Account</h1>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar Navigation */}
        <aside className="space-y-1">
          {accountNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </aside>

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
