"use client"

import { useState } from "react"
import { RotateCcw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ReturnRequestButtonProps {
  orderId: string
  orderNumber: string
}

const RETURN_REASONS = [
  { value: "damaged", label: "Product damaged or defective" },
  { value: "wrong_item", label: "Wrong item received" },
  { value: "not_as_described", label: "Product not as described" },
  { value: "size_issue", label: "Size doesn't fit" },
  { value: "quality_issue", label: "Quality not satisfactory" },
  { value: "changed_mind", label: "Changed my mind" },
  { value: "other", label: "Other reason" },
]

export function ReturnRequestButton({ orderId, orderNumber }: ReturnRequestButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState("")
  const [details, setDetails] = useState("")

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason for return")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/orders/return-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          reason,
          details,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to submit return request")
      }

      toast.success("Return request submitted successfully! We'll contact you within 24-48 hours.")
      setIsOpen(false)
      setReason("")
      setDetails("")
    } catch (error) {
      console.error("Return request error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit return request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Request Return
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Return</DialogTitle>
          <DialogDescription>
            Order {orderNumber} - Submit a return or exchange request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Return *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional Details</Label>
            <Textarea
              id="details"
              placeholder="Please provide any additional details about your return request..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">Return Policy:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Returns accepted within 7 days of delivery</li>
              <li>Items must be unused and in original packaging</li>
              <li>Refund will be processed within 5-7 business days</li>
              <li>Shipping charges are non-refundable</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
