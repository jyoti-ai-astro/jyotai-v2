// src/lib/rate-limit.ts
type Entry = { count: number; resetAt: number };
const BUCKET = new Map<string, Entry>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const entry = BUCKET.get(key);
  if (!entry || entry.resetAt < now) {
    BUCKET.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfterMs: entry.resetAt - now, remaining: 0 };
  }
  entry.count += 1;
  return { ok: true, remaining: limit - entry.count };
}
