import redis from "./redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Seconds until reset
}

/**
 * Rate limiter using Redis (fixed window counter).
 * @param ip The identifier (usually IP address) to rate limit.
 * @param route The route name to scope the rate limit.
 * @param limit Max number of requests allowed in the window.
 * @param windowSeconds Window duration in seconds (default 60).
 */
export async function rateLimit(
  ip: string,
  route: string,
  limit: number = 300000,
  windowSeconds: number = 6
): Promise<RateLimitResult> {
  // Use a safe key prefix
  const key = `ratelimit:${route}:${ip}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      // First request in the window, set expiration
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const reset = ttl > 0 ? ttl : windowSeconds;

    return {
      success: current <= limit,
      limit,
      remaining: Math.max(0, limit - current),
      reset,
    };
  } catch (error) {
    console.error(`[RateLimiter] Redis error:`, error);
    // Fail-safe: if Redis fails, allow the request to pass
    return {
      success: true,
      limit,
      remaining: 1,
      reset: windowSeconds,
    };
  }
}
