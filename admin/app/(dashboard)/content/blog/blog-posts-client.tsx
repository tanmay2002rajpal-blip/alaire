"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  FileText,
  Eye,
  Clock,
  Pencil,
  Trash2,
  Search,
  BookOpen,
} from "lucide-react"
import NextImage from "next/image"
import type { BlogPost } from "@/lib/queries/blog-posts"
import { deleteBlogPost } from "@/lib/actions/blog-posts"

interface BlogPostsClientProps {
  posts: BlogPost[]
  stats: {
    total: number
    published: number
    drafts: number
  }
}

type FilterStatus = "all" | "published" | "draft"

export function BlogPostsClient({ posts, stats }: BlogPostsClientProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [filter, setFilter] = React.useState<FilterStatus>("all")
  const [deleteId, setDeleteId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Calculate reading time
  const getReadingTime = (content: string | null) => {
    if (!content) return "< 1 min"
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).filter(Boolean).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return minutes < 1 ? "< 1 min" : `${minutes} min`
  }

  // Filter and search posts
  const filteredPosts = React.useMemo(() => {
    return posts.filter((post) => {
      // Filter by status
      if (filter === "published" && !post.is_published) return false
      if (filter === "draft" && post.is_published) return false

      // Search
      if (search) {
        const searchLower = search.toLowerCase()
        return (
          post.title.toLowerCase().includes(searchLower) ||
          post.excerpt?.toLowerCase().includes(searchLower) ||
          post.content?.toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [posts, filter, search])

  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const result = await deleteBlogPost(deleteId)
      if (result.success) {
        router.refresh()
      }
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground">
            Create and manage blog content
          </p>
        </div>
        <Button asChild>
          <Link href="/content/blog/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Total Posts</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">All blog posts</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Published</span>
          </div>
          <p className="text-2xl font-bold">{stats.published}</p>
          <p className="text-xs text-muted-foreground">Live on website</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Drafts</span>
          </div>
          <p className="text-2xl font-bold">{stats.drafts}</p>
          <p className="text-xs text-muted-foreground">Work in progress</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">Total Views</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All ({stats.total})
            </Button>
            <Button
              variant={filter === "published" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("published")}
            >
              Published ({stats.published})
            </Button>
            <Button
              variant={filter === "draft" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("draft")}
            >
              Drafts ({stats.drafts})
            </Button>
          </div>
        </div>
      </Card>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {search || filter !== "all" ? "No posts found" : "No blog posts yet"}
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              {search || filter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Start creating blog posts to share news, tips, and stories with your customers."}
            </p>
            {!search && filter === "all" && (
              <Button asChild>
                <Link href="/content/blog/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Write Your First Post
                </Link>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex">
                {/* Image Preview */}
                <div className="relative w-48 h-36 flex-shrink-0 bg-muted">
                  {post.featured_image ? (
                    <NextImage
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-10 w-10 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/content/blog/${post.id}`}
                          className="font-semibold hover:underline"
                        >
                          {post.title}
                        </Link>
                        {post.is_published ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Published
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Draft
                          </span>
                        )}
                      </div>

                      {post.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Created: {formatDate(post.created_at)}</span>
                        {post.published_at && (
                          <span>Published: {formatDate(post.published_at)}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getReadingTime(post.content)} read
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/content/blog/${post.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(post.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
