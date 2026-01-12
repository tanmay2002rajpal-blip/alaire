import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { CalendarDays, User, ArrowRight } from "lucide-react"
import { getBlogPosts } from "@/lib/actions/blog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Blog | Alaire",
  description: "Discover the latest fashion trends, styling tips, and behind-the-scenes stories from Alaire.",
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Our Stories
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              The Alaire Journal
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Discover the latest fashion trends, styling tips, and behind-the-scenes
              stories from our world of timeless elegance.
            </p>
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="container py-12 md:py-16">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No blog posts yet. Check back soon for exciting content!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className={`group h-full overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  index === 0 && posts.length >= 3 ? "md:col-span-2 lg:col-span-2" : ""
                }`}>
                  <div className={`relative overflow-hidden ${
                    index === 0 && posts.length >= 3 ? "aspect-[21/9]" : "aspect-[16/10]"
                  }`}>
                    {post.featured_image ? (
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h2 className={`font-semibold tracking-tight ${
                        index === 0 && posts.length >= 3 ? "text-2xl md:text-3xl" : "text-xl"
                      }`}>
                        {post.title}
                      </h2>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {format(new Date(post.published_at || post.created_at), "MMM d, yyyy")}
                      </span>
                      {post.author_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author_name}
                        </span>
                      )}
                    </div>
                    {post.excerpt && (
                      <p className="text-muted-foreground line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
