# Production-Ready Alaire Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement production-ready features for Alaire e-commerce: promo banner, Google OAuth auth dialog, Shiprocket delivery integration, Instagram feed, legal pages, error pages, and loading skeletons.

**Architecture:** Client-side auth dialog with React Context for global state, server-side Supabase OAuth, Shiprocket API for delivery serviceability/tracking, Instagram Basic Display API for feed, Next.js app router for pages.

**Tech Stack:** Next.js 14 (App Router), Supabase Auth, Shiprocket API, Instagram API, GSAP animations, shadcn/ui, TypeScript

---

## Task 1: Promotional Banner Component

**Files:**
- Create: `components/layout/promo-banner.tsx`
- Modify: `app/(store)/layout.tsx:11-13`
- Modify: `components/layout/index.ts` (add export)

**Step 1: Create the promo banner component**

```tsx
// components/layout/promo-banner.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { gsap } from "gsap"
import { cn } from "@/lib/utils"

const PROMO_MESSAGES = [
  "Free shipping on orders over Rs.999",
  "Use code WELCOME20 for 20% off",
  "New arrivals every week",
]

const STORAGE_KEY = "alaire-promo-dismissed"
const ROTATION_INTERVAL = 4000

export function PromoBanner() {
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden to avoid flash
  const [currentIndex, setCurrentIndex] = useState(0)
  const textRef = useRef<HTMLSpanElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    setIsDismissed(dismissed === "true")
  }, [])

  // Auto-rotate messages
  useEffect(() => {
    if (isDismissed) return

    const interval = setInterval(() => {
      if (textRef.current) {
        gsap.to(textRef.current, {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            setCurrentIndex((prev) => (prev + 1) % PROMO_MESSAGES.length)
            gsap.to(textRef.current, { opacity: 1, duration: 0.3 })
          },
        })
      }
    }, ROTATION_INTERVAL)

    return () => clearInterval(interval)
  }, [isDismissed])

  // Animate banner on mount
  useEffect(() => {
    if (isDismissed || !bannerRef.current) return

    gsap.fromTo(
      bannerRef.current,
      { y: -36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
    )
  }, [isDismissed])

  const handleDismiss = () => {
    if (bannerRef.current) {
      gsap.to(bannerRef.current, {
        y: -36,
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          setIsDismissed(true)
          localStorage.setItem(STORAGE_KEY, "true")
        },
      })
    }
  }

  if (isDismissed) return null

  return (
    <div
      ref={bannerRef}
      className="relative bg-foreground text-background"
    >
      <div className="container flex h-9 items-center justify-center">
        <span ref={textRef} className="text-xs sm:text-sm font-medium tracking-wide">
          {PROMO_MESSAGES[currentIndex]}
        </span>
        <button
          onClick={handleDismiss}
          className="absolute right-4 p-1 hover:opacity-70 transition-opacity"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Export the component from layout index**

In `components/layout/index.ts`, add:
```ts
export { PromoBanner } from "./promo-banner"
```

**Step 3: Add banner to store layout**

Modify `app/(store)/layout.tsx`:
```tsx
import { Header, Footer, PromoBanner } from "@/components/layout"
import { CartDrawer } from "@/components/cart"
import { LenisProvider } from "@/providers"

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LenisProvider>
      <div className="flex min-h-screen flex-col">
        <PromoBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </LenisProvider>
  )
}
```

**Step 4: Test the banner**

Run: `npm run dev`
Expected: Banner shows at top, rotates messages every 4s, dismiss button works, persists on reload

**Step 5: Commit**

```bash
git add components/layout/promo-banner.tsx components/layout/index.ts app/(store)/layout.tsx
git commit -m "feat: add promotional banner with rotating messages"
```

---

## Task 2: Auth Provider Context

**Files:**
- Create: `components/auth/auth-provider.tsx`
- Create: `components/auth/index.ts`
- Create: `lib/supabase/auth.ts`

**Step 1: Create auth actions file**

```ts
// lib/supabase/auth.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function signInWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

**Step 2: Create auth provider context**

```tsx
// components/auth/auth-provider.tsx
"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthDialogOpen: boolean
  openAuthDialog: () => void
  closeAuthDialog: () => void
  requireAuth: (callback: () => void) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser
}: {
  children: React.ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)

        // Execute pending callback after successful login
        if (event === "SIGNED_IN" && pendingCallback) {
          setIsAuthDialogOpen(false)
          pendingCallback()
          setPendingCallback(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [pendingCallback])

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false)
    setPendingCallback(null)
  }, [])

  const requireAuth = useCallback((callback: () => void) => {
    if (user) {
      callback()
    } else {
      setPendingCallback(() => callback)
      setIsAuthDialogOpen(true)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthDialogOpen,
        openAuthDialog,
        closeAuthDialog,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

**Step 3: Create index export**

```ts
// components/auth/index.ts
export { AuthProvider, useAuth } from "./auth-provider"
export { AuthDialog } from "./auth-dialog"
```

**Step 4: Commit**

```bash
git add lib/supabase/auth.ts components/auth/auth-provider.tsx components/auth/index.ts
git commit -m "feat: add auth provider context for global auth state"
```

---

## Task 3: Auth Dialog Component

**Files:**
- Create: `components/auth/auth-dialog.tsx`
- Modify: `components/auth/index.ts` (already has export)

**Step 1: Create the auth dialog**

```tsx
// components/auth/auth-dialog.tsx
"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "./auth-provider"
import { createClient } from "@/lib/supabase/client"

