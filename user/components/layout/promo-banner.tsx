"use client"

import { cn } from "@/lib/utils"

export function PromoBanner() {
  return (
    <div
      className={cn(
        "bg-black text-white",
        "h-7 flex items-center justify-center"
      )}
    >
      <p className="text-xs font-light tracking-wide">
        Free shipping on orders over ₹999
      </p>
    </div>
  )
}
