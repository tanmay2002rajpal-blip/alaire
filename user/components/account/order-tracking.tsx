"use client"

import { useState, useEffect } from "react"
import { Loader2, Package, Truck, CheckCircle2, Clock, MapPin } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getOrderTracking } from "@/lib/shiprocket/actions"
import type { TrackingActivity } from "@/lib/shiprocket/types"

interface OrderTrackingProps {
  awbNumber: string
  courierName?: string
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "Delivered": <CheckCircle2 className="h-5 w-5 text-green-500" />,
  "Out for Delivery": <Truck className="h-5 w-5 text-blue-500" />,
  "In Transit": <Package className="h-5 w-5 text-purple-500" />,
  "Shipped": <MapPin className="h-5 w-5 text-indigo-500" />,
  "default": <Clock className="h-5 w-5 text-gray-400" />,
}

function getStatusIcon(status: string): React.ReactNode {
  // Normalize status and check for partial matches
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus.includes("delivered")) {
    return STATUS_ICONS["Delivered"]
  }
  if (normalizedStatus.includes("out for delivery")) {
    return STATUS_ICONS["Out for Delivery"]
  }
  if (normalizedStatus.includes("transit") || normalizedStatus.includes("in-transit")) {
    return STATUS_ICONS["In Transit"]
  }
  if (normalizedStatus.includes("shipped") || normalizedStatus.includes("pickup")) {
    return STATUS_ICONS["Shipped"]
  }

  return STATUS_ICONS["default"]
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)

    // Format date as "Dec 24, 2:30 PM"
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }

    return date.toLocaleString("en-US", options)
  } catch {
    return dateString
  }
}

export function OrderTracking({ awbNumber, courierName }: OrderTrackingProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState<TrackingActivity[]>([])
  const [currentStatus, setCurrentStatus] = useState<string>("")

  useEffect(() => {
    async function fetchTracking() {
      setLoading(true)
      setError(null)

      const result = await getOrderTracking(awbNumber)

      if (result.success && result.data) {
        setActivities(result.data)
        setCurrentStatus(result.status || "")
      } else {
        setError(result.error || "Failed to load tracking information")
      }

      setLoading(false)
    }

    if (awbNumber) {
      fetchTracking()
    }
  }, [awbNumber])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Order Tracking
        </CardTitle>
        {courierName && (
          <p className="text-sm text-muted-foreground">
            Courier: {courierName}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Tracking #: {awbNumber}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading tracking information...
            </span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border border-muted bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">
              No tracking information available yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Current Status */}
            {currentStatus && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-2">
                  {getStatusIcon(currentStatus)}
                  <span className="font-semibold">{currentStatus}</span>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="relative space-y-6 pl-8">
              {/* Vertical connecting line */}
              <div className="absolute left-[0.6875rem] top-2 bottom-0 w-0.5 bg-border" />

              {activities.map((activity, index) => {
                const isLatest = index === 0

                return (
                  <div key={index} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-8 top-1">
                      {isLatest ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                          <div className="h-3 w-3 rounded-full bg-white" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-border bg-background" />
                      )}
                    </div>

                    {/* Activity content */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2">
                        {getStatusIcon(activity.status)}
                        <div className="flex-1">
                          <p className={`font-medium ${isLatest ? "text-primary" : ""}`}>
                            {activity.status}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {activity.activity}
                          </p>
                          {activity.location && (
                            <p className="text-xs text-muted-foreground">
                              {activity.location}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
