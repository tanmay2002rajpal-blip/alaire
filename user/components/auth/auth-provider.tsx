"use client"

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react"
import { SessionProvider, useSession, signOut } from "next-auth/react"

// ============================================================================
// localStorage Helpers
// ============================================================================

const AUTH_STORAGE_KEY = "alaire_auth_user"

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function setStoredUser(user: AuthUser) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
  } catch {
    // Storage full or unavailable — non-fatal
  }
}

function clearStoredUser() {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // non-fatal
  }
}

// ============================================================================
// Types
// ============================================================================

interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthDialogOpen: boolean
  openAuthDialog: () => void
  closeAuthDialog: () => void
  requireAuth: (callback: () => void) => void
  setUserFromLogin: (user: AuthUser) => void
  logout: () => void
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)
  const [localUser, setLocalUser] = useState<AuthUser | null>(null)
  const [mounted, setMounted] = useState(false)

  // On mount, read from localStorage
  useEffect(() => {
    setMounted(true)
    const stored = getStoredUser()
    if (stored) {
      setLocalUser(stored)
    }
  }, [])

  // If middleware bounced a guest here with ?authRequired=1, auto-open the
  // sign-in popup (and remember where they were headed) instead of leaving
  // them stranded on the home page.
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("authRequired") === "1") {
      // Middleware (server) determined there is NO valid session. Any user
      // persisted in localStorage is stale — clear it, otherwise the effect
      // that runs pendingCallback on a truthy `user` would immediately
      // re-navigate to /checkout, get bounced by middleware, and loop.
      clearStoredUser()
      setLocalUser(null)
      const next = params.get("next")
      if (next) setPendingCallback(() => () => { window.location.href = next })
      setIsAuthDialogOpen(true)
      params.delete("authRequired")
      params.delete("next")
      const qs = params.toString()
      window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""))
    }
  }, [])

  // Sync NextAuth session -> localStorage when it becomes available
  useEffect(() => {
    if (session?.user?.id) {
      const u: AuthUser = {
        id: session.user.id as string,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
      setLocalUser(u)
      setStoredUser(u)
    }
  }, [session])

  // The effective user is whichever is available — the NextAuth session user first, or localStorage
  const user: AuthUser | null = session?.user
    ? {
        id: session.user.id as string,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : localUser

  // Called directly from AuthDialog after successful OTP verification
  const setUserFromLogin = useCallback((u: AuthUser) => {
    setLocalUser(u)
    setStoredUser(u)
  }, [])

  const logout = useCallback(() => {
    setLocalUser(null)
    clearStoredUser()
    signOut({ redirectTo: "/" })
  }, [])

  const openAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => {
    setIsAuthDialogOpen(false)
    setPendingCallback(null)
  }, [])

  const requireAuth = useCallback(
    (callback: () => void) => {
      if (user) {
        callback()
      } else {
        setPendingCallback(() => callback)
        openAuthDialog()
      }
    },
    [user, openAuthDialog]
  )

  // Execute pending callback when user signs in
  useEffect(() => {
    if (user && pendingCallback) {
      pendingCallback()
      setPendingCallback(null)
      closeAuthDialog()
    }
  }, [user, pendingCallback, closeAuthDialog])

  const value: AuthContextValue = {
    user,
    isLoading: !mounted || status === "loading",
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
    requireAuth,
    setUserFromLogin,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ============================================================================
// Provider
// ============================================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
