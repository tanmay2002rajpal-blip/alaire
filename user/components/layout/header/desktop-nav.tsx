/**
 * @fileoverview Desktop navigation component for the header.
 * Displays horizontal navigation links with hover animations.
 *
 * @module components/layout/header/desktop-nav
 */

"use client"

import Link from "next/link"
import type { DesktopNavProps } from "./types"

/**
 * DesktopNav Component
 *
 * Renders horizontal navigation links for desktop viewport.
 * Hidden on mobile devices (lg: breakpoint and above).
 *
 * Features:
 * - GSAP entrance animation (via .nav-item class)
 * - Underline hover effect (via .link-underline class)
 * - Accessible link structure
 *
 * @param props - Component props
 * @returns Navigation element with links
 *
 * @example
 * ```tsx
 * <DesktopNav links={NAV_LINKS} />
 * ```
 */
export function DesktopNav({ links }: DesktopNavProps) {
  return (
    <nav
      className="hidden lg:flex items-center gap-8"
      aria-label="Main navigation"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="nav-item text-sm font-medium text-foreground/80 hover:text-foreground transition-colors link-underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
