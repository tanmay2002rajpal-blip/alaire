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
