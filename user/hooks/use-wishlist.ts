"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface WishlistState {
  items: string[] // Array of product IDs

  // Actions
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  toggleWishlist: (productId: string) => void
  clearWishlist: () => void

  // Computed
  isInWishlist: (productId: string) => boolean
  getItemCount: () => number
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

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
