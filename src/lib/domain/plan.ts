import {
  HIGH_VENUE_SHARE_THRESHOLD,
  LOW_CATERING_PER_GUEST_THRESHOLD,
} from '../config/limits';
import { allocateBudget } from './budget';
import { scheduleTasks } from './timeline';
import { EventState, Plan, Warning } from './types';

/**
 * Pure domain plan builder:
 * Combines budget allocation, timeline scheduling, and domain warning rules.
 * Handles missing required fields gracefully with partial plans and MISSING_REQUIRED warnings.
 * Never throws exceptions on incomplete state.
 */
export function buildPlan(state: EventState, today: string): Plan {
  const warnings: Warning[] = [];

  // Check for missing required fields
  const missingFields: string[] = [];
  if (!state.occasion) missingFields.push('occasion');
  if (!state.totalBudget || state.totalBudget <= 0) missingFields.push('totalBudget');
  if (!state.guestCount || state.guestCount <= 0) missingFields.push('guestCount');
  if (!state.eventDate) missingFields.push('eventDate');

  if (missingFields.length > 0) {
    warnings.push({
      code: 'MISSING_REQUIRED',
      severity: 'critical',
      message: `Plan is incomplete. Missing required fields: ${missingFields.join(', ')}.`,
      related: missingFields,
    });
  }

  // 1. Compute budget lines
  const budget = allocateBudget(state);

  // 2. Compute scheduled tasks and timeline
  const timelineResult = scheduleTasks(state, today);
  const { tasks, daysAvailable, criticalPathDays, compressed } = timelineResult;

  // 3. Domain Warning: LOW_PER_GUEST_CATERING
  const cateringLine = budget.find((b) => b.category === 'catering');
  if (
    cateringLine &&
    typeof cateringLine.perGuest === 'number' &&
    cateringLine.perGuest > 0 &&
    cateringLine.perGuest < LOW_CATERING_PER_GUEST_THRESHOLD
  ) {
    warnings.push({
      code: 'LOW_PER_GUEST_CATERING',
      severity: 'warn',
      message: `Catering allocation is ₹${cateringLine.perGuest}/guest, below the recommended ₹${LOW_CATERING_PER_GUEST_THRESHOLD}/guest threshold for quality food and hospitality.`,
      related: ['catering'],
    });
  }

  // 4. Domain Warning: HIGH_PER_HEAD_VENUE
  const venueLine = budget.find((b) => b.category === 'venue');
  if (venueLine && venueLine.share > HIGH_VENUE_SHARE_THRESHOLD) {
    const venuePercent = Math.round(venueLine.share * 100);
    warnings.push({
      code: 'HIGH_PER_HEAD_VENUE',
      severity: 'warn',
      message: `Venue takes up ${venuePercent}% of the total budget (threshold is ${Math.round(HIGH_VENUE_SHARE_THRESHOLD * 100)}%). This may squeeze catering and decor.`,
      related: ['venue'],
    });
  }

  // 5. Domain Warning: COMPRESSED_SCHEDULE
  if (compressed) {
    const criticalChain = tasks.filter((t) => t.status !== 'done').slice(0, 3).map((t) => t.title);
    warnings.push({
      code: 'COMPRESSED_SCHEDULE',
      severity: 'warn',
      message: `Available timeline (${daysAvailable} days) is shorter than the critical path (${criticalPathDays} days). Consider parallel bookings or shifting the event date.`,
      related: criticalChain,
    });
  }

  // 6. Domain Warning: OVERDUE_TASK
  const overdueTasks = tasks.filter((t) => t.status === 'overdue');
  if (overdueTasks.length > 0) {
    warnings.push({
      code: 'OVERDUE_TASK',
      severity: 'warn',
      message: `${overdueTasks.length} task(s) are overdue based on the required event countdown.`,
      related: overdueTasks.map((t) => t.id),
    });
  }

  return {
    state,
    budget,
    tasks,
    warnings,
    daysAvailable,
    criticalPathDays,
    compressed,
  };
}
