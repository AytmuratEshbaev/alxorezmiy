import 'server-only';

/**
 * Simple in-memory sliding-window rate limiter.
 *
 * NOTE: state lives in the module scope of a single serverless/Node instance.
 * It is therefore PER-INSTANCE — under horizontal scaling each instance keeps
 * its own window. That is perfectly fine for this project's scale (a small
 * school site with low traffic); it defends against naive floods without a
 * Redis/KV dependency. For strict global limits swap this for a shared store.
 */

interface Bucket {
  // Timestamps (ms) of requests still inside the active window.
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so keys for idle clients don't accumulate forever.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number, maxWindowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => now - t < maxWindowMs);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}

/**
 * Returns `true` if the request is allowed, `false` if the caller has exceeded
 * `limit` requests within the trailing `windowMs`.
 */
export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): boolean {
  const now = Date.now();
  cleanup(now, windowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }

  // Drop timestamps outside the window, then decide.
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) return false;

  bucket.hits.push(now);
  return true;
}

/** Extract the client IP from an incoming request's forwarding headers. */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
