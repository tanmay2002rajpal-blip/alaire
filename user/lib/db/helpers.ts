import { ObjectId } from "mongodb"

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
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
  if (typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      result[k] = serializeValue(v)
    }
    return result
  }
  return value
}

export function serializeDoc<T>(doc: T & { _id?: ObjectId }): T & { id: string } {
  if (!doc) return doc as T & { id: string }
  const { _id, ...rest } = doc as Record<string, unknown>
  const serialized = serializeValue(rest) as Record<string, unknown>
  return {
    ...serialized,
    id: _id ? _id.toString() : "",
  } as T & { id: string }
}

export function serializeDocs<T>(docs: (T & { _id?: ObjectId })[]): (T & { id: string })[] {
  return docs.map(serializeDoc)
}
