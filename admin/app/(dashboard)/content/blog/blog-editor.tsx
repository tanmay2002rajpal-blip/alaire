"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ImageIcon,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { createBlogPost, updateBlogPost } from "@/lib/actions/blog-posts"
import { generateSlug } from "@/lib/utils/slug"
import type { BlogPost } from "@/lib/queries/blog-posts"

interface BlogEditorProps {
  post?: BlogPost | null
}

export function BlogEditor({ post }: BlogEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form state
  const [title, setTitle] = React.useState(post?.title || "")
  const [slug, setSlug] = React.useState(post?.slug || "")
  const [excerpt, setExcerpt] = React.useState(post?.excerpt || "")
  const [content, setContent] = React.useState(post?.content || "")
  const [featuredImage, setFeaturedImage] = React.useState(post?.featured_image || "")
  const [isPublished, setIsPublished] = React.useState(post?.is_published || false)

  const isEditing = !!post

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!isEditing || !post?.slug) {
      setSlug(generateSlug(value))
    }
  }

  // Calculate reading time
  const readingTime = React.useMemo(() => {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).filter(Boolean).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return minutes < 1 ? "< 1 min read" : `${minutes} min read`
  }, [content])

  // Word count
  const wordCount = React.useMemo(() => {
    return content.split(/\s+/).filter(Boolean).length
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = {
        title,
        slug,
        excerpt: excerpt || undefined,
        content: content || undefined,
        featured_image: featuredImage || undefined,
        is_published: isPublished,
      }

      const result = isEditing
        ? await updateBlogPost(post.id, data)
        : await createBlogPost(data)

      if (result.success) {
        router.push("/content/blog")
        router.refresh()
      } else {
        setError(result.error || "Something went wrong")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/content/blog">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Edit Post" : "New Blog Post"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Update your blog post" : "Create a new blog post"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href={`/blog/${slug}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading || !title || !slug}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isPublished ? "Publish" : "Save Draft"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title..."
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="post-url-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description for SEO and previews..."
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  A short summary that appears in search results and social shares
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">Content</Label>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{wordCount} words</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {readingTime}
                    </span>
                  </div>
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your blog post content here...

You can use markdown formatting:
- **bold text**
- *italic text*
- [links](url)
- ## headings"
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="publish">Publish immediately</Label>
                  <p className="text-xs text-muted-foreground">
                    Make this post visible on your website
                  </p>
                </div>
                <Switch
                  id="publish"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>

              {post?.published_at && (
                <p className="text-xs text-muted-foreground">
                  Published: {new Date(post.published_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featuredImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => setFeaturedImage("")}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                  <div className="text-center">
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No image set</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO Preview */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <p className="text-blue-600 text-sm font-medium truncate">
                  {title || "Post Title"}
                </p>
                <p className="text-green-700 text-xs truncate">
                  alaire.in/blog/{slug || "post-slug"}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {excerpt || "Post excerpt will appear here..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
