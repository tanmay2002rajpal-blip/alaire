/**
 * @fileoverview Error boundary for products route.
 * Handles errors in product listing and detail pages.
 *
 * @module app/(store)/products/error
 */

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProductsErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error("[Products Error]:", error)
  }, [error])

  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">
          Unable to load products
        </h1>

        <p className="text-muted-foreground mb-8">
          We&apos;re having trouble loading the products. This might be a temporary issue.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/" className="gap-2">
              <Home className="w-4 h-4" />
              Go Home
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
