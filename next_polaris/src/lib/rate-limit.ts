import { NextRequest, NextResponse } from "next/server"

// In-memory, per-process fixed-window rate limiter. There's no Redis/shared
// store in this deployment, so this won't coordinate across multiple app
// instances or survive a restart — but it stops the unauthenticated,
// unthrottled brute-force/enumeration paths (login, password reset, gift
// card validate/redeem) from being trivially scriptable, which today they are.
const buckets = new Map<string, { count: number; resetAt: number }>()

// Periodically drop expired buckets so this map doesn't grow unbounded.
setInterval(() => {
  const now = Date.now()
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}, 5 * 60 * 1000)

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "unknown"
}

/**
 * Returns a 429 NextResponse if the caller has exceeded `limit` requests
 * within `windowMs` for the given `scope`, otherwise null.
 */
export function checkRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const key = `${scope}:${getClientIp(request)}`
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  if (bucket.count >= limit) {
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000)
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    )
  }

  bucket.count += 1
  return null
}
