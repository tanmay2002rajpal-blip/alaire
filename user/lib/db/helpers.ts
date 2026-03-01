import { ObjectId } from "mongodb"

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id)
}

export function serializeDoc<T>(doc: T & { _id?: ObjectId }): T & { id: string } {
  if (!doc) return doc as T & { id: string }
  const { _id, ...rest } = doc as Record<string, unknown>
  return {
    ...rest,
    id: _id ? _id.toString() : "",
  } as T & { id: string }
}

export function serializeDocs<T>(docs: (T & { _id?: ObjectId })[]): (T & { id: string })[] {
  return docs.map(serializeDoc)
}
