"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { ORDER_STATUSES } from "@/lib/constants"

const TIMELINE_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const

interface StatusHistoryItem {
  status: string
  created_at: string
}

interface OrderTimelineProps {
  currentStatus: string
  statusHistory: StatusHistoryItem[]
}

export function OrderTimeline({ currentStatus, statusHistory }: OrderTimelineProps) {
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

  const currentStepIndex = TIMELINE_STEPS.findIndex((step) => step.key === currentStatus)

  // Build a map of status -> timestamp
  const statusTimestamps: Record<string, string> = {}
  statusHistory.forEach((item) => {
    statusTimestamps[item.status] = item.created_at
  })

  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="absolute left-0 top-4 h-0.5 w-full bg-muted" />

      {/* Active progress bar */}
      <div
        className="absolute left-0 top-4 h-0.5 bg-foreground transition-all duration-500"
        style={{
          width: `${(currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100}%`,
        }}
      />

      {/* Steps */}
      <div className="relative flex justify-between">
        {TIMELINE_STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex
          const isCurrent = index === currentStepIndex
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
