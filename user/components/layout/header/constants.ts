/**
 * @fileoverview Constants for the header component module.
 * Defines navigation links and other static configuration.
 *
 * @module components/layout/header/constants
 */

import type { NavLink } from "./types"

// ============================================================================
// Navigation
// ============================================================================

/**
 * Main navigation links displayed in header.
 * Order determines display order in both desktop and mobile menus.
 */
export const NAV_LINKS: NavLink[] = [
  { href: "/products", label: "Shop" },
  { href: "/categories", label: "Categories" },
  { href: "/blog", label: "Blog" },
]

// ============================================================================
// Animation
// ============================================================================

/**
 * Scroll threshold in pixels before header style changes.
 * Used for background transition from transparent to solid.
 */
export const SCROLL_THRESHOLD = 50
