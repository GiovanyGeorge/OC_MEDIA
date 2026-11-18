/**
 * In-Memory & Distributed Rate Limiter
 * Provides brute-force mitigation for member activation attempts.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number; // Unix timestamp in ms
}

// In-memory sliding tracker per Cloudflare Worker instance
const ipTracker = new Map<string, RateLimitRecord>();
const refIdTracker = new Map<string, RateLimitRecord>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function purgeExpiredRecords(map: Map<string, RateLimitRecord>, now: number) {
  for (const [key, record] of map.entries()) {
    if (record.resetAt <= now) {
      map.delete(key);
    }
  }
}

/**
 * Checks and increments rate limit for a given key.
 *
 * @param key Unique identifier (IP address, reference ID, etc.)
 * @param maxRequests Maximum allowed attempts in window
 * @param windowMs Time window in milliseconds
 * @returns { allowed: boolean, remaining: number, retryAfterSec: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  tracker: Map<string, RateLimitRecord> = ipTracker
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();

  // Periodic cleanup of stale memory
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    purgeExpiredRecords(ipTracker, now);
    purgeExpiredRecords(refIdTracker, now);
    lastCleanup = now;
  }

  const record = tracker.get(key);

  if (!record || record.resetAt <= now) {
    tracker.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSec: 0,
    };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    retryAfterSec: 0,
  };
}

export { ipTracker, refIdTracker };
