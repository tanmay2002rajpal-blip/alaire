import { notFound } from "next/navigation"
import { BlogEditor } from "../blog-editor"
import { getBlogPostById } from "@/lib/actions/blog-posts"

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params
  const post = await getBlogPostById(id)

  if (!post) {
    notFound()
  }

  return <BlogEditor post={post} />
}
