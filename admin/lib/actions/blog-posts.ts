"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface BlogPostInput {
  title: string
  slug: string
  excerpt?: string
  content?: string
  featured_image?: string
  is_published: boolean
}

/**
 * Create a new blog post
 */
export async function createBlogPost(data: BlogPostInput) {
  try {
    const supabase = await createClient()

    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content || null,
        featured_image: data.featured_image || null,
        is_published: data.is_published,
        published_at: data.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating blog post:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/content/blog")
    return { success: true, data: post }
  } catch (err) {
    console.error("Unexpected error creating blog post:", err)
    return { success: false, error: "Failed to create blog post" }
  }
}

/**
 * Update a blog post
 */
export async function updateBlogPost(id: string, data: Partial<BlogPostInput>) {
  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {
      ...data,
      updated_at: new Date().toISOString(),
    }

    // Set published_at when publishing
    if (data.is_published !== undefined) {
      if (data.is_published) {
        // Check if already published
        const { data: existing } = await supabase
          .from("blog_posts")
          .select("published_at")
          .eq("id", id)
          .single()

        if (!existing?.published_at) {
          updateData.published_at = new Date().toISOString()
        }
      }
    }

    const { data: post, error } = await supabase
      .from("blog_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating blog post:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/content/blog")
    revalidatePath(`/content/blog/${id}`)
    return { success: true, data: post }
  } catch (err) {
    console.error("Unexpected error updating blog post:", err)
    return { success: false, error: "Failed to update blog post" }
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting blog post:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/content/blog")
    return { success: true }
  } catch (err) {
    console.error("Unexpected error deleting blog post:", err)
    return { success: false, error: "Failed to delete blog post" }
  }
}

/**
 * Get a single blog post by ID
 */
export async function getBlogPostById(id: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching blog post:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("Unexpected error fetching blog post:", err)
    return null
  }
}

// generateSlug moved to @/lib/utils/slug.ts
