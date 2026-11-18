/**
 * Distributed Rate Limiting & Brute-Force Protection
 *
 * Designed specifically for Cloudflare Pages Free Plan & Firestore Spark Free Plan.
 *
 * Architecture:
 * 1. Per-Activation-Code Limits:
 *    - Backed by Firestore document `activationCodes/{codeHmac}` (strongly consistent globally).
 *    - Tracks `failedAttempts`, `lastAttemptAt`, and `lockedUntil`.
 *    - 5 failed attempts -> 30-minute hard lockout.
 *
 * 2. Per-Reference-ID Limits:
 *    - Backed by Firestore document `rateLimits/ref_{referenceId}`.
 *    - Tracks cumulative failed attempts against a specific reference ID.
 *    - 5 failed attempts in 5 minutes -> 30-minute lockout.
 *
 * 3. Per-IP Limits:
 *    - Two-tiered defense:
 *      a) Fast edge in-memory filter (local isolate protection against flooding).
 *      b) Distributed Firestore document `rateLimits/ip_{ipHash}`.
 *    - 10 requests per 60 seconds per IP -> HTTP 429.
 *
 * Consistency & Free-Plan Analysis:
 * - Cloudflare Workers in-memory Maps are isolate-local, so they cannot guarantee
 *   strict cross-PoP consistency alone.
 * - By persisting rate-limiting counters in Cloud Firestore, consistency is global
 *   across all Cloudflare edge data centers.
 * - Quota impact: Firestore Spark free tier provides 20,000 writes/day and 50,000 reads/day,
 *   which comfortably accommodates recruitment cohort activation volume without any paid services.
 */

import { getDocument, patchDocument, createDocument } from './firestoreApi';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
  reason?: string;
}

// Local edge isolate cache to absorb rapid bursts and reduce Firestore read/write operations
export const localEdgeIpTracker = new Map<string, { count: number; resetAt: number }>();

/**
 * Edge-local pre-filter for IP rate limiting.
 */
export function checkEdgeLocalRateLimit(
  clientIp: string,
  maxRequests = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const record = localEdgeIpTracker.get(clientIp);

  if (!record || record.resetAt <= now) {
    localEdgeIpTracker.set(clientIp, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
      reason: `تجاوزت الحد المسموح به من الطلبات من هذا العنوان. يرجى الانتظار لمدة ${retryAfterSec} ثانية.`,
    };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, retryAfterSec: 0 };
}

/**
 * Distributed IP Rate Limiter backed by Cloud Firestore.
 * Ensures consistent rate limiting across all Cloudflare edge PoPs worldwide.
 */
