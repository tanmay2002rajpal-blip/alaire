/**
 * @fileoverview Header logo component.
 * Renders the brand logo with proper positioning.
 *
 * @module components/layout/header/logo
 */

"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { HeaderLogoProps } from "./types"

/**
 * HeaderLogo Component
 *
 * Renders the brand logo (ALAIRE) centered in the header.
 * On mobile, logo is absolutely positioned for true centering.
 * On desktop, it uses auto margins for centering.
 *
 * Features:
 * - GSAP entrance animation (via .header-logo class)
 * - Responsive positioning
 * - Serif typography with tight tracking
 *
 * @param props - Component props
 * @returns Logo link element
 *
 * @example
 * ```tsx
 * <HeaderLogo />
 * ```
 */
export function HeaderLogo({ className }: HeaderLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "header-logo absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 lg:mx-auto",
        className
      )}
      aria-label="ALAIRE - Go to homepage"
    >
      <span className="font-serif text-2xl lg:text-3xl font-medium tracking-tight">
        ALAIRE
      </span>
    </Link>
  )
}