export function AuthDialog() {
  const { isAuthDialogOpen, closeAuthDialog } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Sign in error:", error)
      setIsLoading(false)
    }
    // Note: Don't set loading false on success - page will redirect
  }

  return (
    <Dialog open={isAuthDialogOpen} onOpenChange={(open) => !open && closeAuthDialog()}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={true}
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="font-serif text-3xl font-medium tracking-tight">
            ALAIRE
          </DialogTitle>
          <DialogDescription className="text-base">
            Sign in to continue
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <Button
            variant="outline"
            size="lg"
            className="w-full h-12 text-base"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground" onClick={closeAuthDialog}>
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground" onClick={closeAuthDialog}>
            Privacy Policy
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Commit**

```bash
git add components/auth/auth-dialog.tsx
git commit -m "feat: add Google OAuth auth dialog component"
```

---

## Task 4: Integrate Auth Provider into Layout

**Files:**
- Modify: `app/(store)/layout.tsx`
- Create: `app/auth/callback/route.ts`

**Step 1: Update store layout with auth provider**

```tsx
// app/(store)/layout.tsx
import { Header, Footer, PromoBanner } from "@/components/layout"
import { CartDrawer } from "@/components/cart"
import { AuthProvider, AuthDialog } from "@/components/auth"
import { LenisProvider } from "@/providers"
import { createClient } from "@/lib/supabase/server"

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <AuthProvider initialUser={user}>
      <LenisProvider>
        <div className="flex min-h-screen flex-col">
          <PromoBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </div>
        <AuthDialog />
      </LenisProvider>
    </AuthProvider>
  )
}
```

**Step 2: Create auth callback route**

```ts
// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to home with error
  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}
```

**Step 3: Commit**

```bash
git add app/(store)/layout.tsx app/auth/callback/route.ts
git commit -m "feat: integrate auth provider and callback route"
```

---

## Task 5: Update Header to Use Auth Dialog

**Files:**
- Modify: `components/layout/header.tsx:210-220`

**Step 1: Update header user button to trigger auth dialog**

Replace the account button section in `components/layout/header.tsx`:

```tsx
// In the imports, add:
import { useAuth } from "@/components/auth"

// Inside the Header function, add after const itemCount:
const { user, openAuthDialog } = useAuth()

// Replace the Account button (lines 210-220) with:
{/* Account */}
{user ? (
  <Link href="/account" className="hidden sm:block">
    <Button
      variant="ghost"
      size="icon"
      className="header-action h-10 w-10 rounded-full"
    >
      <User className="h-5 w-5" />
      <span className="sr-only">Account</span>
    </Button>
  </Link>
) : (
  <Button
    variant="ghost"
    size="icon"
    className="header-action h-10 w-10 rounded-full hidden sm:flex"
    onClick={openAuthDialog}
  >
    <User className="h-5 w-5" />
    <span className="sr-only">Sign in</span>
  </Button>
)}
```

Also update the mobile menu Account link:

```tsx
// Replace the Account link in mobile menu with:
{user ? (
  <Link
    href="/account"
    onClick={() => setIsMobileMenuOpen(false)}
    className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
  >
    Account
  </Link>
) : (
  <button
    onClick={() => {
      setIsMobileMenuOpen(false)
      openAuthDialog()
    }}
    className="text-left text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
  >
    Sign In
  </button>
)}
```

**Step 2: Test the auth flow**

Run: `npm run dev`
Expected: User icon opens auth dialog when not logged in, shows account page when logged in

**Step 3: Commit**

```bash
git add components/layout/header.tsx
git commit -m "feat: update header to use auth dialog for sign in"
```

---

## Task 6: Shiprocket API Integration

**Files:**
- Create: `lib/shiprocket/client.ts`
- Create: `lib/shiprocket/actions.ts`
- Create: `lib/shiprocket/types.ts`

**Step 1: Create Shiprocket types**

```ts
// lib/shiprocket/types.ts
export interface ShiprocketAuthResponse {
  token: string
}

export interface ServiceabilityRequest {
  pickup_postcode: string
  delivery_postcode: string
  weight: number // in kg
  cod: 0 | 1
}

export interface ServiceabilityResponse {
  status: number
  data: {
    available_courier_companies: CourierCompany[]
  }
}

export interface CourierCompany {
  courier_company_id: number
  courier_name: string
  rate: number
  etd: string // estimated delivery time
  estimated_delivery_days: number
}

export interface PincodeData {
  city: string
  state: string
  serviceable: boolean
  estimatedDays: number
  shippingCost: number
  courierName?: string
}

export interface TrackingResponse {
  tracking_data: {
    track_status: number
    shipment_status: number
    shipment_status_text: string
    shipment_track: TrackingEvent[]
    shipment_track_activities: TrackingActivity[]
  }
}

export interface TrackingEvent {
  id: number
  date: string
  status: string
  activity: string
  location: string
}

export interface TrackingActivity {
  date: string
  status: string
  activity: string
  location: string
}
```

**Step 2: Create Shiprocket client**

```ts
// lib/shiprocket/client.ts
import type { ShiprocketAuthResponse, ServiceabilityResponse, TrackingResponse } from "./types"

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1"

let cachedToken: string | null = null
let tokenExpiry: number = 0

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid (tokens last 10 days, we refresh after 9)
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/external/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to authenticate with Shiprocket")
  }

  const data: ShiprocketAuthResponse = await response.json()
  cachedToken = data.token
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000 // 9 days

  return cachedToken
}

export async function checkServiceability(
  pickupPincode: string,
  deliveryPincode: string,
  weight: number = 0.5,
  cod: 0 | 1 = 0
): Promise<ServiceabilityResponse> {
  const token = await getAuthToken()

  const params = new URLSearchParams({
    pickup_postcode: pickupPincode,
    delivery_postcode: deliveryPincode,
    weight: weight.toString(),
    cod: cod.toString(),
  })

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/external/courier/serviceability?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to check serviceability")
  }

  return response.json()
}

export async function trackShipment(awbNumber: string): Promise<TrackingResponse> {
  const token = await getAuthToken()

  const response = await fetch(
    `${SHIPROCKET_BASE_URL}/external/courier/track/awb/${awbNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!response.ok) {
    throw new Error("Failed to track shipment")
  }

  return response.json()
}

