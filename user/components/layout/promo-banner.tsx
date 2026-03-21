"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface PromoBannerData {
  text: string
  is_active: boolean
  coupon_code?: string | null
  link?: string | null
}

export function PromoBanner() {
  const [bannerData, setBannerData] = useState<PromoBannerData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/site-settings/promo-banner")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setBannerData(data)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  // Don't render anything until data is loaded
  if (!loaded) return null

  // If no banner configured or not active, don't show
  if (!bannerData || !bannerData.is_active || !bannerData.text) return null

  const content = (
    <p className="text-xs font-light tracking-wide">
      {bannerData.text}
    </p>
  )

  return (
    <div
      className={cn(
        "bg-black text-white",
        "h-7 flex items-center justify-center"
      )}
    >
      {bannerData.link ? (
        <Link href={bannerData.link} className="hover:opacity-80 transition-opacity">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  )
}
