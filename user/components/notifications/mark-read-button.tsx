"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface MarkAsReadButtonProps {
  notificationId: string
}

export function MarkAsReadButton({ notificationId }: MarkAsReadButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleMarkRead = async () => {
    setIsLoading(true)

    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })

      router.refresh()
    } catch (error) {
      console.error("Failed to mark as read:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleMarkRead}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Check className="mr-1 h-4 w-4" />
          Mark read
        </>
      )}
    </Button>
  )
}
