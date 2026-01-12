/**
 * @fileoverview Error boundary for account route.
 * Handles errors in all account-related pages.
 *
 * @module app/(store)/account/error
 */

"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RefreshCw, Home, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AccountErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AccountError({ error, reset }: AccountErrorProps) {
  useEffect(() => {
    console.error("[Account Error]:", error)
  }, [error])

  // Check if it's an auth-related error
  const isAuthError = error.message?.toLowerCase().includes("auth") ||
                      error.message?.toLowerCase().includes("unauthorized")

  return (
    <div className="container py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-2xl font-semibold mb-2">
          {isAuthError ? "Session Expired" : "Account Error"}
        </h1>

        <p className="text-muted-foreground mb-8">
          {isAuthError
            ? "Your session has expired. Please sign in again to continue."
            : "We're having trouble loading your account information."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthError ? (
            <Button asChild>
              <Link href="/auth/login" className="gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            </Button>
          ) : (
            <>
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
            </>
          )}
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
