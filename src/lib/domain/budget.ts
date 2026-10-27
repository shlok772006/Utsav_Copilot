import {
  CONTINGENCY_PERCENT,
  GUEST_DRIVEN_CATEGORIES,
  PRIORITY_MULTIPLIERS,
} from '../config/limits';
import { getBaseShares } from '../config/budget-shares';
import {
  BudgetLine,
  Category,
  CoreCategory,
  CoreCategorySchema,
  EventState,
} from './types';

const CORE_CATEGORIES: CoreCategory[] = CoreCategorySchema.options;

/**
 * Largest-remainder (Hare-Niemeyer) rounding.
 * Distributes a target total among decimal allocations so that all amounts
 * are integers and their sum equals targetTotal exactly.
 */
function largestRemainderRound(
  items: Array<{ key: string; raw: number }>,
  targetTotal: number
): Map<string, number> {
  const result = new Map<string, number>();
  if (items.length === 0 || targetTotal <= 0) {
    items.forEach((item) => result.set(item.key, 0));
    return result;
  }

  let allocated = 0;
  const withFloors = items.map((item) => {
    const floor = Math.max(0, Math.floor(item.raw));
    const remainder = item.raw - floor;
    allocated += floor;
    return { key: item.key, floor, remainder };
  });

  let deficit = targetTotal - allocated;

  // Sort descending by remainder. Break ties by key for determinism.
  withFloors.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder - a.remainder;
    }
    return a.key.localeCompare(b.key);
  });

  for (let i = 0; i < withFloors.length; i++) {
    const item = withFloors[i];
    let extra = 0;
    if (deficit > 0) {
      extra = 1;
      deficit--;
    }
    result.set(item.key, item.floor + extra);
  }

  // If there is still remaining deficit (e.g. all floors were zero), add to first item
  if (deficit > 0 && withFloors.length > 0) {
    const firstKey = withFloors[0].key;
    result.set(firstKey, (result.get(firstKey) || 0) + deficit);
  }

  return result;
}

/**
 * Pure domain function to allocate event budget lines based on:
 * - Base occasion shares
 * - Fixed 8% contingency buffer
 * - User category priority multipliers (1 to 5)
 * - Locked category amounts
 * - Largest-remainder integer rounding so sum === totalBudget exactly.
 */
export function allocateBudget(state: EventState): BudgetLine[] {
  const totalBudget = state.totalBudget ? Math.round(state.totalBudget) : 0;
  const guests = state.guestCount && state.guestCount > 0 ? state.guestCount : undefined;

  if (totalBudget <= 0) {
    return [];
  }

  const baseShares = getBaseShares(state.occasion);
  const priorities = state.priorities || {};
  const lockedCategories = new Set<CoreCategory>(state.lockedCategories || []);
  const lockedLines = state.lockedBudgetLines || {};

  // 1. Calculate contingency (8% of total budget)
  const contingencyShare = CONTINGENCY_PERCENT;
  const rawContingency = totalBudget * contingencyShare;

  // 2. Identify locked categories and sum their locked amounts
  let sumLocked = 0;
  const lockedAmounts = new Map<CoreCategory, number>();
  lockedCategories.forEach((cat) => {
    if (CORE_CATEGORIES.includes(cat) && typeof lockedLines[cat] === 'number') {
      const lockedVal = Math.min(totalBudget, Math.max(0, Math.round(lockedLines[cat]!)));
      lockedAmounts.set(cat, lockedVal);
      sumLocked += lockedVal;
    }
  });

  // 3. Unlocked categories
  const unlockedCategories = CORE_CATEGORIES.filter((cat) => !lockedAmounts.has(cat));

  // Remaining budget to distribute among unlocked categories and contingency
  // If sumLocked exceeds budget, clamp locked amounts proportionally
  if (sumLocked > totalBudget) {
    const scale = totalBudget / sumLocked;
    sumLocked = 0;
    lockedAmounts.forEach((val, cat) => {
      const scaled = Math.floor(val * scale);
      lockedAmounts.set(cat, scaled);
      sumLocked += scaled;
    });
  }

  const distributableAfterLocked = Math.max(0, totalBudget - sumLocked);

  // Distribute between contingency and unlocked categories
  // Contingency target
  const targetContingencyRaw = Math.min(distributableAfterLocked, rawContingency);
  const unlockedPool = Math.max(0, distributableAfterLocked - targetContingencyRaw);

  // Compute weighted shares for unlocked categories
  let totalUnlockedWeight = 0;
  const weightedShares: Array<{ cat: CoreCategory; weight: number }> = [];

  unlockedCategories.forEach((cat) => {
    const baseShare = baseShares[cat] || 0.125;
    const prioLevel = priorities[cat] ?? 3;
    const multiplier = PRIORITY_MULTIPLIERS[prioLevel] ?? 1.0;
    const weight = baseShare * multiplier;
    weightedShares.push({ cat, weight });
    totalUnlockedWeight += weight;
  });

  // Prepare items for largest-remainder rounding
  const roundItems: Array<{ key: string; raw: number }> = [];

  // Add contingency item
  roundItems.push({ key: 'contingency', raw: targetContingencyRaw });

  // Add unlocked categories
  weightedShares.forEach(({ cat, weight }) => {
    const normalizedShare = totalUnlockedWeight > 0 ? weight / totalUnlockedWeight : 1 / unlockedCategories.length;
    const rawVal = unlockedPool * normalizedShare;
    roundItems.push({ key: cat, raw: rawVal });
  });

  const roundedDistributable = largestRemainderRound(roundItems, distributableAfterLocked);

  // Build final budget lines
  const lines: BudgetLine[] = [];

  CORE_CATEGORIES.forEach((cat) => {
    let amount = 0;
    if (lockedAmounts.has(cat)) {
      amount = lockedAmounts.get(cat)!;
    } else {
      amount = roundedDistributable.get(cat) || 0;
    }

    const share = totalBudget > 0 ? Number((amount / totalBudget).toFixed(4)) : 0;
    const isGuestDriven = GUEST_DRIVEN_CATEGORIES.includes(cat as (typeof GUEST_DRIVEN_CATEGORIES)[number]);
    const perGuest = isGuestDriven && guests ? Math.round(amount / guests) : undefined;

    lines.push({
      category: cat as Category,
      share,
      amount,
      perGuest,
      provenance: 'derived',
    });
  });

  // Append contingency
  const contingencyAmount = roundedDistributable.get('contingency') || 0;
  lines.push({
    category: 'contingency',
    share: totalBudget > 0 ? Number((contingencyAmount / totalBudget).toFixed(4)) : 0,
    amount: contingencyAmount,
    provenance: 'derived',
  });

  return lines;
}
