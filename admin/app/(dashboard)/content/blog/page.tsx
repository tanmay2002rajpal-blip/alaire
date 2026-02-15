import { Suspense } from "react"
import { BlogPostsClient } from "./blog-posts-client"
import { getBlogPosts, getBlogPostStats } from "@/lib/queries/blog-posts"

export default async function BlogPostsPage() {
  const [posts, stats] = await Promise.all([
    getBlogPosts(),
    getBlogPostStats(),
  ])

  return (
    <Suspense fallback={<BlogPostsSkeleton />}>
      <BlogPostsClient posts={posts} stats={stats} />
    </Suspense>
  )
}

function BlogPostsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
        <div className="h-10 w-32 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-12 bg-muted rounded-lg" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}
