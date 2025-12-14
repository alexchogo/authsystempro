import { NextRequest } from 'next/server'
import { ApiError } from './errors'
import { redisClient } from './redis'

// Simple in-memory fallback for dev/local when Redis is unavailable
type Hit = { count: number; expires: number }
const memoryHits = new Map<string, Hit>()

function memoryIncr(key: string, windowSeconds: number) {
	const now = Date.now()
	const hit = memoryHits.get(key)
	if (!hit || hit.expires < now) {
		memoryHits.set(key, { count: 1, expires: now + windowSeconds * 1000 })
		return 1
	}
	hit.count += 1
	return hit.count
}

// key usage: `${prefix}:${ipOrId}` value: count, TTL: window seconds
export async function rateLimit(
	req: Request | NextRequest,
	prefix = 'rl',
	limit = 10,
	windowSeconds = 60
) {
	const forwardedFor = (req as Request).headers.get('x-forwarded-for')
	const ip = forwardedFor?.split(',')[0]?.trim() ?? 'unknown'
	const key = `${prefix}:${ip}`

	// Try Redis first if available; fallback to memory on any error
	if (redisClient) {
		try {
			const current = await redisClient.incr(key)
			if (current === 1) await redisClient.expire(key, windowSeconds)
			if (current > limit) throw ApiError(429, 'Too many requests — try again later')
			return
		} catch {
			// fall through to memory
		}
	}

	const current = memoryIncr(key, windowSeconds)
	if (current > limit) throw ApiError(429, 'Too many requests — try again later')
}

export { redisClient }