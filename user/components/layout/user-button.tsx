"use client"

import Link from "next/link"
import { User, LogOut, Package, Heart, Wallet, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logout } from "@/app/(auth)/auth/actions"

interface UserButtonProps {
  user?: { id: string; email?: string } | null
}

export function UserButton({ user }: UserButtonProps) {
  if (!user) {
    return (
      <Button variant="ghost" size="icon" asChild>
        <Link href="/auth/login">
          <User className="h-5 w-5" />
          <span className="sr-only">Login</span>
        </Link>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">Account menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            My Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/wishlist" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Wishlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Wallet
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive flex items-center gap-2 cursor-pointer"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
