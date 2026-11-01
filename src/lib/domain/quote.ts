import { CoreCategory, EventState, NormalizedQuote, Plan, RawQuote, Warning } from './types';

/**
 * Pure domain quote normalizer (Vendor Financial Comparator).
 *
 * Ingests a raw extracted vendor quote and normalizes it against the celebration plan:
 * 1. Computes Total Price: Handles fixed pricing, per-plate/per-guest multipliers, and applies unbundled tax rates.
 * 2. Computes Unit Costs: Derives normalized per-guest costs based on coverage headcount or event guest count.
 * 3. Budget Delta Analysis: Compares normalized quote total against the category's allocated budget line.
 * 4. Missing Field Detection: Flags missing unit rates or coverage counts as `"Not stated"`.
 * 5. Over-Budget Warnings: Triggers `OVER_BUDGET_QUOTE` warnings if the quote exceeds category budget limits.
 *
 * @param raw - The raw extracted vendor quote from LLM parsing or direct user entry.
 * @param state - The current EventState (supplying guestCount if quote omitted it).
 * @param plan - The active Plan (providing the target category budget line for delta calculation).
 * @returns A NormalizedQuote with calculated total, per-guest rate, delta vs budget line, and warning triggers.
 */
export function normalizeQuote(raw: RawQuote, state: EventState, plan: Plan): NormalizedQuote {
  const missingFields: string[] = [];
  const warnings: Warning[] = [];

  const vendorName = raw.vendorName?.trim() || 'Vendor (Not stated)';

  // 1. Determine total price
  let calculatedTotal: number | null = null;

  if (typeof raw.totalPrice === 'number' && raw.totalPrice > 0) {
    calculatedTotal = raw.totalPrice;
  } else if (typeof raw.unitPrice === 'number' && raw.unitPrice > 0) {
    if (raw.unitType === 'per_guest' || raw.unitType === 'per_plate') {
      const guestCount = raw.coverageCount || state.guestCount;
      if (typeof guestCount === 'number' && guestCount > 0) {
        calculatedTotal = raw.unitPrice * guestCount;
      } else {
        missingFields.push('coverageCount');
      }
    } else if (raw.unitType === 'fixed') {
      calculatedTotal = raw.unitPrice;
    } else {
      missingFields.push('unitType');
    }
  } else {
    missingFields.push('price');
  }

  // Adjust for tax if excluded
  if (calculatedTotal !== null) {
    if (raw.includesTax === false && typeof raw.taxRate === 'number' && raw.taxRate > 0) {
      calculatedTotal = Math.round(calculatedTotal * (1 + raw.taxRate));
    } else {
      calculatedTotal = Math.round(calculatedTotal);
    }
  }

  // 2. Determine per-guest amount
  let calculatedPerGuest: number | null = null;
  if (calculatedTotal !== null) {
    if (
      (raw.unitType === 'per_guest' || raw.unitType === 'per_plate') &&
      typeof raw.unitPrice === 'number'
    ) {
      calculatedPerGuest = Math.round(raw.unitPrice);
    } else if (typeof state.guestCount === 'number' && state.guestCount > 0) {
      calculatedPerGuest = Math.round(calculatedTotal / state.guestCount);
    }
  }

  // 3. Compare against category budget line
  const categoryLine = plan.budget.find((b) => b.category === raw.category);
  let vsBudgetLine: number | null = null;
  let isOverBudget = false;

  if (calculatedTotal !== null && categoryLine) {
    vsBudgetLine = calculatedTotal - categoryLine.amount;
    if (vsBudgetLine > 0) {
      isOverBudget = true;
      warnings.push({
        code: 'OVER_BUDGET_QUOTE',
        severity: 'warn',
        message: `${vendorName} quote (₹${calculatedTotal.toLocaleString('en-IN')}) exceeds the ₹${categoryLine.amount.toLocaleString('en-IN')} ${raw.category} budget allocation by ₹${vsBudgetLine.toLocaleString('en-IN')}.`,
        related: [raw.category],
      });
    }
  }

  return {
    category: raw.category as CoreCategory,
    vendorName,
    totalPrice: calculatedTotal,
    perGuest: calculatedPerGuest,
    vsBudgetLine,
    isOverBudget,
    missingFields,
    warnings,
  };
}
