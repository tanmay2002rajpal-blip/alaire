import Image from "next/image"
import Link from "next/link"
import { Instagram, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SOCIAL_LINKS } from "@/lib/constants"
import { getInstagramFeed } from "@/lib/instagram/api"

export async function InstagramFeed() {
  const posts = await getInstagramFeed(8)

  // Placeholder data when API is not configured
  const placeholderPosts = Array.from({ length: 6 }, (_, i) => ({
    id: `placeholder-${i}`,
    media_type: i % 3 === 0 ? ("VIDEO" as const) : ("IMAGE" as const),
    media_url: `https://images.unsplash.com/photo-${1500000000000 + i * 100000000}?w=400&h=400&fit=crop`,
    thumbnail_url: undefined as string | undefined,
    permalink: SOCIAL_LINKS.instagram,
    caption: `Post ${i + 1}`,
    timestamp: new Date().toISOString(),
  }))

  const displayPosts = posts.length > 0 ? posts : placeholderPosts

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-3">
            Follow us @alaire.official
          </h2>
          <p className="text-muted-foreground">
            Join our community and discover the latest luxury pieces
          </p>
        </div>

        {/* Instagram Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
          {displayPosts.map((post) => {
            const isVideo = post.media_type === "VIDEO"
            const imageUrl = isVideo && post.thumbnail_url ? post.thumbnail_url : post.media_url

            return (
              <Link
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden rounded-lg bg-muted"
              >
                {/* Image */}
                <Image
                  src={imageUrl}
                  alt={post.caption || "Instagram post"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 16.66vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />

                {/* Video Play Icon Overlay */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/40 rounded-full p-3">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                )}

                {/* Hover Overlay with Instagram Icon */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Instagram className="w-8 h-8 text-white" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <Link
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Instagram className="w-5 h-5" />
              Follow on Instagram
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
