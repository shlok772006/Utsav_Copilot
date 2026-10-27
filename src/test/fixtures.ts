import { CoreCategory, EventState, PriorityLevel } from '../lib/domain/types';

export const DEFAULT_PRIORITIES: Record<CoreCategory, PriorityLevel> = {
  venue: 3,
  catering: 3,
  decor: 3,
  photography: 3,
  attire: 3,
  entertainment: 3,
  invitations_misc: 3,
  logistics: 3,
};

export function createTestEventState(overrides: Partial<EventState> = {}): EventState {
  return {
    occasion: 'wedding',
    totalBudget: 1_000_000,
    guestCount: 200,
    eventDate: '2026-12-31',
    city: 'Jaipur',
    priorities: { ...DEFAULT_PRIORITIES },
    lockedCategories: [],
    lockedBudgetLines: {} as Record<CoreCategory, number>,
    constraints: {
      dietary: [],
      accessibility: [],
      cultural: [],
      other: [],
    },
    completedTasks: [],
    ...overrides,
  };
}
