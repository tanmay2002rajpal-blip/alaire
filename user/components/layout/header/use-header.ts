/**
 * @fileoverview Custom hook for header component logic.
 * Manages scroll state, animations, and keyboard shortcuts.
 *
 * @module components/layout/header/use-header
 */

"use client"

import { useEffect, useState, useRef, RefObject } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register GSAP plugin only on client-side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/**
 * Return type for the useHeader hook.
 */
export interface UseHeaderReturn {
  /** Reference to attach to header element */
  headerRef: RefObject<HTMLElement | null>
  /** Whether the page has been scrolled past threshold */
  isScrolled: boolean
  /** Whether mobile menu is open */
  isMobileMenuOpen: boolean
  /** Toggle mobile menu state */
  setIsMobileMenuOpen: (open: boolean) => void
  /** Whether search dialog is open */
  isSearchOpen: boolean
  /** Toggle search dialog state */
  setIsSearchOpen: (open: boolean) => void
}

/**
 * Scroll threshold in pixels before header style changes.
 */
const SCROLL_THRESHOLD = 50

/**
 * useHeader Hook
 *
 * Manages all header-related state and side effects:
 * - Scroll detection for header background change
 * - GSAP entrance animations
 * - Keyboard shortcut for search (Cmd/Ctrl + K)
 *
 * @returns Header state and handlers
 *
 * @example
 * ```tsx
 * function Header() {
 *   const {
 *     headerRef,
 *     isScrolled,
 *     isMobileMenuOpen,
 *     setIsMobileMenuOpen,
 *     isSearchOpen,
 *     setIsSearchOpen,
 *   } = useHeader()
 *
 *   return (
 *     <header ref={headerRef} className={isScrolled ? 'scrolled' : ''}>
 *       ...
 *     </header>
 *   )
 * }
 * ```
 */
export function useHeader(): UseHeaderReturn {
  // ============================================================================
  // State
  // ============================================================================

  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // ============================================================================
  // Scroll Detection
  // ============================================================================

  useEffect(() => {
    /**
     * Updates scroll state based on window scroll position.
     * Uses passive listener for better scroll performance.
     */
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ============================================================================
  // GSAP Entrance Animations
  // ============================================================================

  useEffect(() => {
    if (!headerRef.current) return

    // Create GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      // Animate navigation links
      gsap.fromTo(
        ".nav-item",
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.3,
        }
      )

      // Animate logo
      gsap.fromTo(
        ".header-logo",
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          delay: 0.1,
        }
      )

      // Animate action buttons (search, cart, account)
      gsap.fromTo(
        ".header-action",
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.5,
        }
      )
    }, headerRef)

    // Cleanup animations on unmount
    return () => ctx.revert()
  }, [])

  // ============================================================================
  // Keyboard Shortcuts
  // ============================================================================

  useEffect(() => {
    /**
     * Handles keyboard shortcuts.
     * - Cmd/Ctrl + K: Open search dialog
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // ============================================================================
  // Return
  // ============================================================================

  return {
    headerRef,
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSearchOpen,
    setIsSearchOpen,
  }
}
