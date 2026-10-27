import { NextRequest } from 'next/server';
import { RATE_LIMIT_CONFIG } from '../config/limits';

interface RateLimitRecord {
  timestamps: number[];
}

const ipStore = new Map<string, RateLimitRecord>();

/**
 * Extracts client IP from standard proxy headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Sliding window in-memory rate limiter.
 * Caps requests per IP per time window.
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number = RATE_LIMIT_CONFIG.maxRequests,
  windowMs: number = RATE_LIMIT_CONFIG.windowMs
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  let record = ipStore.get(ip);

  if (!record) {
    record = { timestamps: [] };
    ipStore.set(ip, record);
  }

  // Filter timestamps within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}

export function resetRateLimits(): void {
  ipStore.clear();
}
