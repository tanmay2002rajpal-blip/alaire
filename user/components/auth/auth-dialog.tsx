"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, Mail } from "lucide-react"
import { signIn } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog"
import { useAuth } from "./auth-provider"
import { toast } from "sonner"

export function AuthDialog() {
  const { isAuthDialogOpen, closeAuthDialog, setUserFromLogin } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"email" | "otp">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address.")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        throw new Error("Failed to send OTP")
      }

      toast.success("Verification code sent to your email.")
      setStep("otp")
    } catch (error) {
      toast.error("Failed to send code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit code.")
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        otp,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid or expired code. Please try again.")
        setIsLoading(false)
        return
      }

      // signIn succeeded — the JWT cookie *should* be set, but regardless,
      // also persist the user in localStorage so all client components see it immediately
      // Fetch actual session data from the server to get the user id
      try {
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()
        if (sessionData?.user) {
          setUserFromLogin({
            id: sessionData.user.id || sessionData.user.sub || email,
            email: sessionData.user.email || email,
            name: sessionData.user.name || null,
            image: sessionData.user.image || null,
          })
        } else {
          // Fallback: even if session endpoint didn't return user, store email-based user
          setUserFromLogin({
            id: email,
            email,
            name: null,
            image: null,
          })
        }
      } catch {
        // Fallback: store email-based user
        setUserFromLogin({
          id: email,
          email,
          name: null,
          image: null,
        })
      }

      toast.success("Welcome to Alaire!")
      closeAuthDialog()
      router.refresh()
      setIsLoading(false)
    } catch (error) {
      toast.error("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handleLinkClick = () => {
    closeAuthDialog()
  }

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={closeAuthDialog}>
      <DialogOverlay className="bg-background/80 backdrop-blur-md transition-all duration-500" />
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-border bg-background shadow-2xl rounded-2xl ring-1 ring-foreground/5 text-foreground">
        <div className="relative px-8 py-10 md:py-12 flex flex-col items-center">
          {/* Subtle glowing background orb */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-primary/10 to-transparent opacity-80 pointer-events-none" />

          <DialogHeader className="text-center space-y-4 mb-10 relative z-10 w-full">
            <h1 className="text-3xl font-serif tracking-widest text-primary">ALAIRE</h1>
            <DialogTitle className="text-xl font-medium tracking-wide">
              {step === "email" ? "Sign In" : "Verification"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm max-w-[280px] mx-auto">
              {step === "email"
                ? "Enter your email to receive a secure login code."
                : `We sent a 6-digit code to ${email}`}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full relative z-10">
            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2 relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors duration-300" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-background transition-all duration-300 placeholder:text-muted-foreground/50 text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-primary text-primary-foreground font-medium tracking-wide rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    className="w-full text-center tracking-[0.5em] text-2xl font-mono px-4 py-3.5 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-background transition-all duration-300 placeholder:text-muted-foreground/40 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm text-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-medium tracking-wide rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    "Verify & Sign In"
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 underline-offset-4 hover:underline"
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-border w-full relative z-10">
            <p className="text-xs text-center text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
              By continuing, you agree to Alaire's{" "}
              <Link
                href="/terms"
                onClick={handleLinkClick}
                className="text-foreground/70 hover:text-foreground transition-colors duration-300 underline underline-offset-2"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                onClick={handleLinkClick}
                className="text-foreground/70 hover:text-foreground transition-colors duration-300 underline underline-offset-2"
              >
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
