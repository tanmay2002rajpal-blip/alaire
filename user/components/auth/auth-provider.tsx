"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { type User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthDialogOpen: boolean
  openAuthDialog: () => void
  closeAuthDialog: () => void
  requireAuth: (callback: () => void) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  initialUser: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)

  const supabase = createClient()

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
      openAuthDialog()
    }
  }, [user, openAuthDialog])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (event === "SIGNED_IN" && currentUser) {
        if (pendingCallback) {
          pendingCallback()
          setPendingCallback(null)
        }
        closeAuthDialog()
      }

      if (event === "SIGNED_OUT") {
        setUser(null)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, pendingCallback, closeAuthDialog])

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
    requireAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
