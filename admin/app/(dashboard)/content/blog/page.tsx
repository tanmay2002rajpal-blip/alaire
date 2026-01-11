import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Eye, Clock, Pencil, Trash2 } from "lucide-react"
import { getBlogPosts, getBlogPostStats } from "@/lib/queries/blog-posts"
import NextImage from "next/image"

export default async function BlogPostsPage() {
  const [posts, stats] = await Promise.all([
    getBlogPosts(),
    getBlogPostStats(),
  ])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
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
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Post
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
            <Eye className="h-4 w-4" />
            <span className="text-sm">Total Views</span>
          </div>
          <p className="text-2xl font-bold">0</p>
          <p className="text-xs text-muted-foreground">All time</p>
        </Card>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Start creating blog posts to share news, tips, and stories with your customers.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Write Your First Post
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <div className="flex">
                {/* Image Preview */}
                {post.featured_image && (
                  <div className="relative w-48 h-32 flex-shrink-0">
                    <NextImage
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{post.title}</h3>
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
                      <p className="text-xs text-muted-foreground">
                        Created: {formatDate(post.created_at)}
                        {post.published_at && ` | Published: ${formatDate(post.published_at)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
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
    </div>
  )
}
