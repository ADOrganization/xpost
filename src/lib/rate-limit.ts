// Simple sliding window rate limiter
// Key: string (e.g., userId + action)
// Returns { success: boolean, remaining: number, reset: Date }

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60000);
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; reset: Date } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, reset: new Date(now + windowMs) };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: new Date(entry.resetAt) };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count, reset: new Date(entry.resetAt) };
}
