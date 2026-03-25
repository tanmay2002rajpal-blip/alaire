"use client"

import Image from "next/image"
import Link from "next/link"
import { Instagram, Play } from "lucide-react"
import { EmblaCarousel } from "@/components/ui/embla-carousel"
import { SOCIAL_LINKS } from "@/lib/constants"

interface InstagramPost {
  id: string
  media_url: string
  permalink: string
  caption?: string
  media_type?: string
  thumbnail_url?: string
}

interface InstagramFeedProps {
  posts: InstagramPost[]
}

export function InstagramFeed({ posts }: InstagramFeedProps) {
  if (posts.length === 0) return null

  return (
    <section className="section">
      <div className="container">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight">
            Follow Our <span className="font-light italic">Journey</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            @alaire on Instagram
          </p>
        </div>

        <EmblaCarousel
          options={{ loop: true, align: "start" }}
          showArrows={posts.length > 4}
          slideClassName="basis-[42%] sm:basis-[30%] lg:basis-[25%] pl-3"
        >
          {posts.map((post) => {
            const isVideo = post.media_type === "VIDEO"
            const imageUrl = isVideo
              ? post.thumbnail_url || post.media_url
              : post.media_url

            return (
              <Link
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={post.caption || "Instagram post"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 42vw, (max-width: 1024px) 30vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    {isVideo ? (
                      <Play className="h-8 w-8 text-white opacity-80" />
                    ) : (
                      <Instagram className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </EmblaCarousel>

        <div className="mt-8 text-center">
          <Link
            href={SOCIAL_LINKS.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <Instagram className="h-4 w-4" />
            Follow us on Instagram
          </Link>
        </div>
      </div>
    </section>
  )
}
