import { ObjectId, WithId, Document } from 'mongodb'

/**
 * Convert a string ID to ObjectId safely.
 * Returns null if the string is not a valid ObjectId.
 */
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

/**
 * Check if a string is a valid ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id
}

/**
 * Serialize a MongoDB document, converting ObjectId to string and Date to ISO string.
 */
export function serializeDoc<T extends Document>(doc: WithId<T>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(doc)) {
    if (key === '_id') {
      result['id'] = value.toString()
    } else if (value instanceof ObjectId) {
      result[key] = value.toString()
    } else if (value instanceof Date) {
      result[key] = value.toISOString()
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        item instanceof ObjectId ? item.toString() :
        item instanceof Date ? item.toISOString() :
        item
      )
    } else if (value !== null && typeof value === 'object' && !(value instanceof ObjectId) && !(value instanceof Date)) {
      // Leave nested objects as-is (e.g., shipping_address, options)
      result[key] = value
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Build a pagination skip/limit from page and limit params
 */
export function paginate(page: number = 1, limit: number = 20) {
  const safePage = Math.max(1, page)
  const safeLimit = Math.max(1, Math.min(100, limit))
  return {
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
    page: safePage,
  }
}

/**
 * Calculate total pages
 */
export function totalPages(total: number, limit: number): number {
  return Math.ceil(total / Math.max(1, limit))
}
