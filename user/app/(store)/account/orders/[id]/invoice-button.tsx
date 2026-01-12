"use client"

import { useState } from "react"
import { FileText, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface InvoiceButtonProps {
  orderId: string
  orderNumber: string
  disabled?: boolean
}

export function InvoiceButton({ orderId, orderNumber, disabled }: InvoiceButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate invoice")
      }

      // Get the PDF blob
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `Invoice-${orderNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("Invoice downloaded successfully!")
    } catch (error) {
      console.error("Download error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to download invoice")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      {isLoading ? "Generating..." : "Download Invoice"}
    </Button>
  )
}
