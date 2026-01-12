/**
 * @fileoverview Header module exports.
 * Re-exports all header-related components, hooks, and types.
 *
 * @module components/layout/header
 *
 * @example
 * ```tsx
 * import {
 *   useHeader,
 *   DesktopNav,
 *   MobileMenu,
 *   HeaderActions,
 *   HeaderLogo,
 *   NAV_LINKS,
 * } from '@/components/layout/header'
 * ```
 */

// ============================================================================
// Components
// ============================================================================

export { DesktopNav } from "./desktop-nav"
export { MobileMenu } from "./mobile-menu"
export { HeaderActions } from "./header-actions"
export { HeaderLogo } from "./logo"

// ============================================================================
// Hooks
// ============================================================================

export { useHeader } from "./use-header"
export type { UseHeaderReturn } from "./use-header"

// ============================================================================
// Constants
// ============================================================================

export { NAV_LINKS, SCROLL_THRESHOLD } from "./constants"

// ============================================================================
// Types
// ============================================================================

export type {
  NavLink,
  DesktopNavProps,
  MobileMenuProps,
  HeaderActionsProps,
  HeaderLogoProps,
} from "./types"
