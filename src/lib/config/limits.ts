/**
 * Global domain limits, multipliers, and threshold configurations.
 * Pure TypeScript constants only — no runtime side-effects.
 */

export const CONTINGENCY_PERCENT = 0.08;

export const PRIORITY_MULTIPLIERS = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.25,
  5: 1.5,
} as const;

export type PriorityLevel = keyof typeof PRIORITY_MULTIPLIERS;

export const BUDGET_LIMITS = {
  min: 1000,
  max: 100_000_000,
} as const;

export const GUEST_LIMITS = {
  min: 1,
  max: 2000,
} as const;

export const GUEST_DRIVEN_CATEGORIES = [
  'venue',
  'catering',
  'decor',
  'logistics',
] as const;

export const LOW_CATERING_PER_GUEST_THRESHOLD = 400;

export const HIGH_VENUE_SHARE_THRESHOLD = 0.45;

export const MAX_HISTORY_SNAPSHOTS = 20;

export const RATE_LIMIT_CONFIG = {
  maxRequests: 20,
  windowMs: 60_000,
  maxBodySizeBytes: 20 * 1024,
} as const;
