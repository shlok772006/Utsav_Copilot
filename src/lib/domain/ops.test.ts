import { describe, it, expect } from 'vitest';
import { applyOps } from './ops';
import { EventState, Op, PriorityLevel } from './types';
import { createTestEventState } from '../../test/fixtures';

describe('Operations Engine (applyOps)', () => {
  const baseState: EventState = createTestEventState({
    totalBudget: 1_000_000,
    guestCount: 200,
    eventDate: '2026-11-20',
  });

  it('applies set_budget within valid range', () => {
    const ops: Op[] = [{ op: 'set_budget', value: 2_500_000 }];
    const { state, rejected } = applyOps(baseState, ops);

    expect(rejected).toHaveLength(0);
    expect(state.totalBudget).toBe(2_500_000);
  });

  it('rejects set_budget when out of bounds or negative', () => {
    const ops: Op[] = [
      { op: 'set_budget', value: -500 },
      { op: 'set_budget', value: 200_000_000 },
    ];
    const { state, rejected } = applyOps(baseState, ops);

    expect(rejected).toHaveLength(2);
    expect(rejected[0].reason).toContain('out of permitted bounds');
    expect(state.totalBudget).toBe(1_000_000); // Unchanged
  });

  it('halves budget with scale_budget 0.5', () => {
    const ops: Op[] = [{ op: 'scale_budget', factor: 0.5 }];
    const { state, rejected } = applyOps(baseState, ops);

    expect(rejected).toHaveLength(0);
    expect(state.totalBudget).toBe(500_000);
  });

  it('applies set_guest_count and rejects out of bounds count', () => {
    const validOp: Op = { op: 'set_guest_count', value: 350 };
    const invalidOp: Op = { op: 'set_guest_count', value: 5000 };

    const res1 = applyOps(baseState, [validOp]);
    expect(res1.rejected).toHaveLength(0);
    expect(res1.state.guestCount).toBe(350);

    const res2 = applyOps(baseState, [invalidOp]);
    expect(res2.rejected).toHaveLength(1);
    expect(res2.rejected[0].reason).toContain('outside allowed limits');
    expect(res2.state.guestCount).toBe(200);
  });

  it('shifts date and rejects if shifted into the past', () => {
    const today = '2026-06-01';
    // Shift forward 10 days
    const forwardOp: Op = { op: 'shift_date_days', days: 10 };
    const res1 = applyOps(baseState, [forwardOp], today);
    expect(res1.rejected).toHaveLength(0);
    expect(res1.state.eventDate).toBe('2026-11-30');

    // Shift backward into the past relative to today
    const pastOp: Op = { op: 'shift_date_days', days: -200 };
    const res2 = applyOps(baseState, [pastOp], today);
    expect(res2.rejected).toHaveLength(1);
    expect(res2.rejected[0].reason).toContain('cannot be in the past');
    expect(res2.state.eventDate).toBe('2026-11-20');
  });

  it('updates priority level and category lock states', () => {
    const ops: Op[] = [
      { op: 'set_priority', category: 'catering', level: 5 },
      { op: 'lock_category', category: 'catering' },
    ];
    const { state, rejected } = applyOps(baseState, ops);

    expect(rejected).toHaveLength(0);
    expect(state.priorities.catering).toBe(5);
    expect(state.lockedCategories).toContain('catering');

    // Now unlock
    const unlockRes = applyOps(state, [{ op: 'unlock_category', category: 'catering' }]);
    expect(unlockRes.state.lockedCategories).not.toContain('catering');
  });

  it('manages constraints cleanly', () => {
    const ops: Op[] = [
      { op: 'add_constraint', kind: 'dietary', value: 'Strict Jain' },
      { op: 'add_constraint', kind: 'accessibility', value: 'Wheelchair ramp required' },
    ];
    const { state, rejected } = applyOps(baseState, ops);
    expect(rejected).toHaveLength(0);
    expect(state.constraints.dietary).toContain('Strict Jain');
    expect(state.constraints.accessibility).toContain('Wheelchair ramp required');

    // Remove constraint
    const removeRes = applyOps(state, [{ op: 'remove_constraint', kind: 'dietary', value: 'Strict Jain' }]);
    expect(removeRes.state.constraints.dietary).not.toContain('Strict Jain');
  });

  it('marks known tasks as completed and rejects unknown task IDs', () => {
    const validOp: Op = { op: 'complete_task', taskId: 'date-fix' };
    const invalidOp: Op = { op: 'complete_task', taskId: 'fly-to-the-moon' };

    const { state, rejected } = applyOps(baseState, [validOp, invalidOp]);
    expect(state.completedTasks).toContain('date-fix');
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toContain('Unknown taskId');
  });

  it('applies valid ops in a mixed batch and reports invalid ones', () => {
    const ops: Op[] = [
      { op: 'set_budget', value: 1_200_000 }, // valid
      { op: 'set_guest_count', value: -10 },   // invalid
      { op: 'set_priority', category: 'decor', level: 4 }, // valid
      { op: 'set_priority', category: 'decor', level: 9 as unknown as PriorityLevel }, // invalid
    ];

    const { state, rejected } = applyOps(baseState, ops);
    expect(state.totalBudget).toBe(1_200_000);
    expect(state.guestCount).toBe(200); // unchanged
    expect(state.priorities.decor).toBe(4);
    expect(rejected).toHaveLength(2);
  });
});
