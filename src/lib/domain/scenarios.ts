import { CoreCategory, EventState, Op, Plan, Scenario } from './types';

/**
 * Pure domain scenario generator:
 * Produces 2-3 deterministic actionable scenarios using the 5 canonical levers:
 * 1. Trim guest count (15% reduction)
 * 2. Rebalance budget toward priorities
 * 3. Simplify low-priority categories
 * 4. Extend timeline (when compressed)
 * 5. Drop / fast-track optional tasks
 *
 * Ranks scenarios to best address active plan warnings.
 */
export function generateScenarios(state: EventState, plan: Plan): Scenario[] {
  const scenarios: Scenario[] = [];
  const activeWarningCodes = new Set(plan.warnings.map((w) => w.code));

  // --- Lever 1: Trim Guests ---
  if (state.guestCount && state.guestCount > 25) {
    const factor = 0.85;
    const trimmedCount = Math.round(state.guestCount * factor);
    const guestOps: Op[] = [{ op: 'scale_guest_count', factor }];

    const cateringLine = plan.budget.find((b) => b.category === 'catering');
    const currPerHead = cateringLine?.perGuest || 0;
    const estNewPerHead = currPerHead > 0 ? Math.round(currPerHead / factor) : 0;

    scenarios.push({
      id: 'trim-guests',
      headline: `Trim Guest List to ~${trimmedCount} Guests (-15%)`,
      why: activeWarningCodes.has('LOW_PER_GUEST_CATERING')
        ? `Elevates catering from ₹${currPerHead} to ~₹${estNewPerHead}/head without increasing the total budget.`
        : `Reduces crowd pressure on venue capacity and improves per-guest hospitality.`,
      ops: guestOps,
      tradeoff: 'Requires tightening the extended family and acquaintance invite list.',
    });
  }

  // --- Lever 2: Rebalance toward priorities ---
  const unlocked = (['venue', 'catering', 'decor', 'photography', 'attire', 'entertainment', 'invitations_misc', 'logistics'] as CoreCategory[])
    .filter((c) => !(state.lockedCategories || []).includes(c));

  if (unlocked.includes('catering') && activeWarningCodes.has('LOW_PER_GUEST_CATERING')) {
    const rebalanceOps: Op[] = [
      { op: 'set_priority', category: 'catering', level: 5 },
    ];
    if (unlocked.includes('invitations_misc')) {
      rebalanceOps.push({ op: 'set_priority', category: 'invitations_misc', level: 1 });
    }
    if (unlocked.includes('attire')) {
      rebalanceOps.push({ op: 'set_priority', category: 'attire', level: 2 });
    }

    scenarios.push({
      id: 'boost-catering-priority',
      headline: 'Maximize Catering Priority to Level 5',
      why: 'Shifts more budget share into catering from secondary categories to resolve food budget constraints.',
      ops: rebalanceOps,
      tradeoff: 'Slightly reduces budget headroom for attire and invitations/misc.',
    });
  }

  // --- Lever 3: Simplify Low-Priority Category ---
  const lowPrioCandidate = unlocked.find((c) => {
    const p = state.priorities?.[c] ?? 3;
    return p > 1 && (c === 'invitations_misc' || c === 'entertainment' || c === 'decor');
  });

  if (lowPrioCandidate) {
    scenarios.push({
      id: `simplify-${lowPrioCandidate}`,
      headline: `Economize on ${lowPrioCandidate.replace('_', ' ')} (Priority 1)`,
      why: `Frees up budget by selecting minimal, streamlined options for ${lowPrioCandidate}.`,
      ops: [{ op: 'set_priority', category: lowPrioCandidate, level: 1 }],
      tradeoff: `Requires opting for digital invitations or simplified standard setups.`,
    });
  }

  // --- Lever 4: Move Date Later (Only when compressed) ---
  if (plan.compressed) {
    const daysNeeded = Math.max(14, plan.criticalPathDays - plan.daysAvailable + 7);
    scenarios.push({
      id: 'extend-timeline',
      headline: `Shift Event Date by +${daysNeeded} Days`,
      why: `Provides sufficient time (${plan.criticalPathDays} days required) to clear vendor shortlists and fittings without emergency rush fees.`,
      ops: [{ op: 'shift_date_days', days: daysNeeded }],
      tradeoff: 'Requires coordinating new dates with primary family members.',
    });
  }

  // --- Lever 5: Drop Optional Tasks ---
  const uncompletedOptional = plan.tasks.filter((t) => t.optional && t.status !== 'done');
  if (uncompletedOptional.length > 0) {
    const dropOps: Op[] = uncompletedOptional.map((t) => ({
      op: 'complete_task',
      taskId: t.id,
    }));

    scenarios.push({
      id: 'fast-track-optional',
      headline: `Streamline ${uncompletedOptional.length} Optional Milestones`,
      why: `Removes non-critical coordination dependencies to keep the core event schedule moving fast.`,
      ops: dropOps,
      tradeoff: `Omits planned formal coordination for: ${uncompletedOptional.map((t) => t.title).join(', ')}.`,
    });
  }

  // --- Ranking ---
  // Rank scenarios that resolve active warnings first
  const scored = scenarios.map((scenario) => {
    let score = 0;
    if (activeWarningCodes.has('COMPRESSED_SCHEDULE')) {
      if (scenario.id === 'extend-timeline') score += 10;
      if (scenario.id === 'fast-track-optional') score += 8;
    }
    if (activeWarningCodes.has('LOW_PER_GUEST_CATERING')) {
      if (scenario.id === 'trim-guests') score += 10;
      if (scenario.id === 'boost-catering-priority') score += 9;
    }
    return { scenario, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return the top 2-3 scenarios
  return scored.slice(0, 3).map((s) => s.scenario);
}
