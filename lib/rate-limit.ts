/**
 * lib/rate-limit.ts
 * Sliding-window rate limiter with Redis backend (production) and
 * in-memory fallback (local dev / no Redis configured).
 *
 * Redis mode  → works correctly across any number of server replicas.
 * Memory mode → single-instance only, fine for local development.
 */

// ── In-memory fallback store ──────────────────────────────────────────────────
interface MemEntry { count: number; windowStart: number }
const memStore = new Map<string, MemEntry>()

interface RateLimitOptions {
    /** Max requests allowed within the window */
    limit: number
    /** Window size in milliseconds */
    windowMs: number
}

interface RateLimitResult {
    success: boolean
    remaining: number
    resetInMs: number
}

// ── Redis-backed implementation ───────────────────────────────────────────────
async function redisRateLimit(
    key: string,
    { limit, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
    // Lazy import — only loads when Redis is actually available
    // @ts-ignore - Redis module may not exist locally
    const { redisPublisher: redis } = await import("@/lib/redis")
    const windowSec = Math.ceil(windowMs / 1000)
    const redisKey  = `rl:${key}:${Math.floor(Date.now() / windowMs)}`

    const pipeline = redis.pipeline()
    pipeline.incr(redisKey)
    pipeline.expire(redisKey, windowSec)
    const results = await pipeline.exec()

    const count    = (results?.[0]?.[1] as number) ?? 1
    const remaining = Math.max(0, limit - count)
    const resetInMs = windowMs - (Date.now() % windowMs)

    return { success: count <= limit, remaining, resetInMs }
}

// ── In-memory implementation ──────────────────────────────────────────────────
function memRateLimit(key: string, { limit, windowMs }: RateLimitOptions): RateLimitResult {
    const now   = Date.now()
    const entry = memStore.get(key)

    if (!entry || now - entry.windowStart > windowMs) {
        memStore.set(key, { count: 1, windowStart: now })
        return { success: true, remaining: limit - 1, resetInMs: windowMs }
    }
    if (entry.count >= limit) {
        return { success: false, remaining: 0, resetInMs: windowMs - (now - entry.windowStart) }
    }
    entry.count += 1
    memStore.set(key, entry)
    return { success: true, remaining: limit - entry.count, resetInMs: windowMs - (now - entry.windowStart) }
}

// ── Unified export — auto-selects backend ────────────────────────────────────
export async function rateLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
    if (process.env.REDIS_URL) {
        try {
            return await redisRateLimit(key, opts)
        } catch {
            // Redis unreachable — fall through to memory store
        }
    }
    return memRateLimit(key, opts)
}

/**
 * Extract the real client IP respecting common reverse-proxy headers.
 * Priority: Cloudflare → nginx x-real-ip → x-forwarded-for → fallback
 */
export function getClientIp(req: Request): string {
    const h = req.headers
    return (
        h.get("cf-connecting-ip") ||
        h.get("x-real-ip")        ||
        h.get("x-forwarded-for")?.split(",")[0].trim() ||
        "unknown"
    )
}
