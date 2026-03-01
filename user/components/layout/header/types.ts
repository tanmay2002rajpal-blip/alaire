/**
 * @fileoverview Type definitions for the header component module.
 * Centralizes all header-related types for better maintainability.
 *
 * @module components/layout/header/types
 */

// ============================================================================
// User Type (replaces Supabase User import)
// ============================================================================

export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Navigation link configuration.
 */
export interface NavLink {
  /** Route path */
  href: string
  /** Display text */
  label: string
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props for DesktopNav component.
 */
export interface DesktopNavProps {
  /** Navigation links to display */
  links: NavLink[]
}

/**
 * Props for MobileMenu component.
 */
export interface MobileMenuProps {
  /** Navigation links to display */
  links: NavLink[]
  /** Whether the menu is open */
  isOpen: boolean
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** Current authenticated user (null if not logged in) */
  user: User | null
  /** Callback to open auth dialog */
  onAuthClick: () => void
}

/**
 * Props for HeaderActions component.
 */
export interface HeaderActionsProps {
  /** Callback to open search dialog */
  onSearchClick: () => void
  /** Number of items in cart */
  cartItemCount: number
  /** Current authenticated user (null if not logged in) */
  user: User | null
  /** Callback to open auth dialog */
  onAuthClick: () => void
}

/**
 * Props for HeaderLogo component.
 */
export interface HeaderLogoProps {
  /** Additional CSS classes */
  className?: string
}
