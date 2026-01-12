"use client"

import { useEffect, useRef, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AnimatedQuantityProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AnimatedQuantity({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: AnimatedQuantityProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const numberRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: {
      button: "h-7 w-7",
      icon: "h-3 w-3",
      number: "w-8 text-sm",
      height: "h-5",
    },
    md: {
      button: "h-9 w-9",
      icon: "h-4 w-4",
      number: "w-10 text-base",
      height: "h-6",
    },
    lg: {
      button: "h-11 w-11",
      icon: "h-5 w-5",
      number: "w-12 text-lg",
      height: "h-7",
    },
  }

  const classes = sizeClasses[size]

  // Animate number change
  useEffect(() => {
    if (value === displayValue || !numberRef.current) return

    const direction = value > displayValue ? 1 : -1
    const numberEl = numberRef.current

    // Defer animation state to avoid synchronous setState in effect
    const rafId = requestAnimationFrame(() => {
      setIsAnimating(true)
    })

    // Create animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setDisplayValue(value)
        setIsAnimating(false)
      },
    })

    // Animate out current number
    tl.to(numberEl, {
      y: -20 * direction,
      opacity: 0,
      scale: 0.8,
      duration: 0.15,
      ease: "power2.in",
    })

    // Reset position for incoming number
    tl.set(numberEl, {
      y: 20 * direction,
      innerHTML: value.toString(),
    })

    // Animate in new number
    tl.to(numberEl, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.25,
      ease: "back.out(1.5)",
    })

    // Add a subtle bounce to the container
    gsap.to(containerRef.current, {
      scale: 1.05,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
    })

    return () => {
      cancelAnimationFrame(rafId)
      tl.kill()
    }
  }, [value, displayValue])

  const handleDecrement = () => {
    if (value > min && !isAnimating) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max && !isAnimating) {
      onChange(value + 1)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-background p-1",
        className
      )}
    >
      {/* Decrement Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrement}
        disabled={value <= min || isAnimating}
        className={cn(
          classes.button,
          "rounded-full transition-all duration-200",
          "hover:bg-foreground hover:text-background",
          "disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground",
          "active:scale-90"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={classes.icon} />
      </Button>

      {/* Number Display */}
      <div
        className={cn(
          classes.number,
          classes.height,
          "relative flex items-center justify-center overflow-hidden font-medium tabular-nums"
        )}
      >
        <div
          ref={numberRef}
          className="flex items-center justify-center"
        >
          {displayValue}
        </div>
      </div>

      {/* Increment Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrement}
        disabled={value >= max || isAnimating}
        className={cn(
          classes.button,
          "rounded-full transition-all duration-200",
          "hover:bg-foreground hover:text-background",
          "disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-foreground",
          "active:scale-90"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={classes.icon} />
      </Button>
    </div>
  )
}

// Alternative: Vertical flip animation style
export function AnimatedQuantityFlip({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: AnimatedQuantityProps) {
  const [prevValue, setPrevValue] = useState(value)
  const [isAnimating, setIsAnimating] = useState(false)
  const flipContainerRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: { button: "h-7 w-7", icon: "h-3 w-3", number: "w-8 h-6 text-sm" },
    md: { button: "h-9 w-9", icon: "h-4 w-4", number: "w-10 h-8 text-base" },
    lg: { button: "h-11 w-11", icon: "h-5 w-5", number: "w-12 h-10 text-lg" },
  }

  const classes = sizeClasses[size]

  useEffect(() => {
    if (value === prevValue || !flipContainerRef.current) return

    const direction = value > prevValue ? -1 : 1
    const container = flipContainerRef.current
    const digits = container.querySelectorAll(".digit")

    // Defer animation state to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setIsAnimating(true)
    })

    const tl = gsap.timeline({
      onComplete: () => {
        setPrevValue(value)
        setIsAnimating(false)
      },
    })

    // Animate each digit with stagger for multi-digit numbers
    digits.forEach((digit, i) => {
      const delay = i * 0.05

      tl.to(
        digit,
        {
          y: 30 * direction,
          opacity: 0,
          rotationX: 90 * direction,
          duration: 0.2,
          ease: "power2.in",
        },
        delay
      )

      tl.set(digit, { y: -30 * direction, rotationX: -90 * direction }, delay + 0.2)

      tl.to(
        digit,
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 0.3,
          ease: "back.out(1.2)",
        },
        delay + 0.2
      )
    })
  }, [value, prevValue])

  const handleDecrement = () => {
    if (value > min && !isAnimating) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max && !isAnimating) {
      onChange(value + 1)
    }
  }

  // Split number into digits for individual animation
  const digits = value.toString().split("")

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-background/50 backdrop-blur-sm p-1.5",
        className
      )}
      style={{ perspective: "500px" }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrement}
        disabled={value <= min || isAnimating}
        className={cn(
          classes.button,
          "rounded-md transition-all duration-200",
          "hover:bg-foreground hover:text-background active:scale-90"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={classes.icon} />
      </Button>

      <div
        ref={flipContainerRef}
        className={cn(
          classes.number,
          "relative flex items-center justify-center overflow-hidden font-mono font-medium"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {digits.map((digit, i) => (
          <span
            key={`${i}-${digit}`}
            className="digit inline-block"
            style={{ transformStyle: "preserve-3d" }}
          >
            {digit}
          </span>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrement}
        disabled={value >= max || isAnimating}
        className={cn(
          classes.button,
          "rounded-md transition-all duration-200",
          "hover:bg-foreground hover:text-background active:scale-90"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={classes.icon} />
      </Button>
    </div>
  )
}
