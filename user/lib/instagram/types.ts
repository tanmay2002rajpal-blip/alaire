export interface InstagramMedia {
  id: string
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"
  media_url: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  timestamp: string
}

export interface InstagramResponse {
  data: InstagramMedia[]
  paging?: {
    cursors: { before: string; after: string }
    next?: string
  }
}
