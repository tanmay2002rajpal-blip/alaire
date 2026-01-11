import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function SkeletonSettingsCard() {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full max-w-[280px]" />
          <Skeleton className="h-8 w-24 mt-2" />
        </div>
      </div>
    </Card>
  )
}

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
        <SkeletonSettingsCard />
      </div>

      {/* Danger Zone */}
      <Card className="p-6">
        <Skeleton className="h-5 w-28 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-28" />
        </div>
      </Card>
    </div>
  )
}
