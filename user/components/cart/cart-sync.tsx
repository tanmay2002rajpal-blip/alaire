'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { useCart } from '@/hooks/use-cart'
import { syncCartToDb } from '@/lib/actions/cart-sync'

// Generate a random guest ID and store it in localStorage
function getGuestId() {
  if (typeof window === 'undefined') return 'guest'
  
  let gid = localStorage.getItem('alaire_guest_id')
  if (!gid) {
    gid = 'guest_' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('alaire_guest_id', gid)
  }
  return gid
}

export function CartSync() {
  const { user, isLoading } = useAuth()
  const items = useCart(state => state.items)
  
  const prevItemsRef = useRef<string>('')
  const prevUserRef = useRef<string | null>(null)
  
  useEffect(() => {
    // Only proceed if auth has finished loading
    if (isLoading) return

    const currentItemsStr = JSON.stringify(items)
    const currentUserId = user?.email || user?.id || null
    
    // Check if items or user identity changed
    if (prevItemsRef.current !== currentItemsStr || prevUserRef.current !== currentUserId) {
      prevItemsRef.current = currentItemsStr
      prevUserRef.current = currentUserId
      
      const userId = currentUserId || getGuestId()
      const userName = user?.name || null
      
      // If user is logged in, pass guest ID so server can clean up old guest cart entry
      const guestIdToReplace = currentUserId && typeof window !== 'undefined'
        ? localStorage.getItem('alaire_guest_id')
        : null
      
      // Sync to DB (server action will delete guest entry first if needed)
      syncCartToDb(userId, items, userName, guestIdToReplace).catch(err => {
        console.error('Failed to sync cart:', err)
      })
    }
  }, [items, user, isLoading])

  return null
}
