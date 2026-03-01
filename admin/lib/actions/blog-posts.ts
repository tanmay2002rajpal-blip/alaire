"use server"

import { ObjectId } from 'mongodb'
import { getBlogPostsCollection } from '@/lib/db/collections'
import { toObjectId } from '@/lib/db/helpers'
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
    const postsCol = await getBlogPostsCollection()
    const now = new Date()
    const postId = new ObjectId()

    await postsCol.insertOne({
      _id: postId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      content: data.content || null,
      featured_image: data.featured_image || null,
      author_id: null,
      is_published: data.is_published,
      published_at: data.is_published ? now : null,
      created_at: now,
      updated_at: now,
    })

    const post = await postsCol.findOne({ _id: postId })

    revalidatePath("/content/blog")
    return {
      success: true,
      data: post ? {
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
      } : null,
    }
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
    const postsCol = await getBlogPostsCollection()
    const oid = toObjectId(id)

    const updateData: Record<string, unknown> = {
      ...data,
      updated_at: new Date(),
    }

    // Set published_at when publishing
    if (data.is_published !== undefined && data.is_published) {
      const existing = await postsCol.findOne(
        { _id: oid },
        { projection: { published_at: 1 } }
      )
      if (!existing?.published_at) {
        updateData.published_at = new Date()
      }
    }

    await postsCol.updateOne({ _id: oid }, { $set: updateData })

    const post = await postsCol.findOne({ _id: oid })

    revalidatePath("/content/blog")
    revalidatePath(`/content/blog/${id}`)
    return {
      success: true,
      data: post ? {
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
      } : null,
    }
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
    const postsCol = await getBlogPostsCollection()
    await postsCol.deleteOne({ _id: toObjectId(id) })

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
    const postsCol = await getBlogPostsCollection()
    const data = await postsCol.findOne({ _id: toObjectId(id) })

    if (!data) return null

    return {
      id: data._id.toString(),
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      featured_image: data.featured_image,
      author_id: data.author_id?.toString() || null,
      is_published: data.is_published,
      published_at: data.published_at?.toISOString() || null,
      created_at: data.created_at.toISOString(),
      updated_at: data.updated_at.toISOString(),
    }
  } catch (err) {
    console.error("Unexpected error fetching blog post:", err)
    return null
  }
}

// generateSlug moved to @/lib/utils/slug.ts
