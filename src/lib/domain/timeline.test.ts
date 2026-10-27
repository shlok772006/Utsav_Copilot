import { describe, it, expect } from 'vitest';
import { scheduleTasks, CycleError, topologicalSortTasks } from './timeline';
import { EventState, TaskTemplate } from './types';
import { createTestEventState } from '../../test/fixtures';

describe('Timeline Engine (scheduleTasks)', () => {
  const baseState: EventState = createTestEventState({
    totalBudget: 2_000_000,
    guestCount: 200,
    eventDate: '2026-12-31',
  });

  it('respects topological order for all task dependencies', () => {
    const today = '2026-06-01';
    const result = scheduleTasks(baseState, today);
    const idToIndex = new Map<string, number>();
    result.tasks.forEach((t, idx) => idToIndex.set(t.id, idx));

    result.tasks.forEach((t) => {
      t.dependsOn.forEach((depId) => {
        expect(idToIndex.has(depId)).toBe(true);
        expect(idToIndex.get(depId)!).toBeLessThan(idToIndex.get(t.id)!);
      });
    });
  });

  it('throws CycleError when a circular dependency exists in templates', () => {
    const cycleTemplates: TaskTemplate[] = [
      {
        id: 'task-a',
        title: 'Task A',
        category: 'venue',
        dependsOn: ['task-b'],
        durationDays: 5,
        optional: false,
      },
      {
        id: 'task-b',
        title: 'Task B',
        category: 'catering',
        dependsOn: ['task-a'],
        durationDays: 5,
        optional: false,
      },
    ];

    expect(() => {
      topologicalSortTasks(cycleTemplates);
    }).toThrow(CycleError);
  });

  it('deadlines move earlier when the event date moves earlier', () => {
    const today = '2026-06-01';
    const stateLater: EventState = { ...baseState, eventDate: '2026-12-31' };
    const stateEarlier: EventState = { ...baseState, eventDate: '2026-10-31' };

    const resultLater = scheduleTasks(stateLater, today);
    const resultEarlier = scheduleTasks(stateEarlier, today);

    const venueLater = resultLater.tasks.find((t) => t.id === 'venue-book')!;
    const venueEarlier = resultEarlier.tasks.find((t) => t.id === 'venue-book')!;

    expect(venueEarlier.deadline < venueLater.deadline).toBe(true);
  });

  it('sets compressed = true when days available < critical path days', () => {
    const today = '2026-12-01';
    const tightState: EventState = { ...baseState, eventDate: '2026-12-10' };
    const result = scheduleTasks(tightState, today);

    expect(result.daysAvailable).toBe(9);
    expect(result.criticalPathDays).toBeGreaterThan(9);
    expect(result.compressed).toBe(true);
  });

  it('sets task status to blocked until dependencies complete, ready when dependencies are done, and overdue if deadline has passed', () => {
    const today = '2026-12-15';
    const state: EventState = {
      ...baseState,
      eventDate: '2026-12-20',
      completedTasks: [],
    };

    const result1 = scheduleTasks(state, today);

    const dateFix = result1.tasks.find((t) => t.id === 'date-fix')!;
    if (dateFix.deadline < today) {
      expect(dateFix.status).toBe('overdue');
    } else {
      expect(dateFix.status).toBe('ready');
    }

    const venueShortlist = result1.tasks.find((t) => t.id === 'venue-shortlist')!;
    expect(venueShortlist.status).toBe('blocked');

    const stateWithCompleted: EventState = {
      ...state,
      completedTasks: ['date-fix', 'budget-lock', 'guest-list-v1'],
    };

    const result2 = scheduleTasks(stateWithCompleted, '2026-06-01');
    const venueShortlist2 = result2.tasks.find((t) => t.id === 'venue-shortlist')!;
    expect(venueShortlist2.status).toBe('ready');

    const dateFix2 = result2.tasks.find((t) => t.id === 'date-fix')!;
    expect(dateFix2.status).toBe('done');
  });

  it('filters occasion-specific tasks appropriately', () => {
    const today = '2026-06-01';

    const birthdayState: EventState = { ...baseState, occasion: 'birthday' };
    const birthdayResult = scheduleTasks(birthdayState, today);
    const hasSangeetInBirthday = birthdayResult.tasks.some((t) => t.id === 'sangeet-choreography');
    expect(hasSangeetInBirthday).toBe(false);

    const weddingState: EventState = { ...baseState, occasion: 'wedding' };
    const weddingResult = scheduleTasks(weddingState, today);
    const hasSangeetInWedding = weddingResult.tasks.some((t) => t.id === 'sangeet-choreography');
    expect(hasSangeetInWedding).toBe(true);
  });
});
