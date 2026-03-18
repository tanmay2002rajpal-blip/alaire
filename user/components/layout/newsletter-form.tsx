"use client"

import { useState, useRef, useEffect } from "react"
import { gsap } from "gsap"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { subscribeToNewsletter } from "@/lib/actions/newsletter"
import { useSession } from "next-auth/react"

interface NewsletterFormProps {
  variant?: "default" | "minimal" | "large"
  className?: string
}

export function NewsletterForm({ variant = "default", className }: NewsletterFormProps) {
  const { data: session, status: sessionStatus } = useSession()
  const isAuthenticated = sessionStatus === "authenticated" && !!session?.user?.email
  const userEmail = session?.user?.email || ""

  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle")
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  // Auto-fill email if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setEmail(userEmail)
    }
  }, [isAuthenticated, userEmail])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 4000)
      return
    }

    setStatus("loading")

    const result = await subscribeToNewsletter(email)

    if (result.error === "Email already subscribed") {
      setStatus("already")
      setTimeout(() => setStatus("idle"), 4000)
      return
    }

    if (result.success) {
      setStatus("success")

      // If we're not authenticated, clear the input so they see it was submitted.
      if (!isAuthenticated) {
        setEmail("")
      }

      // Animate success message
      if (successRef.current) {
        gsap.fromTo(
          successRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }
        )
      }

      setTimeout(() => setStatus("idle"), 4000)
    } else {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 4000)
    }
  }

  const renderSubmitButton = (btnClass: string, isMinimal = false) => {
    return (
      <Button
        type="submit"
        size={variant === "large" ? "lg" : isMinimal ? "icon" : "default"}
        variant={isMinimal ? "ghost" : "default"}
        className={btnClass}
        disabled={status === "loading" || status === "success" || status === "already"}
      >
        {status === "loading" ? (
          <Loader2 className={cn("animate-spin", isMinimal ? "h-4 w-4" : "h-5 w-5")} />
        ) : status === "success" ? (
          isMinimal ? <Check className="h-4 w-4 text-green-600" /> : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Subscribed
            </>
          )
        ) : status === "already" ? (
          isMinimal ? <Check className="h-4 w-4 text-amber-500" /> : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Already Subscribed
            </>
          )
        ) : isMinimal ? (
          <ArrowRight className="h-4 w-4" />
        ) : isAuthenticated && variant === "large" ? (
          "Subscribe to the email"
        ) : (
          <>
            Subscribe
            {!isMinimal && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /> }
          </>
        )}
      </Button>
    )
  }

  if (variant === "large") {
    return (
      <div className={cn("space-y-6", className)}>
        <form ref={formRef} onSubmit={handleSubmit} className={cn("flex gap-3", isAuthenticated ? "justify-center" : "flex-col sm:flex-row")}>
          {!isAuthenticated && (
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 bg-white/5 border-0 border-b border-white/10 rounded-none px-5 text-base text-white placeholder:text-white/40 focus-visible:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={status === "loading" || status === "success"}
              required
            />
          )}
          {renderSubmitButton(cn("h-14 group transition-all", isAuthenticated ? "w-full max-w-md bg-white text-black hover:bg-white/90 rounded-xl" : "px-8 min-w-[160px]"))}
        </form>
        {status === "success" && (
          <div ref={successRef} className="text-sm text-center text-white/50">
             Thank you for subscribing. You'll receive our latest updates soon.
          </div>
        )}
        {status === "already" && (
          <p className="text-sm text-center text-amber-400">You're already subscribed to our newsletter!</p>
        )}
        {status === "error" && (
          <p className="text-sm text-center text-red-500">Something went wrong. Please try again.</p>
        )}
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <form ref={formRef} onSubmit={handleSubmit} className={cn("relative", className)}>
        {!isAuthenticated && (
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 pr-12 bg-transparent border-foreground/20 text-sm placeholder:text-muted-foreground/60"
            disabled={status === "loading"}
            required
          />
        )}
        {isAuthenticated ? (
          renderSubmitButton("w-full h-12 bg-primary text-primary-foreground")
        ) : (
           renderSubmitButton("absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10", true)
        )}
      </form>
    )
  }

  // Default variant
  return (
    <div className={cn("space-y-4", className)}>
      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
        {!isAuthenticated && (
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 flex-1 bg-transparent border-foreground/20 text-sm"
            disabled={status === "loading"}
            required
          />
        )}
        {renderSubmitButton(cn("h-11", isAuthenticated ? "w-full px-6 bg-primary text-primary-foreground" : "px-6"))}
      </form>
      {status === "success" && (
        <p className="text-sm text-muted-foreground text-center">Thank you for subscribing!</p>
      )}
      {status === "already" && (
        <p className="text-sm text-amber-600 text-center">You're already subscribed to our newsletter!</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500 text-center">Something went wrong. Please try again.</p>
      )}
    </div>
  )
}
