"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WishlistState {
  items: string[] // Array of product IDs
  hydrated: boolean // whether the DB wishlist has been merged in for this session

  // Actions
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  toggleWishlist: (productId: string) => void
  clearWishlist: () => void
  setItems: (productIds: string[]) => void
  hydrateFromServer: () => Promise<void>

  // Computed
  isInWishlist: (productId: string) => boolean
  getItemCount: () => number
}

// Module-level guard so multiple WishlistButton instances don't each trigger
// a hydration fetch on mount.
let hydrationPromise: Promise<void> | null = null

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,

      addItem: (productId) => {
        const { items } = get()
        if (!items.includes(productId)) {
          set({ items: [...items, productId] })
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        }))
      },

      toggleWishlist: (productId) => {
        const { items, addItem, removeItem } = get()
        if (items.includes(productId)) {
          removeItem(productId)
        } else {
          addItem(productId)
        }
      },

      clearWishlist: () => {
        set({ items: [] })
      },

      setItems: (productIds) => {
        set({ items: Array.from(new Set(productIds)) })
      },

      // Merge the authenticated user's DB wishlist into the store on login.
      // Runs at most once per session (guarded by hydrationPromise).
      hydrateFromServer: async () => {
        if (get().hydrated || hydrationPromise) {
          await hydrationPromise
          return
        }
        hydrationPromise = (async () => {
          try {
            const res = await fetch("/api/account/wishlist")
            if (res.ok) {
              const data = await res.json()
              const serverIds: string[] = (data.items || [])
                .map((i: { product_id?: string }) => i.product_id)
                .filter(Boolean)
              // Union server + any local (guest) items so nothing is lost.
              const merged = Array.from(new Set([...get().items, ...serverIds]))
              set({ items: merged, hydrated: true })
            } else {
              set({ hydrated: true })
            }
          } catch {
            set({ hydrated: true })
          }
        })()
        await hydrationPromise
      },

      isInWishlist: (productId) => {
        return get().items.includes(productId)
      },

      getItemCount: () => {
        return get().items.length
      },
    }),
    {
      name: "wishlist-storage",
    }
  )
)
