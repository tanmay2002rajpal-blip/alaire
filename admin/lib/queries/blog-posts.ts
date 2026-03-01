"use server"

import { getBlogPostsCollection } from '@/lib/db/collections'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image: string | null
  author_id: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Get all blog posts
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const postsCol = await getBlogPostsCollection()

    const data = await postsCol.find().sort({ created_at: -1 }).toArray()

    return data.map(post => ({
      id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      featured_image: post.featured_image,
      author_id: post.author_id?.toString() || null,
      is_published: post.is_published,
      published_at: post.published_at?.toISOString() || null,
      created_at: post.created_at.toISOString(),
      updated_at: post.updated_at.toISOString(),
    }))
  } catch (err) {
    console.error("Unexpected error fetching blog posts:", err)
    return []
  }
}

/**
 * Get blog post stats
 */
export async function getBlogPostStats() {
  try {
    const postsCol = await getBlogPostsCollection()

    const data = await postsCol.find(
      {},
      { projection: { is_published: 1 } }
    ).toArray()

    return {
      total: data.length,
      published: data.filter(p => p.is_published).length,
      drafts: data.filter(p => !p.is_published).length,
    }
  } catch (err) {
    console.error("Unexpected error fetching blog post stats:", err)
    return { total: 0, published: 0, drafts: 0 }
  }
}
