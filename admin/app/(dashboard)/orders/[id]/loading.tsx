import { Skeleton, SkeletonTable } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function SkeletonTimelineItem() {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="w-0.5 h-12" />
      </div>
      <div className="flex-1 pb-6 space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  )
}

export default function OrderDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-1">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column - 60% */}
        <div className="lg:col-span-3 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-44" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-14" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-4 w-48" />
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-16" />
            </CardHeader>
            <CardContent>
              <SkeletonTable columns={5} rows={3} />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-28" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 40% */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full font-mono" />
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
                <SkeletonTimelineItem />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-20" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
