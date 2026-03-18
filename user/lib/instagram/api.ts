import type { InstagramMedia, InstagramResponse } from "./types"

const INSTAGRAM_API_URL = "https://graph.instagram.com"

export async function getInstagramFeed(limit: number = 8): Promise<InstagramMedia[]> {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID

  if (!accessToken || !userId) {
    // Instagram credentials not configured — using placeholder images
    return []
  }

  try {
    const response = await fetch(
      `${INSTAGRAM_API_URL}/${userId}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp&limit=${limit}&access_token=${accessToken}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status}`)
    }

    const data: InstagramResponse = await response.json()
    return data.data
  } catch (error) {
    console.error("Failed to fetch Instagram feed:", error)
    return []
  }
}
