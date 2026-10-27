import { describe, it, expect } from 'vitest';
import { diffPlans } from './diff';
import { buildPlan } from './plan';
import { applyOps } from './ops';
import { EventState } from './types';
import { createTestEventState } from '../../test/fixtures';

describe('Diff Engine (diffPlans)', () => {
  const baseState: EventState = createTestEventState({
    totalBudget: 2_000_000,
  });

  const today = '2026-06-01';

  it('diff of identical plans has zero deltas, no shifts, and no added/resolved warnings', () => {
    const plan1 = buildPlan(baseState, today);
    const plan2 = buildPlan(baseState, today);

    const diff = diffPlans(plan1, plan2);

    expect(diff.shiftedTasks).toHaveLength(0);
    expect(diff.statusChanges).toHaveLength(0);
    expect(diff.addedWarnings).toHaveLength(0);
    expect(diff.resolvedWarnings).toHaveLength(0);

    diff.budgetDeltas.forEach((d) => {
      expect(d.deltaAmount).toBe(0);
      expect(d.deltaShare).toBe(0);
    });
  });

  it('reflects halved budget: negative deltas and potential added warnings', () => {
    const planBefore = buildPlan(baseState, today);

    const { state: halfState } = applyOps(baseState, [{ op: 'scale_budget', factor: 0.5 }]);
    const planAfter = buildPlan(halfState, today);

    const diff = diffPlans(planBefore, planAfter);

    diff.budgetDeltas.forEach((d) => {
      expect(d.deltaAmount).toBeLessThanOrEqual(0);
      expect(d.currentAmount).toBeLessThan(d.previousAmount);
    });
  });

  it('detects shifted deadlines when event date changes', () => {
    const planBefore = buildPlan(baseState, today);

    const { state: shiftedState } = applyOps(baseState, [{ op: 'shift_date_days', days: 14 }]);
    const planAfter = buildPlan(shiftedState, today);

    const diff = diffPlans(planBefore, planAfter);

    expect(diff.shiftedTasks.length).toBeGreaterThan(0);
    diff.shiftedTasks.forEach((st) => {
      expect(st.daysShifted).toBe(14);
    });
  });

  it('tracks status changes when tasks are marked complete', () => {
    const planBefore = buildPlan(baseState, today);

    const { state: completedState } = applyOps(baseState, [{ op: 'complete_task', taskId: 'date-fix' }]);
    const planAfter = buildPlan(completedState, today);

    const diff = diffPlans(planBefore, planAfter);
    const dateFixChange = diff.statusChanges.find((sc) => sc.taskId === 'date-fix');

    expect(dateFixChange).toBeDefined();
    expect(dateFixChange?.to).toBe('done');
  });
});
