import { describe, it, expect } from 'vitest';
import { generateScenarios } from './scenarios';
import { buildPlan } from './plan';
import { applyOps } from './ops';
import { EventState } from './types';
import { createTestEventState } from '../../test/fixtures';

describe('Scenario Generator (generateScenarios)', () => {
  const baseState: EventState = createTestEventState({
    totalBudget: 1_000_000,
  });

  const today = '2026-06-01';

  it('generates 2 to 3 scenarios with valid ops for a normal plan', () => {
    const plan = buildPlan(baseState, today);
    const scenarios = generateScenarios(baseState, plan);

    expect(scenarios.length).toBeGreaterThanOrEqual(2);
    expect(scenarios.length).toBeLessThanOrEqual(3);

    scenarios.forEach((sc) => {
      expect(sc.id).toBeDefined();
      expect(sc.headline).toBeDefined();
      expect(sc.why).toBeDefined();
      expect(sc.tradeoff).toBeDefined();
      expect(sc.ops.length).toBeGreaterThan(0);

      const { rejected } = applyOps(baseState, sc.ops, today);
      expect(rejected).toHaveLength(0);
    });
  });

  it('prioritizes extend-timeline scenario when compressed schedule warning is active', () => {
    const compressedState: EventState = {
      ...baseState,
      eventDate: '2026-06-10', // 9 days available, far less than critical path
    };

    const plan = buildPlan(compressedState, today);
    expect(plan.compressed).toBe(true);

    const scenarios = generateScenarios(compressedState, plan);
    expect(scenarios[0].id).toBe('extend-timeline');

    const { state: updatedState } = applyOps(compressedState, scenarios[0].ops, today);
    const newPlan = buildPlan(updatedState, today);
    expect(newPlan.compressed).toBe(false);
  });

  it('prioritizes guest trimming and catering rebalancing when LOW_PER_GUEST_CATERING warning is active', () => {
    const lowCateringState: EventState = {
      ...baseState,
      totalBudget: 100_000,
      guestCount: 500,
    };

    const plan = buildPlan(lowCateringState, today);
    const hasLowCateringWarn = plan.warnings.some((w) => w.code === 'LOW_PER_GUEST_CATERING');
    expect(hasLowCateringWarn).toBe(true);

    const scenarios = generateScenarios(lowCateringState, plan);
    const topIds = scenarios.map((s) => s.id);
    expect(topIds).toContain('trim-guests');
  });
});
