"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  variantName?: string
  price: number
  compareAtPrice?: number
  quantity: number
  image?: string
  maxQuantity?: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<CartItem, "id">) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void

  // Computed
  getItemCount: () => number
  getSubtotal: () => number
  getItem: (productId: string, variantId?: string) => CartItem | undefined
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const { items } = get()
        const existingItemIndex = items.findIndex(
          (i) =>
            i.productId === item.productId &&
            i.variantId === item.variantId
        )

        if (existingItemIndex > -1) {
          // Update quantity if item exists
          const updatedItems = [...items]
          const existingItem = updatedItems[existingItemIndex]
          const newQuantity = existingItem.quantity + item.quantity
          const maxQty = item.maxQuantity ?? 10

          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: Math.min(newQuantity, maxQty),
          }

          set({ items: updatedItems, isOpen: true })
        } else {
          // Add new item
          const id = `${item.productId}-${item.variantId ?? "default"}-${Date.now()}`
          set({
            items: [...items, { ...item, id }],
            isOpen: true,
          })
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id)
          return
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(quantity, item.maxQuantity ?? 10) }
              : item
          ),
        }))
      },

      clearCart: () => {
        set({ items: [] })
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getItem: (productId, variantId) => {
        return get().items.find(
          (item) =>
            item.productId === productId &&
            item.variantId === variantId
        )
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
)
