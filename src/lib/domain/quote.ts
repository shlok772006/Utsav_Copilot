import { CoreCategory, EventState, NormalizedQuote, Plan, RawQuote, Warning } from './types';

/**
 * Pure domain quote normalizer:
 * Calculates total quote price, per-guest unit cost, delta against category budget line,
 * and detects missing unit info or over-budget quotes.
 */
export function normalizeQuote(
  raw: RawQuote,
  state: EventState,
  plan: Plan
): NormalizedQuote {
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
