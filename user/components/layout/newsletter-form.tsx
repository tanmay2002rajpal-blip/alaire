"use client"

import { useState, useRef } from "react"
import { gsap } from "gsap"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { subscribeToNewsletter } from "@/lib/actions/newsletter"

interface NewsletterFormProps {
  variant?: "default" | "minimal" | "large"
  className?: string
}

export function NewsletterForm({ variant = "default", className }: NewsletterFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus("loading")

    const result = await subscribeToNewsletter(email)

    if (result.success) {
      setStatus("success")
      setEmail("")

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

  if (variant === "large") {
    return (
      <div className={cn("space-y-6", className)}>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 bg-white/5 border-0 border-b border-white/10 rounded-none px-5 text-base text-white placeholder:text-white/40 focus-visible:border-white/30 focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={status === "loading"}
            required
          />
          <Button
            type="submit"
            size="lg"
            className="h-14 px-8 min-w-[160px] group"
            disabled={status === "loading"}
          >
            {status === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : status === "success" ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Subscribed
              </>
            ) : (
              <>
                Subscribe
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>
        {status === "success" && (
          <div ref={successRef} className="text-sm text-muted-foreground">
            Thank you for subscribing. You&apos;ll receive our latest updates soon.
          </div>
        )}
        {status === "error" && (
          <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
        )}
      </div>
    )
  }

  if (variant === "minimal") {
    return (
      <form ref={formRef} onSubmit={handleSubmit} className={cn("relative", className)}>
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 pr-12 bg-transparent border-foreground/20 text-sm placeholder:text-muted-foreground/60"
          disabled={status === "loading"}
          required
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "success" ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
      </form>
    )
  }

  // Default variant
  return (
    <div className={cn("space-y-4", className)}>
      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 flex-1 bg-transparent border-foreground/20 text-sm"
          disabled={status === "loading"}
          required
        />
        <Button
          type="submit"
          className="h-11 px-6"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>
      {status === "success" && (
        <p className="text-sm text-muted-foreground">Thank you for subscribing!</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
      )}
    </div>
  )
}
