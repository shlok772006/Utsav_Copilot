import { describe, it, expect } from 'vitest';
import { normalizeQuote } from './quote';
import { buildPlan } from './plan';
import { EventState, RawQuote } from './types';
import { createTestEventState } from '../../test/fixtures';

describe('Quote Normalizer (normalizeQuote)', () => {
  const baseState: EventState = createTestEventState({
    totalBudget: 1_000_000,
  });

  const plan = buildPlan(baseState, '2026-06-01');

  it('normalizes per-plate quote correctly with guest count', () => {
    const raw: RawQuote = {
      category: 'catering',
      vendorName: 'Royal Rasoi Caterers',
      unitPrice: 1200,
      unitType: 'per_plate',
      coverageCount: 200,
      includesTax: true,
    };

    const normalized = normalizeQuote(raw, baseState, plan);

    expect(normalized.vendorName).toBe('Royal Rasoi Caterers');
    expect(normalized.totalPrice).toBe(240_000); // 1200 * 200
    expect(normalized.perGuest).toBe(1200);
    expect(normalized.missingFields).toHaveLength(0);
  });

  it('flags missing unit info and returns null total when unit info is ambiguous', () => {
    const rawAmbiguous: RawQuote = {
      category: 'decor',
      vendorName: 'Floral Dreams',
      unitPrice: 15_000,
    };

    const normalized = normalizeQuote(rawAmbiguous, baseState, plan);

    expect(normalized.totalPrice).toBeNull();
    expect(normalized.perGuest).toBeNull();
    expect(normalized.missingFields).toContain('unitType');
  });

  it('raises OVER_BUDGET_QUOTE warning when quote exceeds the category budget line', () => {
    const cateringLine = plan.budget.find((b) => b.category === 'catering')!;

    const expensiveRaw: RawQuote = {
      category: 'catering',
      vendorName: 'Grand Feast Co',
      totalPrice: cateringLine.amount + 100_000,
      includesTax: true,
    };

    const normalized = normalizeQuote(expensiveRaw, baseState, plan);

    expect(normalized.isOverBudget).toBe(true);
    expect(normalized.vsBudgetLine).toBe(100_000);
    const overWarn = normalized.warnings.find((w) => w.code === 'OVER_BUDGET_QUOTE');
    expect(overWarn).toBeDefined();
    expect(overWarn?.severity).toBe('warn');
  });

  it('handles excluded tax with taxRate adjustment', () => {
    const rawWithGst: RawQuote = {
      category: 'photography',
      vendorName: 'Candid Studio',
      totalPrice: 100_000,
      includesTax: false,
      taxRate: 0.18, // 18% GST
    };

    const normalized = normalizeQuote(rawWithGst, baseState, plan);

    expect(normalized.totalPrice).toBe(118_000);
  });
});
