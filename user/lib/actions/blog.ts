"use server"

import { createClient } from "@/lib/supabase/server"

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

interface RawBlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content?: string | null
  featured_image: string | null
  published_at: string
  created_at: string
  author?: { full_name: string | null } | null
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      featured_image,
      published_at,
      created_at,
      author:profiles!blog_posts_author_id_fkey(full_name)
    `)
    .eq("is_published", true)
    .order("published_at", { ascending: false })

  if (error) {
    console.error("Error fetching blog posts:", error)
    return []
  }

  return (data || []).map((post: RawBlogPost) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: null,
    featured_image: post.featured_image,
    published_at: post.published_at,
    created_at: post.created_at,
    author_name: post.author?.full_name || "Alaire Team",
  }))
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      content,
      featured_image,
      published_at,
      created_at,
      author:profiles!blog_posts_author_id_fkey(full_name)
    `)
    .eq("slug", slug)
    .eq("is_published", true)
    .single()

  if (error || !data) {
    console.error("Error fetching blog post:", error)
    return null
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    featured_image: data.featured_image,
    published_at: data.published_at,
    created_at: data.created_at,
    author_name: (data as RawBlogPost).author?.full_name || "Alaire Team",
  }
}

export async function getRecentBlogPosts(limit: number = 3): Promise<BlogPost[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      featured_image,
      published_at,
      created_at
    `)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching recent blog posts:", error)
    return []
  }

  return (data || []).map((post: RawBlogPost) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: null,
    featured_image: post.featured_image,
    published_at: post.published_at,
    created_at: post.created_at,
  }))
}
