import { describe, it, expect } from 'vitest';
import { buildPlan } from './plan';
import { CoreCategory, EventState } from './types';
import { createTestEventState } from '../../test/fixtures';

describe('Plan Builder (buildPlan)', () => {
  const completeState: EventState = createTestEventState({
    occasion: 'wedding',
    totalBudget: 1_500_000,
    guestCount: 200,
    eventDate: '2026-12-31',
    city: 'Jaipur',
  });

  it('builds a full plan without throwing on valid complete state', () => {
    const today = '2026-06-01';
    const plan = buildPlan(completeState, today);

    expect(plan.state).toEqual(completeState);
    expect(plan.budget.length).toBe(9);
    expect(plan.tasks.length).toBeGreaterThan(15);
    expect(plan.daysAvailable).toBe(213);
    expect(plan.criticalPathDays).toBeGreaterThan(0);
    expect(plan.compressed).toBe(false);

    expect(plan.warnings.some((w) => w.code === 'MISSING_REQUIRED')).toBe(false);
  });

  it('returns partial plan with MISSING_REQUIRED warning when required fields are missing', () => {
    const today = '2026-06-01';
    const incompleteState: EventState = createTestEventState({
      occasion: undefined,
      totalBudget: undefined,
      guestCount: undefined,
      eventDate: undefined,
    });

    const plan = buildPlan(incompleteState, today);
    expect(plan).toBeDefined();
    const missingWarn = plan.warnings.find((w) => w.code === 'MISSING_REQUIRED');
    expect(missingWarn).toBeDefined();
    expect(missingWarn?.severity).toBe('critical');
    expect(missingWarn?.related).toContain('occasion');
    expect(missingWarn?.related).toContain('totalBudget');
    expect(missingWarn?.related).toContain('guestCount');
    expect(missingWarn?.related).toContain('eventDate');
  });

  it('emits LOW_PER_GUEST_CATERING warning when catering per-guest < 400', () => {
    const today = '2026-06-01';
    const lowBudgetState: EventState = {
      ...completeState,
      totalBudget: 100_000,
      guestCount: 500,
    };

    const plan = buildPlan(lowBudgetState, today);
    const cateringWarn = plan.warnings.find((w) => w.code === 'LOW_PER_GUEST_CATERING');
    expect(cateringWarn).toBeDefined();
    expect(cateringWarn?.severity).toBe('warn');
  });

  it('emits HIGH_PER_HEAD_VENUE warning when venue share exceeds threshold', () => {
    const today = '2026-06-01';
    const highVenueState: EventState = {
      ...completeState,
      lockedCategories: ['venue'],
      lockedBudgetLines: { venue: 900_000 } as Record<CoreCategory, number>,
    };

    const plan = buildPlan(highVenueState, today);
    const venueWarn = plan.warnings.find((w) => w.code === 'HIGH_PER_HEAD_VENUE');
    expect(venueWarn).toBeDefined();
    expect(venueWarn?.severity).toBe('warn');
  });

  it('emits COMPRESSED_SCHEDULE warning when available days < critical path', () => {
    const today = '2026-12-25';
    const rushState: EventState = {
      ...completeState,
      eventDate: '2026-12-29',
    };

    const plan = buildPlan(rushState, today);
    expect(plan.compressed).toBe(true);
    const compressedWarn = plan.warnings.find((w) => w.code === 'COMPRESSED_SCHEDULE');
    expect(compressedWarn).toBeDefined();
  });

  it('emits OVERDUE_TASK warning when any task is overdue', () => {
    const today = '2026-12-25';
    const stateWithOverdue: EventState = {
      ...completeState,
      eventDate: '2026-12-26',
      completedTasks: [],
    };

    const plan = buildPlan(stateWithOverdue, today);
    const overdueWarn = plan.warnings.find((w) => w.code === 'OVERDUE_TASK');
    expect(overdueWarn).toBeDefined();
  });
});
