/**
 * @fileoverview Error boundary for categories route.
 * Handles errors in category listing and detail pages.
 *
 * @module app/(store)/categories/error
 */

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CategoriesErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function CategoriesError({ error, reset }: CategoriesErrorProps) {
  useEffect(() => {
    console.error("[Categories Error]:", error)
  }, [error])

  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">
          Unable to load categories
        </h1>

        <p className="text-muted-foreground mb-8">
          We&apos;re having trouble loading the categories. Please try again.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button asChild>
            <Link href="/products" className="gap-2">
              View All Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
