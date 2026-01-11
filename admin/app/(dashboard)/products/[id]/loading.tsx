import { Skeleton, SkeletonFormField, SkeletonTabs } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function ProductEditorLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-1">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Tabs */}
      <SkeletonTabs count={3} />

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <SkeletonFormField />
              <SkeletonFormField />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-32 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SkeletonFormField />
                <SkeletonFormField />
              </div>
            </CardContent>
          </Card>

          {/* Images Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
              <SkeletonFormField />
            </CardContent>
          </Card>

          {/* Category Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <SkeletonFormField />
              <SkeletonFormField />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
