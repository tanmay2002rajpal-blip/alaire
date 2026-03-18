"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ORDER_STATUSES } from "@/lib/constants"

interface TimelineStep {
  key: string
  label: string
}

const PREPAID_STEPS: TimelineStep[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
]

const COD_STEPS: TimelineStep[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
]

// Map various status values to a canonical timeline key
function normalizeStatus(status: string): string {
  switch (status) {
    case "pending":
    case "confirmed":
    case "paid":
      return "confirmed"
    case "processing":
      return "processing"
    case "shipped":
      return "shipped"
    case "delivered":
      return "delivered"
    default:
      return status
  }
}

interface StatusHistoryItem {
  status: string
  created_at: string
}

interface OrderTimelineProps {
  currentStatus: string
  statusHistory: StatusHistoryItem[]
  paymentMethod?: "prepaid" | "cod" | string
}

export function OrderTimeline({ currentStatus, statusHistory, paymentMethod }: OrderTimelineProps) {
  // Handle cancelled/refunded as special states
  if (currentStatus === "cancelled" || currentStatus === "refunded") {
    const statusConfig = ORDER_STATUSES[currentStatus as keyof typeof ORDER_STATUSES]
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-6">
        <div className="text-center">
          <span className={cn("inline-block rounded-full px-3 py-1 text-sm font-medium", statusConfig?.color)}>
            {statusConfig?.label ?? currentStatus}
          </span>
          <p className="mt-2 text-sm text-muted-foreground">
            This order has been {currentStatus}
          </p>
        </div>
      </div>
    )
  }

  const steps = paymentMethod === "cod" ? COD_STEPS : PREPAID_STEPS
  const normalized = normalizeStatus(currentStatus)
  const currentStepIndex = steps.findIndex((step) => step.key === normalized)
  // If status not found in steps, assume first step is active
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0

  // Build a map of status -> timestamp
  const statusTimestamps: Record<string, string> = {}
  statusHistory.forEach((item) => {
    const key = normalizeStatus(item.status)
    statusTimestamps[key] = item.created_at
  })

  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="absolute left-0 top-4 h-0.5 w-full bg-muted" />

      {/* Active progress bar */}
      <div
        className="absolute left-0 top-4 h-0.5 bg-foreground transition-all duration-500"
        style={{
          width: `${(activeIndex / (steps.length - 1)) * 100}%`,
        }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < activeIndex
          const isCurrent = index === activeIndex
          const timestamp = statusTimestamps[step.key]

          return (
            <div key={step.key} className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted
                    ? "border-foreground bg-foreground text-background"
                    : isCurrent
                    ? "border-foreground bg-background text-foreground"
                    : "border-muted bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium",
                  isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>

              {/* Timestamp */}
              {timestamp && (
                <span className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(timestamp).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
