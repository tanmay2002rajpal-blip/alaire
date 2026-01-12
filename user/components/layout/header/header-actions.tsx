/**
 * @fileoverview Header action buttons component.
 * Renders search, cart, and account buttons in the header.
 *
 * @module components/layout/header/header-actions
 */

"use client"

import Link from "next/link"
import { Search, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HeaderActionsProps } from "./types"

/**
 * HeaderActions Component
 *
 * Renders the action buttons on the right side of the header:
 * - Search button (opens search dialog)
 * - Cart button with item count badge
 * - Account/Sign-in button (hidden on mobile, shown in mobile menu)
 *
 * Features:
 * - GSAP entrance animation (via .header-action class)
 * - Animated cart badge when items are added
 * - Accessible button labels
 * - Keyboard shortcut hint for search (⌘K)
 *
 * @param props - Component props
 * @returns Action buttons container
 *
 * @example
 * ```tsx
 * <HeaderActions
 *   onSearchClick={() => setIsSearchOpen(true)}
 *   cartItemCount={3}
 *   user={user}
 *   onAuthClick={openAuthDialog}
 * />
 * ```
 */
export function HeaderActions({
  onSearchClick,
  cartItemCount,
  user,
  onAuthClick,
}: HeaderActionsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {/* Search Button */}
      <Button
        variant="ghost"
        size="icon"
        className="header-action h-10 w-10 rounded-full"
        onClick={onSearchClick}
        aria-label="Search products"
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Search (⌘K)</span>
      </Button>

      {/* Cart Button */}
      <Link href="/cart" aria-label={`Cart with ${cartItemCount} items`}>
        <Button
          variant="ghost"
          size="icon"
          className="header-action relative h-10 w-10 rounded-full"
        >
          <ShoppingBag className="h-5 w-5" />
          {cartItemCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background animate-scale-up"
              aria-hidden="true"
            >
              {cartItemCount}
            </span>
          )}
          <span className="sr-only">Cart</span>
        </Button>
      </Link>

      {/* Account Button - hidden on mobile (shown in mobile menu instead) */}
      {user ? (
        <Link href="/account" className="hidden sm:block">
          <Button
            variant="ghost"
            size="icon"
            className="header-action h-10 w-10 rounded-full"
            aria-label="Go to account"
          >
            <User className="h-5 w-5" />
            <span className="sr-only">Account</span>
          </Button>
        </Link>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="header-action h-10 w-10 rounded-full hidden sm:flex"
          onClick={onAuthClick}
          aria-label="Sign in"
        >
          <User className="h-5 w-5" />
          <span className="sr-only">Sign in</span>
        </Button>
      )}
    </div>
  )
}
