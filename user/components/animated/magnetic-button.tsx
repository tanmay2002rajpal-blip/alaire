"use client"

import { useRef, type ReactNode, type MouseEvent } from "react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

interface MagneticButtonProps {
  children: ReactNode
  strength?: number
  className?: string
  onClick?: () => void
  disabled?: boolean
}

export function MagneticButton({
  children,
  strength = 0.3,
  className,
  onClick,
  disabled = false,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || disabled) return

    const button = buttonRef.current
    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    gsap.to(button, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: "power3.out",
    })
  }

  const handleMouseLeave = () => {
    if (!buttonRef.current || disabled) return

    gsap.to(buttonRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.5)",
    })
  }

  return (
    <button
      ref={buttonRef}
      className={cn(
        "relative inline-flex items-center justify-center",
        "transition-colors duration-300",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