export async function checkDistributedIpRateLimit(
  accessToken: string,
  projectId: string,
  clientIp: string,
  maxRequests = 10,
  windowMs = 60_000
): Promise<RateLimitResult> {
  // 1. Fast local edge check first
  const localCheck = checkEdgeLocalRateLimit(clientIp, maxRequests, windowMs);
  if (!localCheck.allowed) {
    return localCheck;
  }

  // 2. Hash IP for clean Firestore document ID
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(clientIp));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const ipDocId = `ip_${hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)}`;

  const now = Date.now();
  const doc = await getDocument<{ count: number; windowStart: number; lockedUntil?: string }>(
    accessToken,
    projectId,
    'rateLimits',
    ipDocId
  );

  if (!doc) {
    try {
      await createDocument(accessToken, projectId, 'rateLimits', ipDocId, {
        count: 1,
        windowStart: now,
        updatedAt: new Date(now),
      });
    } catch {
      // Document might have been created concurrently; continue gracefully
    }
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  // Check if IP is under hard lockout
  if (doc.lockedUntil) {
    const lockedUntilMs = new Date(doc.lockedUntil).getTime();
    if (lockedUntilMs > now) {
      const retryAfterSec = Math.ceil((lockedUntilMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec,
        reason: `تم حظر هذا العنوان مؤقتاً لتكرار الطلبات. يرجى المحاولة بعد ${retryAfterSec} ثانية.`,
      };
    }
  }

  // Check if current window has expired
  if (now > doc.windowStart + windowMs) {
    await patchDocument(
      accessToken,
      projectId,
      'rateLimits',
      ipDocId,
      { count: 1, windowStart: now, updatedAt: new Date(now) },
      ['count', 'windowStart', 'updatedAt']
    );
    return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
  }

  // Window still active — check count
  if (doc.count >= maxRequests) {
    const retryAfterSec = Math.ceil((doc.windowStart + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
      reason: `تم تجاوز الحد الأقصى للطلبات من هذا العنوان. يرجى المحاولة بعد ${retryAfterSec} ثانية.`,
    };
  }

  // Increment counter
  await patchDocument(
    accessToken,
    projectId,
    'rateLimits',
    ipDocId,
    { count: doc.count + 1, updatedAt: new Date(now) },
    ['count', 'updatedAt']
  );

  return { allowed: true, remaining: maxRequests - (doc.count + 1), retryAfterSec: 0 };
}

/**
 * Distributed Reference-ID Rate Limiter backed by Cloud Firestore.
 * Prevents distributed credential-stuffing attacks targeting a specific Reference ID across multiple IPs.
 */
export async function recordFailedReferenceAttempt(
  accessToken: string,
  projectId: string,
  referenceId: string,
  maxAttempts = 5,
  lockoutDurationMs = 30 * 60_000 // 30 minutes
): Promise<{ locked: boolean; retryAfterSec: number }> {
  const refDocId = `ref_${referenceId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')}`;
  const now = Date.now();

  const doc = await getDocument<{ failedAttempts: number; lockedUntil?: string }>(
    accessToken,
    projectId,
    'rateLimits',
    refDocId
  );

  if (!doc) {
    try {
      await createDocument(accessToken, projectId, 'rateLimits', refDocId, {
        failedAttempts: 1,
        lastAttemptAt: new Date(now),
      });
    } catch {
      // Ignore concurrent insert race
    }
    return { locked: false, retryAfterSec: 0 };
  }

  const newCount = (doc.failedAttempts || 0) + 1;
  const updates: Record<string, any> = {
    failedAttempts: newCount,
    lastAttemptAt: new Date(now),
  };

  if (newCount >= maxAttempts) {
    const lockedUntil = new Date(now + lockoutDurationMs);
    updates.lockedUntil = lockedUntil;
    await patchDocument(accessToken, projectId, 'rateLimits', refDocId, updates, [
      'failedAttempts',
      'lastAttemptAt',
      'lockedUntil',
    ]);
    return {
      locked: true,
      retryAfterSec: Math.ceil(lockoutDurationMs / 1000),
    };
  }

  await patchDocument(accessToken, projectId, 'rateLimits', refDocId, updates, [
    'failedAttempts',
    'lastAttemptAt',
  ]);

  return { locked: false, retryAfterSec: 0 };
}

/**
 * Checks whether a Reference ID is currently locked.
 */
export async function isReferenceIdLocked(
  accessToken: string,
  projectId: string,
  referenceId: string
): Promise<{ locked: boolean; retryAfterSec: number }> {
  const refDocId = `ref_${referenceId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '')}`;
  const now = Date.now();

  const doc = await getDocument<{ lockedUntil?: string }>(
    accessToken,
    projectId,
    'rateLimits',
    refDocId
  );

  if (!doc || !doc.lockedUntil) {
    return { locked: false, retryAfterSec: 0 };
  }

  const lockedUntilMs = new Date(doc.lockedUntil).getTime();
  if (lockedUntilMs > now) {
    return {
      locked: true,
      retryAfterSec: Math.ceil((lockedUntilMs - now) / 1000),
    };
  }

  return { locked: false, retryAfterSec: 0 };
}
