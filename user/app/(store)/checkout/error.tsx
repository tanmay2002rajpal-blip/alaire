/**
 * @fileoverview Error boundary for checkout route.
 * Handles errors during the checkout process.
 *
 * @module app/(store)/checkout/error
 */

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CheckoutErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CheckoutError({ error, reset }: CheckoutErrorProps) {
  useEffect(() => {
    console.error("[Checkout Error]:", error)
  }, [error])

  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">
          Checkout Error
        </h1>

        <p className="text-muted-foreground mb-4">
          We encountered an issue while processing your checkout.
          Your cart items are still saved.
        </p>

        <p className="text-sm text-muted-foreground mb-8">
          If you were in the middle of payment, please check your email for confirmation
          before trying again.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/cart" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Back to Cart
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