// Indian postal pincode to city/state lookup (fallback)
const PINCODE_DATA: Record<string, { city: string; state: string }> = {
  "110001": { city: "New Delhi", state: "Delhi" },
  "400001": { city: "Mumbai", state: "Maharashtra" },
  "560001": { city: "Bangalore", state: "Karnataka" },
  "600001": { city: "Chennai", state: "Tamil Nadu" },
  "700001": { city: "Kolkata", state: "West Bengal" },
  "500001": { city: "Hyderabad", state: "Telangana" },
  "380001": { city: "Ahmedabad", state: "Gujarat" },
  "411001": { city: "Pune", state: "Maharashtra" },
}

export function getPincodeDetails(pincode: string): { city: string; state: string } | null {
  // First check our local data
  if (PINCODE_DATA[pincode]) {
    return PINCODE_DATA[pincode]
  }

  // For a real implementation, you'd call an API here
  // For now, return null and let the user fill in
  return null
}
```

**Step 3: Create Shiprocket server actions**

```ts
// lib/shiprocket/actions.ts
"use server"

import { checkServiceability, trackShipment, getPincodeDetails } from "./client"
import type { PincodeData, TrackingActivity } from "./types"

// Default warehouse pincode (set this to your actual warehouse)
const WAREHOUSE_PINCODE = "400001" // Mumbai

export async function checkPincodeServiceability(
  pincode: string
): Promise<{ success: boolean; data?: PincodeData; error?: string }> {
  try {
    if (!/^[0-9]{6}$/.test(pincode)) {
      return { success: false, error: "Invalid pincode format" }
    }

    const response = await checkServiceability(WAREHOUSE_PINCODE, pincode)

    const couriers = response.data?.available_courier_companies ?? []

    if (couriers.length === 0) {
      // Try to get pincode details even if not serviceable
      const pincodeDetails = getPincodeDetails(pincode)

      return {
        success: true,
        data: {
          city: pincodeDetails?.city ?? "",
          state: pincodeDetails?.state ?? "",
          serviceable: false,
          estimatedDays: 0,
          shippingCost: 0,
        },
      }
    }

    // Get the cheapest/fastest option
    const bestCourier = couriers.reduce((best, current) =>
      current.rate < best.rate ? current : best
    )

    const pincodeDetails = getPincodeDetails(pincode)

    return {
      success: true,
      data: {
        city: pincodeDetails?.city ?? "",
        state: pincodeDetails?.state ?? "",
        serviceable: true,
        estimatedDays: bestCourier.estimated_delivery_days,
        shippingCost: bestCourier.rate,
        courierName: bestCourier.courier_name,
      },
    }
  } catch (error) {
    console.error("Serviceability check error:", error)
    return { success: false, error: "Failed to check serviceability" }
  }
}

export async function getOrderTracking(
  awbNumber: string
): Promise<{ success: boolean; data?: TrackingActivity[]; status?: string; error?: string }> {
  try {
    const response = await trackShipment(awbNumber)

    return {
      success: true,
      data: response.tracking_data.shipment_track_activities,
      status: response.tracking_data.shipment_status_text,
    }
  } catch (error) {
    console.error("Tracking error:", error)
    return { success: false, error: "Failed to get tracking information" }
  }
}
```

**Step 4: Commit**

```bash
git add lib/shiprocket/types.ts lib/shiprocket/client.ts lib/shiprocket/actions.ts
git commit -m "feat: add Shiprocket API integration for delivery serviceability and tracking"
```

---

## Task 7: Pincode Checker Component

**Files:**
- Create: `components/checkout/pincode-checker.tsx`

**Step 1: Create the pincode checker component**

```tsx
// components/checkout/pincode-checker.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, Check, X, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { checkPincodeServiceability } from "@/lib/shiprocket/actions"
import { formatPrice } from "@/lib/utils"
import type { PincodeData } from "@/lib/shiprocket/types"

