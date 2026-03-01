import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!
const MONGODB_DB = process.env.MONGODB_DB!

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable')
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable')
}

interface MongoClientCache {
  client: MongoClient | null
  promise: Promise<MongoClient> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientCache: MongoClientCache | undefined
}

const cached: MongoClientCache = globalThis._mongoClientCache ?? {
  client: null,
  promise: null,
}

if (!globalThis._mongoClientCache) {
  globalThis._mongoClientCache = cached
}

async function getClient(): Promise<MongoClient> {
  if (cached.client) {
    return cached.client
  }

  if (!cached.promise) {
    cached.promise = MongoClient.connect(MONGODB_URI)
  }

  cached.client = await cached.promise
  return cached.client
}

export async function getDb(): Promise<Db> {
  const client = await getClient()
  return client.db(MONGODB_DB)
}
