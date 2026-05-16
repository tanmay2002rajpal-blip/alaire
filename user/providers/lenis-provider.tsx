"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import Lenis from "lenis"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

interface LenisContextType {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, options?: { offset?: number; duration?: number }) => void
}

const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {},
})

export function useLenis() {
  return useContext(LenisContext)
}

interface LenisProviderProps {
  children: React.ReactNode
}

export function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    // Skip Lenis on mobile/touch devices — native scroll performs better
    const isMobile = window.matchMedia("(max-width: 768px)").matches
      || "ontouchstart" in window
    if (isMobile) return

    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1,
      infinite: false,
    })

    lenisRef.current = lenisInstance
    // Defer state update to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setLenis(lenisInstance)
    })

    // Sync Lenis with GSAP ScrollTrigger (per official Lenis docs)
    lenisInstance.on("scroll", ScrollTrigger.update)

    // Create named update function for proper cleanup
    function update(time: number) {
      lenisInstance.raf(time * 1000)
    }

    // Add Lenis to GSAP ticker for smooth animation sync
    gsap.ticker.add(update)

    // Disable GSAP's default lag smoothing for better sync
    gsap.ticker.lagSmoothing(0)

    // Cleanup function
    return () => {
      gsap.ticker.remove(update)
      lenisInstance.destroy()
    }
  }, [])

  const scrollTo = useCallback((
    target: string | number | HTMLElement,
    options?: { offset?: number; duration?: number }
  ) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, {
        offset: options?.offset ?? 0,
        duration: options?.duration ?? 1.2,
      })
    }
  }, [])

  return (
    <LenisContext.Provider value={{ lenis, scrollTo }}>
      {children}
    </LenisContext.Provider>
  )
}
