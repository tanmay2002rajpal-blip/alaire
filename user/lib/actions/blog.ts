"use server"

import { getDb } from "@/lib/db/client"
import { serializeDoc, serializeDocs } from "@/lib/db/helpers"

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image: string | null
  author_name?: string
  published_at: string
  created_at: string
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const db = await getDb()

  const docs = await db
    .collection("blog_posts")
    .find({ is_published: true })
    .sort({ published_at: -1 })
    .project({
      title: 1,
      slug: 1,
      excerpt: 1,
      featured_image: 1,
      published_at: 1,
      created_at: 1,
    })
    .toArray()

  return serializeDocs(docs).map((post) => ({
    id: post.id,
    title: (post as Record<string, unknown>).title as string,
    slug: (post as Record<string, unknown>).slug as string,
    excerpt: (post as Record<string, unknown>).excerpt as string | null,
    content: null,
    featured_image: (post as Record<string, unknown>).featured_image as string | null,
    published_at: (post as Record<string, unknown>).published_at as string,
    created_at: (post as Record<string, unknown>).created_at as string,
    author_name: "Alaire Team",
  }))
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const db = await getDb()

  const doc = await db
    .collection("blog_posts")
    .findOne({ slug, is_published: true })

  if (!doc) return null

  const s = serializeDoc(doc)
  return {
    id: s.id,
    title: (s as Record<string, unknown>).title as string,
    slug: (s as Record<string, unknown>).slug as string,
    excerpt: (s as Record<string, unknown>).excerpt as string | null,
    content: (s as Record<string, unknown>).content as string | null,
    featured_image: (s as Record<string, unknown>).featured_image as string | null,
    published_at: (s as Record<string, unknown>).published_at as string,
    created_at: (s as Record<string, unknown>).created_at as string,
    author_name: "Alaire Team",
  }
}

export async function getRecentBlogPosts(limit: number = 3): Promise<BlogPost[]> {
  const db = await getDb()

  const docs = await db
    .collection("blog_posts")
    .find({ is_published: true })
    .sort({ published_at: -1 })
    .limit(limit)
    .project({
      title: 1,
      slug: 1,
      excerpt: 1,
      featured_image: 1,
      published_at: 1,
      created_at: 1,
    })
    .toArray()

  return serializeDocs(docs).map((post) => ({
    id: post.id,
    title: (post as Record<string, unknown>).title as string,
    slug: (post as Record<string, unknown>).slug as string,
    excerpt: (post as Record<string, unknown>).excerpt as string | null,
    content: null,
    featured_image: (post as Record<string, unknown>).featured_image as string | null,
    published_at: (post as Record<string, unknown>).published_at as string,
    created_at: (post as Record<string, unknown>).created_at as string,
  }))
}
