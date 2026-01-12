import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, CalendarDays, User, Clock } from "lucide-react"
import { getBlogPostBySlug, getRecentBlogPosts } from "@/lib/actions/blog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: "Post Not Found | Alaire",
    }
  }

  return {
    title: `${post.title} | Alaire Blog`,
    description: post.excerpt || `Read ${post.title} on the Alaire blog.`,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  }
}

function estimateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.replace(/<[^>]*>/g, "").split(/\s+/).length
  return Math.max(1, Math.ceil(words / wordsPerMinute))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const recentPosts = await getRecentBlogPosts(3)
  const relatedPosts = recentPosts.filter((p) => p.slug !== post.slug).slice(0, 2)
  const readingTime = post.content ? estimateReadingTime(post.content) : 3

  return (
    <article className="min-h-screen bg-background">
      {/* Hero Image */}
      {post.featured_image && (
        <div className="relative h-[40vh] md:h-[50vh] w-full">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        </div>
      )}

      <div className="container max-w-4xl py-8 md:py-12">
        {/* Back Button */}
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </Link>

        {/* Post Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(post.published_at || post.created_at), "MMMM d, yyyy")}
            </span>
            {post.author_name && (
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {post.author_name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {readingTime} min read
            </span>
          </div>

          {post.excerpt && (
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </header>

        <Separator className="mb-8" />

        {/* Post Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-p:leading-relaxed prose-p:text-muted-foreground
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-lg prose-img:shadow-md
            prose-blockquote:border-l-primary prose-blockquote:italic
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted prose-pre:border"
          dangerouslySetInnerHTML={{ __html: post.content || "" }}
        />

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <>
            <Separator className="my-12" />
            <section>
              <h2 className="text-2xl font-semibold mb-6">Continue Reading</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {relatedPost.featured_image ? (
                          <Image
                            src={relatedPost.featured_image}
                            alt={relatedPost.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(relatedPost.published_at || relatedPost.created_at), "MMM d, yyyy")}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </article>
  )
}