interface PincodeCheckerProps {
  onServiceabilityChange?: (data: PincodeData | null) => void
  onCityStateChange?: (city: string, state: string) => void
}

export function PincodeChecker({
  onServiceabilityChange,
  onCityStateChange
}: PincodeCheckerProps) {
  const [pincode, setPincode] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<PincodeData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkPincode = useCallback(async (code: string) => {
    if (code.length !== 6) return

    setIsChecking(true)
    setError(null)

    const response = await checkPincodeServiceability(code)

    if (response.success && response.data) {
      setResult(response.data)
      onServiceabilityChange?.(response.data)

      if (response.data.city && response.data.state) {
        onCityStateChange?.(response.data.city, response.data.state)
      }
    } else {
      setError(response.error ?? "Failed to check pincode")
      setResult(null)
      onServiceabilityChange?.(null)
    }

    setIsChecking(false)
  }, [onServiceabilityChange, onCityStateChange])

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setPincode(value)

    // Auto-check when 6 digits entered
    if (value.length === 6) {
      checkPincode(value)
    } else {
      setResult(null)
      setError(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="pincode" className="sr-only">Pincode</Label>
          <Input
            id="pincode"
            placeholder="Enter pincode"
            value={pincode}
            onChange={handlePincodeChange}
            maxLength={6}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => checkPincode(pincode)}
          disabled={pincode.length !== 6 || isChecking}
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Check"
          )}
        </Button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`p-3 rounded-md text-sm ${
          result.serviceable
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}>
          {result.serviceable ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-700 font-medium">
                <Check className="h-4 w-4" />
                Delivery available
              </div>
              <div className="flex items-center gap-4 text-green-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  {result.estimatedDays}-{result.estimatedDays + 2} days
                </span>
                <span>
                  Shipping: {result.shippingCost === 0 ? "Free" : formatPrice(result.shippingCost)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-700">
              <X className="h-4 w-4" />
              Sorry, delivery not available to this pincode
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add components/checkout/pincode-checker.tsx
git commit -m "feat: add pincode serviceability checker component"
```

---

## Task 8: Integrate Pincode Checker into Checkout

**Files:**
- Modify: `components/checkout/checkout-form.tsx:269-330`

**Step 1: Import and add pincode checker to checkout form**

In `components/checkout/checkout-form.tsx`, add import:
```tsx
import { PincodeChecker } from "./pincode-checker"
```

Add state for shipping cost:
```tsx
const [shippingCost, setShippingCost] = useState(0)
const [isServiceable, setIsServiceable] = useState<boolean | null>(null)
```

Replace the Shipping Address CardContent (lines 269-330) to include PincodeChecker at the top:

```tsx
<CardContent className="space-y-4">
  {/* Pincode Checker First */}
  <div className="space-y-2">
    <Label>Check Delivery Availability</Label>
    <PincodeChecker
      onServiceabilityChange={(data) => {
        if (data) {
          setIsServiceable(data.serviceable)
          setShippingCost(data.shippingCost)
        } else {
          setIsServiceable(null)
          setShippingCost(0)
        }
      }}
      onCityStateChange={(city, state) => {
        setFormData((prev) => ({ ...prev, city, state }))
      }}
    />
  </div>

  {/* Only show rest of form if serviceable */}
  {isServiceable !== false && (
    <>
      <div className="space-y-2">
        <Label htmlFor="line1">Address Line 1</Label>
        <Input
          id="line1"
          name="line1"
          value={formData.line1}
          onChange={handleInputChange}
          placeholder="House/Flat No., Building Name"
          required
        />
      </div>
      {/* ... rest of address fields ... */}
    </>
  )}
</CardContent>
```

**Step 2: Commit**

```bash
git add components/checkout/checkout-form.tsx
git commit -m "feat: integrate pincode checker into checkout form"
```

---

## Task 9: Order Tracking Component

**Files:**
- Create: `components/account/order-tracking.tsx`
- Modify: `components/account/index.ts` (add export)

**Step 1: Create order tracking component**

