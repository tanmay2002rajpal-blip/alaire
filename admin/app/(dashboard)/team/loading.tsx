import { Skeleton, SkeletonStatsCard } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function SkeletonTeamMemberRow() {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-4 w-8" />
      </div>
    </div>
  )
}

export default function TeamLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
        <SkeletonStatsCard />
      </div>

      {/* Team Members List */}
      <Card className="p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-4">
          <SkeletonTeamMemberRow />
          <SkeletonTeamMemberRow />
          <SkeletonTeamMemberRow />
        </div>
      </Card>

      {/* Invite Section */}
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <Skeleton className="h-16 w-16 rounded-full mb-4" />
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-4 w-80 mb-4" />
          <Skeleton className="h-10 w-36" />
        </div>
      </Card>
    </div>
  )
}
