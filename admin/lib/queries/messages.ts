'use server'

import { getContactMessagesCollection } from '@/lib/db/collections'
import { paginate, totalPages } from '@/lib/db/helpers'

export interface ContactMessage {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  subject: string
  message: string
  status: 'unread' | 'read' | 'replied'
  created_at: string
}

export interface MessageFilters {
  search?: string
  status?: 'all' | 'unread' | 'read' | 'replied'
  page?: number
  limit?: number
}

export interface MessageStats {
  total: number
  unread: number
  read: number
  replied: number
}

export interface PaginatedMessages {
  messages: ContactMessage[]
  total: number
  page: number
  totalPages: number
}

/**
 * Get paginated contact messages with filters
 */
export async function getMessages(filters?: MessageFilters): Promise<PaginatedMessages> {
  const col = await getContactMessagesCollection()

  const { skip, limit: lim, page } = paginate(filters?.page, filters?.limit || 25)

  // Build filter
  const filter: Record<string, any> = {}

  if (filters?.search) {
    filter.$or = [
      { first_name: { $regex: filters.search, $options: 'i' } },
      { last_name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { subject: { $regex: filters.search, $options: 'i' } },
    ]
  }

  if (filters?.status && filters.status !== 'all') {
    filter.status = filters.status
  }

  const [docs, total] = await Promise.all([
    col.find(filter).sort({ created_at: -1 }).skip(skip).limit(lim).toArray(),
    col.countDocuments(filter),
  ])

  const messages: ContactMessage[] = docs.map((doc) => ({
    id: doc._id.toString(),
    first_name: doc.first_name,
    last_name: doc.last_name,
    email: doc.email,
    phone: doc.phone,
    subject: doc.subject,
    message: doc.message,
    status: doc.status,
    created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString(),
  }))

  return {
    messages,
    total,
    page,
    totalPages: totalPages(total, lim),
  }
}

/**
 * Get message statistics
 */
export async function getMessageStats(): Promise<MessageStats> {
  const col = await getContactMessagesCollection()

  const [total, unread, read, replied] = await Promise.all([
    col.countDocuments(),
    col.countDocuments({ status: 'unread' }),
    col.countDocuments({ status: 'read' }),
    col.countDocuments({ status: 'replied' }),
  ])

  return { total, unread, read, replied }
}