```tsx
// components/account/order-tracking.tsx
"use client"

import { useState, useEffect } from "react"
import { Loader2, Package, Truck, CheckCircle2, Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrderTracking } from "@/lib/shiprocket/actions"
import type { TrackingActivity } from "@/lib/shiprocket/types"

interface OrderTrackingProps {
  awbNumber: string
  courierName?: string
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Delivered": <CheckCircle2 className="h-5 w-5 text-green-500" />,
  "Out for Delivery": <Truck className="h-5 w-5 text-blue-500" />,
  "In Transit": <Package className="h-5 w-5 text-purple-500" />,
  "Shipped": <MapPin className="h-5 w-5 text-indigo-500" />,
  "default": <Clock className="h-5 w-5 text-gray-400" />,
}

function getStatusIcon(status: string) {
  return STATUS_ICONS[status] ?? STATUS_ICONS.default
}

export function OrderTracking({ awbNumber, courierName }: OrderTrackingProps) {
  const [activities, setActivities] = useState<TrackingActivity[]>([])
  const [currentStatus, setCurrentStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTracking() {
      const result = await getOrderTracking(awbNumber)

      if (result.success && result.data) {
        setActivities(result.data)
        setCurrentStatus(result.status ?? "")
      } else {
        setError(result.error ?? "Failed to load tracking")
      }

      setIsLoading(false)
    }

    fetchTracking()
  }, [awbNumber])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Shipment Tracking
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {courierName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Status */}
        <div className="mb-6 flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          {getStatusIcon(currentStatus)}
          <div>
            <p className="font-semibold">{currentStatus}</p>
            <p className="text-sm text-muted-foreground">
              Tracking #: {awbNumber}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="relative space-y-0">
          {activities.map((activity, index) => (
            <div key={index} className="relative pb-6 last:pb-0">
              {/* Connecting line */}
              {index !== activities.length - 1 && (
                <div className="absolute left-[9px] top-5 h-full w-0.5 bg-border" />
              )}

              <div className="flex gap-4">
                {/* Dot */}
                <div className={`relative z-10 mt-1 h-5 w-5 rounded-full border-2 ${
                  index === 0
                    ? "bg-foreground border-foreground"
                    : "bg-background border-border"
                }`}>
                  {index === 0 && (
                    <div className="absolute inset-1 rounded-full bg-background" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${index === 0 ? "" : "text-muted-foreground"}`}>
                    {activity.status}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {activity.activity}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(activity.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}</span>
                    {activity.location && (
                      <>
                        <span>-</span>
                        <span>{activity.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Step 2: Export from index**

In `components/account/index.ts`, add:
```ts
export { OrderTracking } from "./order-tracking"
```

**Step 3: Commit**

```bash
git add components/account/order-tracking.tsx components/account/index.ts
git commit -m "feat: add order tracking component with Shiprocket integration"
```

---

## Task 10: Instagram Feed Component

**Files:**
- Create: `lib/instagram/types.ts`
- Create: `lib/instagram/api.ts`
- Create: `components/home/instagram-feed.tsx`
- Modify: `components/home/index.ts`

**Step 1: Create Instagram types**

```ts
// lib/instagram/types.ts
export interface InstagramMedia {
  id: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  timestamp: string
}

export interface InstagramResponse {
  data: InstagramMedia[]
  paging?: {
    cursors: {
      before: string
      after: string
    }
    next?: string
  }
}
```

**Step 2: Create Instagram API helper**

```ts
// lib/instagram/api.ts
import type { InstagramMedia, InstagramResponse } from "./types"

const INSTAGRAM_API_URL = "https://graph.instagram.com"

export async function getInstagramFeed(limit: number = 8): Promise<InstagramMedia[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID

  if (!accessToken || !userId) {
    console.warn("Instagram credentials not configured")
    return []
  }

  try {
    const response = await fetch(
      `${INSTAGRAM_API_URL}/${userId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&limit=${limit}&access_token=${accessToken}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data: InstagramResponse = await response.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch Instagram feed:", error)
    return []
  }
}
```

**Step 3: Create Instagram feed component**

```tsx
// components/home/instagram-feed.tsx
import Image from "next/image"
import Link from "next/link"
import { Instagram, Play, Heart, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getInstagramFeed } from "@/lib/instagram/api"
import { SOCIAL_LINKS } from "@/lib/constants"

// Fallback images for when API is not configured
const FALLBACK_IMAGES = [
  { id: "1", src: "/images/instagram/1.jpg" },
  { id: "2", src: "/images/instagram/2.jpg" },
  { id: "3", src: "/images/instagram/3.jpg" },
  { id: "4", src: "/images/instagram/4.jpg" },
  { id: "5", src: "/images/instagram/5.jpg" },
  { id: "6", src: "/images/instagram/6.jpg" },
]

export async function InstagramFeed() {
  const posts = await getInstagramFeed(8)
  const hasRealPosts = posts.length > 0

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl lg:text-3xl font-medium tracking-tight mb-2">
            Follow us @alaire.official
          </h2>
          <p className="text-muted-foreground">
            Join our community and stay inspired
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4">
          {hasRealPosts ? (
            posts.slice(0, 6).map((post) => (
              <Link
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <Image
                  src={post.media_type === "VIDEO" ? (post.thumbnail_url ?? post.media_url) : post.media_url}
                  alt={post.caption ?? "Instagram post"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />

                {/* Video indicator */}
                {post.media_type === "VIDEO" && (
                  <div className="absolute top-2 right-2">
                    <Play className="h-5 w-5 text-white drop-shadow-md" fill="white" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Instagram className="h-8 w-8 text-white" />
                </div>
              </Link>
            ))
          ) : (
            // Fallback placeholder grid
            FALLBACK_IMAGES.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <Instagram className="h-8 w-8 text-muted-foreground/40" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <Instagram className="h-4 w-4" />
              Follow on Instagram
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
```

**Step 4: Export from home index**

In `components/home/index.ts`, add:
```ts
export { InstagramFeed } from "./instagram-feed"
```

**Step 5: Commit**

```bash
git add lib/instagram/types.ts lib/instagram/api.ts components/home/instagram-feed.tsx components/home/index.ts
git commit -m "feat: add Instagram feed component"
```

---

## Task 11: Add Instagram Feed to Homepage

**Files:**
- Modify: `app/(store)/page.tsx`

**Step 1: Import and add InstagramFeed**

```tsx
// app/(store)/page.tsx
import {
  HeroCarousel,
  HeroSection,
  CategoryGrid,
  FeaturedProducts,
  NewsletterSection,
  InstagramFeed,
} from "@/components/home"
import { getFeaturedProducts, getCategories, getHeroSlides } from "@/lib/supabase/queries"

export default async function HomePage() {
  const [products, categories, heroSlides] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getHeroSlides(),
  ])

  const carouselSlides = heroSlides.map((slide) => ({
    id: slide.id,
    image: slide.image_url,
    title: slide.title,
    subtitle: slide.subtitle,
    description: slide.description,
    cta: {
      text: slide.button_text ?? "Shop Now",
      href: slide.button_link ?? "/products",
    },
    align: "left" as const,
  }))

  return (
    <div className="flex flex-col">
      <HeroCarousel slides={carouselSlides} />
      <HeroSection />
      <FeaturedProducts products={products} />
      <CategoryGrid categories={categories} />
      <InstagramFeed />
      <NewsletterSection />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add app/(store)/page.tsx
git commit -m "feat: add Instagram feed to homepage"
```

---

## Task 12: Legal Pages

**Files:**
- Create: `app/(store)/terms/page.tsx`
- Create: `app/(store)/privacy/page.tsx`
- Create: `app/(store)/returns/page.tsx`

**Step 1: Create Terms of Service page**

```tsx
// app/(store)/terms/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
}

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <h1 className="font-serif text-3xl lg:text-4xl font-medium tracking-tight mb-2">
        Terms of Service
      </h1>
      <p className="text-muted-foreground mb-8">
        Last updated: December 2024
      </p>

      <div className="prose prose-neutral max-w-none">
        <h2>1. Introduction</h2>
        <p>
          Welcome to Alaire. By accessing or using our website and services, you agree to be bound by these Terms of Service. Please read them carefully before using our platform.
        </p>

        <h2>2. Use of Service</h2>
        <p>
          You must be at least 18 years old to use our services. By using our website, you represent that you are of legal age to form a binding contract. You agree to use our services only for lawful purposes and in accordance with these Terms.
        </p>

        <h2>3. Products and Pricing</h2>
        <p>
          All products displayed on our website are subject to availability. We reserve the right to modify prices at any time without prior notice. All prices are in Indian Rupees (INR) and include applicable taxes unless otherwise stated.
        </p>

        <h2>4. Orders and Payments</h2>
        <p>
          When you place an order, you are making an offer to purchase. We reserve the right to accept or decline your order. Payment must be made at the time of order through our secure payment gateway. We accept major credit cards, debit cards, UPI, and net banking.
        </p>

        <h2>5. Shipping and Delivery</h2>
        <p>
          We aim to deliver products within the estimated timeframe shown at checkout. Delivery times may vary based on location and availability. Risk of loss and title pass to you upon delivery.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content on this website, including text, images, logos, and designs, is the property of Alaire and is protected by intellectual property laws. You may not use, reproduce, or distribute our content without written permission.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Alaire shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
        </p>

        <h2>9. Contact</h2>
        <p>
          For any questions regarding these Terms, please contact us at legal@alaire.com.
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Create Privacy Policy page**

```tsx
// app/(store)/privacy/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <h1 className="font-serif text-3xl lg:text-4xl font-medium tracking-tight mb-2">
        Privacy Policy
      </h1>
      <p className="text-muted-foreground mb-8">
        Last updated: December 2024
      </p>

      <div className="prose prose-neutral max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information you provide directly, including name, email, phone number, shipping address, and payment details when you make a purchase. We also collect usage data through cookies and analytics tools.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use your information to process orders, communicate with you, improve our services, send promotional content (with your consent), and comply with legal obligations.
        </p>

        <h2>3. Information Sharing</h2>
        <p>
          We share your information with payment processors, shipping partners, and service providers who assist in operating our business. We do not sell your personal information to third parties.
        </p>

        <h2>4. Cookies</h2>
        <p>
          We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings.
        </p>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal information. You may also opt out of marketing communications at any time by clicking the unsubscribe link in our emails.
        </p>

        <h2>7. Third-Party Services</h2>
        <p>
          Our website may contain links to third-party sites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
        </p>

        <h2>8. Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on our website with an updated effective date.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          For privacy-related inquiries, contact us at privacy@alaire.com.
        </p>
      </div>
    </div>
  )
}
```

**Step 3: Create Return Policy page**

```tsx
// app/(store)/returns/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Return Policy",
}

export default function ReturnsPage() {
  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <h1 className="font-serif text-3xl lg:text-4xl font-medium tracking-tight mb-2">
        Return & Exchange Policy
      </h1>
      <p className="text-muted-foreground mb-8">
        Last updated: December 2024
      </p>

      <div className="prose prose-neutral max-w-none">
        <h2>1. Return Window</h2>
        <p>
          We accept returns within 7 days of delivery. Items must be unused, in their original packaging, with all tags attached. Sale items and certain categories may have different return policies.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          To be eligible for a return, items must be in the same condition you received them. Items that show signs of use, washing, or damage are not eligible for returns.
        </p>

        <h2>3. How to Initiate a Return</h2>
        <p>
          To start a return, log into your account, go to Order History, and select the item you wish to return. Follow the prompts to generate a return request. Alternatively, contact our support team.
        </p>

        <h2>4. Exchange Process</h2>
        <p>
          For exchanges, initiate a return and place a new order for the desired item. Once we receive your return, we will process the refund. This ensures faster delivery of your new item.
        </p>

        <h2>5. Refund Timeline</h2>
        <p>
          Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method or store wallet, based on your preference.
        </p>

        <h2>6. Return Shipping</h2>
        <p>
          Return shipping costs are the responsibility of the customer unless the return is due to our error (wrong item, damaged product). We provide prepaid shipping labels for eligible returns.
        </p>

        <h2>7. Non-Returnable Items</h2>
        <p>
          The following items cannot be returned: intimate apparel, swimwear, customized products, gift cards, and items marked as final sale.
        </p>

        <h2>8. Damaged or Defective Items</h2>
        <p>
          If you receive a damaged or defective item, contact us within 48 hours of delivery with photos. We will arrange for a replacement or full refund at no additional cost.
        </p>

        <h2>9. Contact</h2>
        <p>
          For return inquiries, email us at returns@alaire.com or call our customer service line.
        </p>
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add app/(store)/terms/page.tsx app/(store)/privacy/page.tsx app/(store)/returns/page.tsx
git commit -m "feat: add legal pages (terms, privacy, returns)"
```

---

## Task 13: Error Pages

**Files:**
- Create: `app/not-found.tsx`
- Create: `app/error.tsx`

**Step 1: Create 404 page**

```tsx
// app/not-found.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <span className="font-serif text-4xl font-medium tracking-tight">
          ALAIRE
        </span>

        <div className="mt-8 mb-4">
          <h1 className="text-2xl font-semibold">Page not found</h1>
        </div>

        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Button asChild size="lg">
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
```

**Step 2: Create error page**

```tsx
// app/error.tsx
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <span className="font-serif text-4xl font-medium tracking-tight">
          ALAIRE
        </span>

        <div className="mt-8 mb-4">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
        </div>

        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
          We&apos;re having trouble loading this page. Please try again.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline" size="lg">
            Try Again
          </Button>
          <Button asChild size="lg">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add app/not-found.tsx app/error.tsx
git commit -m "feat: add custom 404 and error pages"
```

---

## Task 14: Skeleton Loading Components

**Files:**
- Create: `components/ui/skeletons.tsx`

**Step 1: Create skeleton variants**

```tsx
// components/ui/skeletons.tsx
import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function ProductCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {/* Image */}
      <div className="aspect-[3/4] w-full rounded-lg bg-muted" />
      {/* Title */}
      <div className="mt-4 h-4 w-3/4 rounded bg-muted" />
      {/* Price */}
      <div className="mt-2 h-4 w-1/4 rounded bg-muted" />
    </div>
  )
}

export function ProductGridSkeleton({
  count = 8,
  className
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={cn(
      "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6",
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse grid lg:grid-cols-2 gap-8", className)}>
      {/* Image gallery */}
      <div className="space-y-4">
        <div className="aspect-square rounded-lg bg-muted" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square w-20 rounded bg-muted" />
          ))}
        </div>
      </div>

      {/* Product info */}
      <div className="space-y-6">
        <div className="h-8 w-3/4 rounded bg-muted" />
        <div className="h-6 w-1/4 rounded bg-muted" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
        <div className="h-12 w-full rounded bg-muted" />
      </div>
    </div>
  )
}

export function CartItemSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse flex gap-4", className)}>
      <div className="h-24 w-20 rounded bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-1/4 rounded bg-muted" />
        <div className="h-8 w-24 rounded bg-muted" />
      </div>
    </div>
  )
}

export function OrderCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-lg border p-4", className)}>
      <div className="flex justify-between mb-4">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-5 w-20 rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
    </div>
  )
}

export function AccountSectionSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse space-y-6", className)}>
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Export from UI index if it exists, or add to exports**

```bash
# Check if index.ts exists
ls components/ui/index.ts
```

If it exists, add export. Otherwise, usage is direct import.

**Step 3: Commit**

```bash
git add components/ui/skeletons.tsx
git commit -m "feat: add skeleton loading components for products, cart, and orders"
```

---

## Task 15: Remove Old Auth Pages

**Files:**
- Delete: `app/(auth)/auth/login/page.tsx`
- Delete: `app/(auth)/auth/signup/page.tsx`
- Delete: `app/(auth)/auth/forgot-password/page.tsx`
- Delete: `app/(auth)/auth/reset-password/page.tsx`
- Modify: `app/(auth)/auth/actions.ts` (keep only logout and getUser)

**Step 1: Delete old auth pages**

```bash
rm -rf app/(auth)/auth/login
rm -rf app/(auth)/auth/signup
rm -rf app/(auth)/auth/forgot-password
rm -rf app/(auth)/auth/reset-password
```

**Step 2: Update auth actions to keep only needed functions**

```ts
// app/(auth)/auth/actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/")
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove email/password auth pages (Google OAuth only)"
```

---

## Task 16: Update Footer Links

**Files:**
- Modify: `lib/constants.ts`

**Step 1: Update FOOTER_LINKS to include Returns**

Verify `lib/constants.ts` has correct links. The footer already has `/returns` in help section. Ensure it's correct:

```ts
help: [
  { href: '/contact', label: 'Contact Us' },
  { href: '/shipping', label: 'Shipping Info' },
  { href: '/returns', label: 'Returns & Exchanges' },
  { href: '/faq', label: 'FAQ' },
],
```

**Step 2: Commit if changes were made**

```bash
git add lib/constants.ts
git commit -m "chore: verify footer links include legal pages"
```

---

## Task 17: Database Migration for Shiprocket Fields

**Files:**
- Create: `supabase/migrations/XXXXXX_add_shiprocket_fields.sql`

**Step 1: Create migration file**

```sql
-- supabase/migrations/20241225000001_add_shiprocket_fields.sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT,
ADD COLUMN IF NOT EXISTS awb_number TEXT,
ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- Add index for tracking lookups
CREATE INDEX IF NOT EXISTS idx_orders_awb_number ON orders(awb_number) WHERE awb_number IS NOT NULL;
```

**Step 2: Apply migration**

Run: `npx supabase db push`
Or apply via Supabase dashboard

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: add Shiprocket tracking fields to orders table"
```

---

## Task 18: Update Order Detail Page with Tracking

**Files:**
- Modify: `app/(store)/account/orders/[id]/page.tsx`

**Step 1: Import and add OrderTracking component**

In the order detail page, update to include Shiprocket tracking:

Add import:
```tsx
import { OrderTracking } from "@/components/account"
```

Replace the existing tracking card section (lines 186-205) with:

```tsx
{/* Shiprocket Tracking */}
{order.awb_number && (
  <OrderTracking
    awbNumber={order.awb_number}
    courierName={order.courier_name ?? undefined}
  />
)}
```

**Step 2: Commit**

```bash
git add app/(store)/account/orders/[id]/page.tsx
git commit -m "feat: integrate Shiprocket tracking into order detail page"
```

---

## Task 19: Environment Variables Documentation

**Files:**
- Modify: `.env.example` (or create if doesn't exist)

**Step 1: Document required environment variables**

```bash
# .env.example

# Existing - Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Shiprocket API
SHIPROCKET_EMAIL=your-shiprocket-email
SHIPROCKET_PASSWORD=your-shiprocket-password

# Instagram Basic Display API
INSTAGRAM_ACCESS_TOKEN=your-instagram-token
INSTAGRAM_USER_ID=your-instagram-user-id
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add environment variables documentation"
```

---

## Task 20: Final Integration Test

**Step 1: Run development server**

```bash
npm run dev
```

**Step 2: Test each feature**

1. **Promo Banner**: Should show at top, rotate messages, dismiss works
2. **Auth Dialog**: Click user icon when logged out, Google button appears
3. **Checkout Pincode**: Enter pincode on checkout, serviceability shows
4. **Instagram Feed**: Shows on homepage (placeholder if no API keys)
5. **Legal Pages**: Navigate to /terms, /privacy, /returns
6. **Error Pages**: Navigate to non-existent page, see 404
7. **Loading States**: Skeletons appear during data fetch

**Step 3: Run build to check for errors**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete production-ready implementation

- Promotional banner with rotating messages
- Google OAuth auth dialog
- Shiprocket pincode serviceability and tracking
- Instagram feed integration
- Legal pages (terms, privacy, returns)
- Custom 404 and error pages
- Loading skeleton components
- Removed email/password authentication"
```

---

## Summary

This implementation plan covers all features from the design document:

1. **Promo Banner** (Task 1) - Rotating messages, dismissible, GSAP animations
2. **Auth System** (Tasks 2-5) - AuthProvider, AuthDialog, Google OAuth only
3. **Shiprocket** (Tasks 6-9, 17-18) - Pincode check, order tracking, DB migration
4. **Instagram Feed** (Tasks 10-11) - API integration with fallback
5. **Legal Pages** (Task 12) - Terms, Privacy, Returns
6. **Error Pages** (Task 13) - 404 and error handling
7. **Loading States** (Task 14) - Skeleton components
8. **Cleanup** (Tasks 15-16) - Remove old auth, update links
9. **Documentation** (Task 19) - Environment variables

Total: 20 tasks, each with small commits for easy rollback.
