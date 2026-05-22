"use client"

import { useState, useEffect } from "react"
import { Loader2, Package, Truck, CheckCircle2, Clock, MapPin, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getOrderTracking } from "@/lib/bluedart/actions"
import type { TrackingActivity } from "@/lib/bluedart/types"

// ── Courier tracking URL map ────────────────────────────────────────────────
const COURIER_TRACKING_URLS: Record<string, (awb: string) => string> = {
  "Blue Dart": (awb) => `https://www.bluedart.com/tracking/${awb}`,
  "BlueDart": (awb) => `https://www.bluedart.com/tracking/${awb}`,
  "Delhivery": (awb) => `https://www.delhivery.com/track/package/${awb}`,
  "DTDC": (awb) => `https://www.dtdc.in/tracking.asp?strCnno=${awb}`,
  "Ecom Express": (awb) => `https://ecomexpress.in/tracking/?awb_field=${awb}`,
  "XpressBees": (awb) => `https://www.xpressbees.com/track?awb=${awb}`,
}

function getCourierTrackingUrl(courierName: string | undefined, awb: string): string | null {
  if (!courierName) return null
  // Try exact match first
  if (COURIER_TRACKING_URLS[courierName]) {
    return COURIER_TRACKING_URLS[courierName](awb)
  }
  // Try case-insensitive partial match
  const normalized = courierName.toLowerCase()
  for (const [key, fn] of Object.entries(COURIER_TRACKING_URLS)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return fn(awb)
    }
  }
  return null
}

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

  const trackingUrl = getCourierTrackingUrl(courierName, awbNumber)

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
          Tracking #: <span className="font-mono">{awbNumber}</span>
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
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            {/* Fallback: show courier website link when live tracking fails */}
            {trackingUrl ? (
              <Button variant="outline" className="w-full" asChild>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Track on {courierName} Website
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Use tracking number <span className="font-mono font-medium">{awbNumber}</span> to track on your courier&apos;s website.
              </p>
            )}
          </div>
        ) : activities.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-muted bg-muted/10 p-4">
              <p className="text-sm text-muted-foreground">
                No tracking information available yet.
              </p>
            </div>
            {/* Fallback link when no activities */}
            {trackingUrl ? (
              <Button variant="outline" className="w-full" asChild>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Track on {courierName} Website
                </a>
              </Button>
            ) : courierName ? (
              <p className="text-sm text-muted-foreground">
                Use tracking number <span className="font-mono font-medium">{awbNumber}</span> to track on {courierName}&apos;s website.
              </p>
            ) : null}
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

            {/* Track on Courier Website button */}
            {trackingUrl ? (
              <Button variant="outline" className="w-full" asChild>
                <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Track on {courierName} Website
                </a>
              </Button>
            ) : courierName ? (
              <p className="text-xs text-muted-foreground">
                Use tracking number <span className="font-mono font-medium">{awbNumber}</span> to track on {courierName}&apos;s website.
              </p>
            ) : null}

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
