"use server"

import { createClient } from "@/lib/supabase/server"

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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching blog posts:", error)
      return []
    }

    return data || []
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
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("blog_posts")
      .select("is_published")

    if (error) {
      console.error("Error fetching blog post stats:", error)
      return { total: 0, published: 0, drafts: 0 }
    }

    const posts = data || []
    return {
      total: posts.length,
      published: posts.filter(p => p.is_published).length,
      drafts: posts.filter(p => !p.is_published).length,
    }
  } catch (err) {
    console.error("Unexpected error fetching blog post stats:", err)
    return { total: 0, published: 0, drafts: 0 }
  }
}
