/**
 * Upstash Redis rate limiter factory — sliding window.
 *
 * Env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 *
 * Preset windows (match micelio.skyw.app playbook):
 *   strict  → 10 req / 10 s  (checkout, order creation)
 *   signup  → 5 req  / 60 s  (account creation)
 *   light   → 20 req / 10 s  (slug validation, polling)
 *
 * @example
 * ```ts
 * import { ratelimitStrict, getClientIp, rateLimitExceededResponse } from '@skywalking/core/rate-limit'
 *
 * export async function POST(req: Request) {
 *   const ip = getClientIp(req)
 *   const { success, limit, remaining, reset } = await ratelimitStrict.limit(ip)
 *   if (!success) return rateLimitExceededResponse(limit, remaining, reset)
 *   // …handler logic
 * }
 * ```
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function buildRedis(): Redis {
  return Redis.fromEnv()
}

/** 10 req / 10 s — checkout, order creation */
export const ratelimitStrict = new Ratelimit({
  redis: buildRedis(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'rl:strict',
})

/** 5 req / 60 s — signup (account creation) */
export const ratelimitSignup = new Ratelimit({
  redis: buildRedis(),
  limiter: Ratelimit.slidingWindow(5, '60 s'),
  analytics: true,
  prefix: 'rl:signup',
})

/** 20 req / 10 s — slug validation (UX polling) */
export const ratelimitLight = new Ratelimit({
  redis: buildRedis(),
  limiter: Ratelimit.slidingWindow(20, '10 s'),
  analytics: true,
  prefix: 'rl:light',
})

/**
 * Factory for custom rate limit windows.
 */
export function createRatelimit(
  tokens: number,
  window: string,
  prefix: string,
  analytics = true,
): Ratelimit {
  return new Ratelimit({
    redis: buildRedis(),
    limiter: Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    analytics,
    prefix,
  })
}

/**
 * Extract best-effort client IP from Next.js request headers.
 * Falls back to '127.0.0.1' (single dev bucket).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

/**
 * Build a 429 Response with standard rate-limit headers.
 */
export function rateLimitExceededResponse(
  limit: number,
  remaining: number,
  reset: number,
): Response {
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'Retry-After': String(Math.max(0, Math.ceil((reset - Date.now()) / 1000))),
      'X-RateLimit-Limit': String(limit),
      'X-RateLimit-Remaining': String(remaining),
      'Content-Type': 'text/plain',
    },
  })
}
