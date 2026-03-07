// NOTE: In-memory rate limiting — works for single-process deployments (next start).
// On serverless platforms (Vercel, AWS Lambda), each isolate has its own store,
// making this effectively per-process. Use Redis or similar for production serverless.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let callCount = 0;

export function checkRateLimit(
  ip: string,
  limit: number = 15,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  callCount++;

  // Periodic cleanup of stale entries
  if (callCount % 100 === 0) {
    for (const [key, entry] of store) {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    }
  }

  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}
