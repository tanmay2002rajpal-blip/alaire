/**
 * @fileoverview Mobile menu component for the header.
 * Renders a slide-out sheet menu for mobile navigation.
 *
 * @module components/layout/header/mobile-menu
 */

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import type { MobileMenuProps } from "./types"

/**
 * MobileMenu Component
 *
 * Renders a hamburger menu button that opens a slide-out sheet
 * with navigation links. Visible only on mobile viewports.
 *
 * Features:
 * - Accessible sheet dialog with proper ARIA labels
 * - Staggered animation for menu items
 * - Conditional account/sign-in link based on auth state
 * - Auto-closes on navigation
 *
 * @param props - Component props
 * @returns Sheet component with mobile navigation
 *
 * @example
 * ```tsx
 * <MobileMenu
 *   links={NAV_LINKS}
 *   isOpen={isMobileMenuOpen}
 *   onOpenChange={setIsMobileMenuOpen}
 *   user={user}
 *   onAuthClick={openAuthDialog}
 * />
 * ```
 */
export function MobileMenu({
  links,
  isOpen,
  onOpenChange,
  user,
  onAuthClick,
}: MobileMenuProps) {
  /**
   * Closes menu and triggers auth dialog.
   */
  const handleAuthClick = () => {
    onOpenChange(false)
    onAuthClick()
  }

  /**
   * Closes menu on navigation.
   */
  const handleNavigation = () => {
    onOpenChange(false)
  }

  // Avoid hydration mismatch from Radix generating different IDs on server vs client
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="nav-item lg:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* Hamburger Button - visible only on mobile */}
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon" className="nav-item">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      {/* Slide-out Menu Content */}
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left font-serif text-2xl tracking-tight">
            Menu
          </SheetTitle>
        </SheetHeader>

        <nav className="mt-8 flex flex-col gap-6 px-4" aria-label="Mobile navigation">
          {/* Main Navigation Links */}
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleNavigation}
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="h-px bg-border my-4" aria-hidden="true" />

          {/* Account/Sign In Link */}
          {user ? (
            <Link
              href="/account"
              onClick={handleNavigation}
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Account
            </Link>
          ) : (
            <button
              onClick={handleAuthClick}
              className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Sign In
            </button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
