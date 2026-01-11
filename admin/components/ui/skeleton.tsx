import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-shimmer before:bg-gradient-to-r",
        "before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

// Card skeleton with header and content areas
function SkeletonCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border bg-card p-6 space-y-4", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

// Table row skeleton
function SkeletonTableRow({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Table skeleton with header and rows
function SkeletonTable({
  columns = 6,
  rows = 5,
  className,
}: {
  columns?: number
  rows?: number
  className?: string
}) {
  return (
    <div className={cn("rounded-md border", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-4 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Stats card skeleton (for dashboard-style cards)
function SkeletonStatsCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border bg-card p-6", className)}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-9 w-24 mb-2" />
      <Skeleton className="h-3 w-36" />
    </div>
  )
}

// Form field skeleton
function SkeletonFormField({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Avatar skeleton
function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  }
  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />
}

// Image skeleton
function SkeletonImage({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <Skeleton
      className={cn("aspect-square", className)}
      {...props}
    />
  )
}

// Text block skeleton (multiple lines)
function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  )
}

// Page header skeleton
function SkeletonPageHeader({ hasButton = true }: { hasButton?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {hasButton && <Skeleton className="h-10 w-32" />}
    </div>
  )
}

// Filter bar skeleton
function SkeletonFilterBar() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 flex-1 max-w-md" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-10 w-40" />
    </div>
  )
}

// Tabs skeleton
function SkeletonTabs({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 border-b pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24" />
      ))}
    </div>
  )
}

// Chart skeleton
function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <Skeleton className="h-5 w-40 mb-6" />
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export {
  Skeleton,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonStatsCard,
  SkeletonFormField,
  SkeletonAvatar,
  SkeletonImage,
  SkeletonText,
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonTabs,
  SkeletonChart,
}
