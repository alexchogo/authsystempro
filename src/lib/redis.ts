import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL

// Build a Redis client when URL is provided; otherwise remain null.
function createRedisClient() {
  if (!redisUrl) return null
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      reconnectOnError: () => false,
    })
    // Connect asynchronously; failures are handled by callers via null checks.
    client.connect().catch(() => { /* ignore; caller will fall back */ })
    return client
  } catch {
    return null
  }
}

export const redisClient = createRedisClient()
