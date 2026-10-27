import { describe, it, expect } from 'vitest';
import { resolveDateHint } from './date-hint';

describe('resolveDateHint', () => {
  const today = '2026-06-01';

  it('resolves relative weeks: "in 5 weeks" -> 35 days later', () => {
    const result = resolveDateHint('in 5 weeks', today);
    expect(result).toBe('2026-07-06');
  });

  it('resolves relative months: "in 2 months" -> 60 days later', () => {
    const result = resolveDateHint('in 2 months', today);
    expect(result).toBe('2026-07-31');
  });

  it('resolves relative days: "in 10 days" -> 10 days later', () => {
    const result = resolveDateHint('in 10 days', today);
    expect(result).toBe('2026-06-11');
  });

  it('resolves explicit date: "15 Dec 2026"', () => {
    const result = resolveDateHint('15 Dec 2026', today);
    expect(result).toBe('2026-12-15');
  });

  it('returns ISO string untouched if valid: "2026-11-20"', () => {
    const result = resolveDateHint('2026-11-20', today);
    expect(result).toBe('2026-11-20');
  });

  it('returns null for ambiguous phrases that cannot be deterministically resolved', () => {
    expect(resolveDateHint('soon', today)).toBeNull();
    expect(resolveDateHint('', today)).toBeNull();
    expect(resolveDateHint(null, today)).toBeNull();
  });
});
