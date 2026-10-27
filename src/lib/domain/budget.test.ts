import { describe, it, expect } from 'vitest';
import { allocateBudget } from './budget';
import { CoreCategory, EventState, Occasion, PriorityLevel } from './types';
import { CONTINGENCY_PERCENT } from '../config/limits';
import { createTestEventState, DEFAULT_PRIORITIES } from '../../test/fixtures';

describe('Budget Engine (allocateBudget)', () => {
  const emptyState: EventState = createTestEventState({
    totalBudget: undefined,
  });

  it('returns empty array when totalBudget is undefined or 0', () => {
    expect(allocateBudget(emptyState)).toEqual([]);
    expect(allocateBudget({ ...emptyState, totalBudget: 0 })).toEqual([]);
  });

  it('allocates 100,001 so the sum of all lines equals total exactly (largest-remainder)', () => {
    const total = 100001;
    const state: EventState = createTestEventState({
      occasion: 'wedding',
      totalBudget: total,
      guestCount: 150,
    });

    const lines = allocateBudget(state);
    expect(lines.length).toBe(9); // 8 core + 1 contingency
    const sum = lines.reduce((acc, l) => acc + l.amount, 0);
    expect(sum).toBe(total);
  });

  it('property test: sum equals total across 50 randomized inputs', () => {
    const occasions: Occasion[] = [
      'wedding',
      'reception',
      'sangeet',
      'anniversary',
      'birthday',
      'engagement',
      'general',
    ];

    for (let i = 0; i < 50; i++) {
      const totalBudget = Math.floor(Math.random() * 50_000_000) + 10_000;
      const guestCount = Math.floor(Math.random() * 800) + 10;
      const occasion = occasions[i % occasions.length];

      const priorities: Record<CoreCategory, PriorityLevel> = {
        venue: (((i % 5) + 1) as PriorityLevel),
        catering: ((((i + 1) % 5) + 1) as PriorityLevel),
        decor: ((((i + 2) % 5) + 1) as PriorityLevel),
        photography: ((((i + 3) % 5) + 1) as PriorityLevel),
        attire: ((((i + 4) % 5) + 1) as PriorityLevel),
        entertainment: (((i % 5) + 1) as PriorityLevel),
        invitations_misc: ((((i + 2) % 5) + 1) as PriorityLevel),
        logistics: ((((i + 3) % 5) + 1) as PriorityLevel),
      };

      const state: EventState = createTestEventState({
        occasion,
        totalBudget,
        guestCount,
        priorities,
      });

      const lines = allocateBudget(state);
      const sum = lines.reduce((acc, l) => acc + l.amount, 0);
      expect(sum).toBe(totalBudget);
      lines.forEach((line) => {
        expect(line.amount).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(line.amount)).toBe(true);
      });
    }
  });

  it('higher priority yields a larger share than lower priority, all else equal', () => {
    const baseState: EventState = createTestEventState({
      occasion: 'birthday',
      totalBudget: 1_000_000,
      guestCount: 50,
      priorities: {
        ...DEFAULT_PRIORITIES,
        photography: 1,
      },
    });

    const linesPrio1 = allocateBudget(baseState);
    const photoLinePrio1 = linesPrio1.find((l) => l.category === 'photography')!;

    const statePrio5: EventState = {
      ...baseState,
      priorities: {
        ...baseState.priorities,
        photography: 5,
      },
    };

    const linesPrio5 = allocateBudget(statePrio5);
    const photoLinePrio5 = linesPrio5.find((l) => l.category === 'photography')!;

    expect(photoLinePrio5.amount).toBeGreaterThan(photoLinePrio1.amount);
    expect(photoLinePrio5.share).toBeGreaterThan(photoLinePrio1.share);
  });

  it('locked category amount is unchanged when adjusting other priorities', () => {
    const lockedVenueAmount = 250_000;
    const stateWithLock: EventState = createTestEventState({
      occasion: 'anniversary',
      totalBudget: 1_000_000,
      guestCount: 100,
      priorities: {
        ...DEFAULT_PRIORITIES,
        catering: 2,
      },
      lockedCategories: ['venue'],
      lockedBudgetLines: { venue: lockedVenueAmount } as Record<CoreCategory, number>,
    });

    const lines1 = allocateBudget(stateWithLock);
    const venue1 = lines1.find((l) => l.category === 'venue')!;
    expect(venue1.amount).toBe(lockedVenueAmount);

    const stateAdjusted: EventState = {
      ...stateWithLock,
      priorities: {
        ...stateWithLock.priorities,
        catering: 5,
        decor: 5,
      },
    };

    const lines2 = allocateBudget(stateAdjusted);
    const venue2 = lines2.find((l) => l.category === 'venue')!;
    expect(venue2.amount).toBe(lockedVenueAmount);

    const sum2 = lines2.reduce((acc, l) => acc + l.amount, 0);
    expect(sum2).toBe(1_000_000);
  });

  it('contingency is always present and near the configured percentage', () => {
    const total = 500_000;
    const state: EventState = createTestEventState({
      occasion: 'engagement',
      totalBudget: total,
      guestCount: 80,
    });

    const lines = allocateBudget(state);
    const contingency = lines.find((l) => l.category === 'contingency');
    expect(contingency).toBeDefined();
    expect(contingency!.amount).toBe(Math.round(total * CONTINGENCY_PERCENT));
  });

  it('handles tiny budgets and large guest counts without NaN or negative values', () => {
    const tinyState: EventState = createTestEventState({
      occasion: 'birthday',
      totalBudget: 50,
      guestCount: 500,
    });

    const lines = allocateBudget(tinyState);
    expect(lines.length).toBe(9);
    const sum = lines.reduce((acc, l) => acc + l.amount, 0);
    expect(sum).toBe(50);

    lines.forEach((l) => {
      expect(isNaN(l.amount)).toBe(false);
      expect(l.amount).toBeGreaterThanOrEqual(0);
      if (l.perGuest !== undefined) {
        expect(isNaN(l.perGuest)).toBe(false);
        expect(l.perGuest).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
