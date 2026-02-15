/**
 * @fileoverview Main header component for the Alaire e-commerce site.
 * Provides site navigation, branding, and quick actions.
 *
 * This component orchestrates several sub-components:
 * - DesktopNav: Horizontal navigation for desktop viewports
 * - MobileMenu: Slide-out sheet menu for mobile viewports
 * - HeaderLogo: Centered brand logo
 * - HeaderActions: Search, cart, and account buttons
 * - SearchDialog: Global search overlay
 *
 * @module components/layout/header
 *
 * @example
 * ```tsx
 * // In layout.tsx
 * import { Header } from '@/components/layout/header'
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <Header />
 *       <main>{children}</main>
 *     </>
 *   )
 * }
 * ```
 */

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useCart } from "@/hooks"
import { useAuth } from "@/components/auth"
import { SearchDialog } from "./search-dialog"
import {
  useHeader,
  DesktopNav,
  MobileMenu,
  HeaderActions,
  HeaderLogo,
  NAV_LINKS,
} from "./header/index"

// ============================================================================
// Component
// ============================================================================

/**
 * Header Component
 *
 * The main site header with responsive navigation, branding, and actions.
 *
 * Features:
 * - Sticky positioning with scroll-based background transition
 * - GSAP entrance animations for nav items, logo, and actions
 * - Keyboard shortcut for search (Cmd/Ctrl + K)
 * - Responsive design with mobile menu sheet
 * - Cart item count badge
 * - Authentication state awareness
 *
 * State Management:
 * - Scroll state: Tracked via useHeader hook for background transition
 * - Mobile menu: Controlled open/close state
 * - Search dialog: Controlled open/close state
 * - Auth state: From useAuth context
 * - Cart count: From useCart hook
 *
 * @returns Header element with all navigation components
 */
export function Header() {
  // ============================================================================
  // Hooks
  // ============================================================================

  const {
    headerRef,
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSearchOpen,
    setIsSearchOpen,
  } = useHeader()

  const { getItemCount } = useCart()
  const { user, openAuthDialog } = useAuth()

  // Prevent hydration mismatch - cart count comes from localStorage
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  // ============================================================================
  // Derived State
  // ============================================================================

  // Only show cart count after mount to prevent hydration mismatch
  const itemCount = mounted ? getItemCount() : 0

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Left - Desktop Navigation */}
          <DesktopNav links={NAV_LINKS} />

          {/* Left - Mobile Menu Button & Sheet */}
          <MobileMenu
            links={NAV_LINKS}
            isOpen={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
            user={user}
            onAuthClick={openAuthDialog}
          />

          {/* Center - Logo */}
          <HeaderLogo />

          {/* Right - Action Buttons */}
          <HeaderActions
            onSearchClick={() => setIsSearchOpen(true)}
            cartItemCount={itemCount}
            user={user}
            onAuthClick={openAuthDialog}
          />
        </div>
      </div>

      {/* Search Dialog Overlay */}
      <SearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
    </header>
  )
}
