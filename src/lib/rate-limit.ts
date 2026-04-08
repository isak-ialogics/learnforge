/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for single-process deployments (Vercel serverless per-instance).
 * For multi-instance production, replace with Redis-backed limiter.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/**
 * Returns true if the request is allowed, false if rate-limited.
 *
 * @param key     - unique key (e.g. `userId:endpoint`)
 * @param limit   - max requests per window
 * @param windowMs - window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

/** Convenience: returns a 429 Response when rate-limited, null otherwise. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Response | null {
  if (!rateLimit(key, limit, windowMs)) {
    return Response.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }
  return null;
}
