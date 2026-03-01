"use client"

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react"
import { SessionProvider, useSession } from "next-auth/react"

interface AuthContextValue {
  user: { id: string; name?: string | null; email?: string | null; image?: string | null } | null
  isLoading: boolean
  isAuthDialogOpen: boolean
  openAuthDialog: () => void
  closeAuthDialog: () => void
  requireAuth: (callback: () => void) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null)

  const user = session?.user
    ? {
        id: session.user.id as string,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }
    : null

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
    isLoading: status === "loading",
    isAuthDialogOpen,
    openAuthDialog,
    closeAuthDialog,
    requireAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

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
