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
 * Recursively serialize a value for passing to Client Components.
 * Converts ObjectId to string, Date to ISO string, and recurses into objects/arrays.
 */
function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof ObjectId) return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map(serializeValue)
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v)
    }
    return result
  }
  return value
}

/**
 * Serialize a MongoDB document, converting ObjectId to string and Date to ISO string.
 */
export function serializeDoc<T extends Document>(doc: WithId<T>): Record<string, any> {
  if (!doc) return doc as Record<string, any>
  const { _id, ...rest } = doc as Record<string, unknown>
  const serialized = serializeValue(rest) as Record<string, unknown>
  return {
    ...serialized,
    id: _id ? _id.toString() : '',
  }
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
