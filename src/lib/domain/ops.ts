import { BUDGET_LIMITS, GUEST_LIMITS } from '../config/limits';
import { TASK_TEMPLATES } from '../config/task-templates';
import { addDays } from './timeline';
import { CoreCategorySchema, EventState, Op, RejectedOp } from './types';

const VALID_CORE_CATEGORIES = new Set(CoreCategorySchema.options);
const KNOWN_TASK_IDS = new Set(TASK_TEMPLATES.map((t) => t.id));

/**
 * Pure domain operations engine:
 * Applies a list of Op updates to an EventState with strict bounds checking.
 * Rejects invalid or out-of-bounds ops with explanatory reasons, while applying all valid ops.
 */
export function applyOps(
  state: EventState,
  ops: Op[],
  referenceDate?: string
): { state: EventState; rejected: RejectedOp[] } {
  // Deep copy state to ensure pure immutability
  const currentState: EventState = {
    ...state,
    priorities: { ...(state.priorities || {}) },
    lockedCategories: [...(state.lockedCategories || [])],
    lockedBudgetLines: { ...(state.lockedBudgetLines || {}) },
    constraints: {
      dietary: [...(state.constraints?.dietary || [])],
      accessibility: [...(state.constraints?.accessibility || [])],
      cultural: [...(state.constraints?.cultural || [])],
      other: [...(state.constraints?.other || [])],
    },
    completedTasks: [...(state.completedTasks || [])],
  };

  const rejected: RejectedOp[] = [];

  for (const op of ops) {
    switch (op.op) {
      case 'set_budget': {
        if (typeof op.value !== 'number' || isNaN(op.value)) {
          rejected.push({ op, reason: 'Budget value must be a valid number.' });
          break;
        }
        const val = Math.round(op.value);
        if (val < BUDGET_LIMITS.min || val > BUDGET_LIMITS.max) {
          rejected.push({
            op,
            reason: `Budget ₹${val} is out of permitted bounds (₹${BUDGET_LIMITS.min.toLocaleString('en-IN')} - ₹${BUDGET_LIMITS.max.toLocaleString('en-IN')}).`,
          });
          break;
        }
        currentState.totalBudget = val;
        break;
      }

      case 'scale_budget': {
        if (typeof op.factor !== 'number' || isNaN(op.factor) || op.factor <= 0 || op.factor > 10) {
          rejected.push({ op, reason: 'Budget scaling factor must be a positive number between 0 and 10.' });
          break;
        }
        const baseBudget = currentState.totalBudget || 0;
        if (baseBudget <= 0) {
          rejected.push({ op, reason: 'Cannot scale budget when total budget is unset or zero.' });
          break;
        }
        const scaledVal = Math.round(baseBudget * op.factor);
        if (scaledVal < BUDGET_LIMITS.min || scaledVal > BUDGET_LIMITS.max) {
          rejected.push({
            op,
            reason: `Scaled budget ₹${scaledVal} exceeds permitted bounds.`,
          });
          break;
        }
        currentState.totalBudget = scaledVal;
        break;
      }

      case 'set_guest_count': {
        if (typeof op.value !== 'number' || isNaN(op.value)) {
          rejected.push({ op, reason: 'Guest count must be a valid number.' });
          break;
        }
        const val = Math.round(op.value);
        if (val < GUEST_LIMITS.min || val > GUEST_LIMITS.max) {
          rejected.push({
            op,
            reason: `Guest count ${val} is outside allowed limits (${GUEST_LIMITS.min} - ${GUEST_LIMITS.max}).`,
          });
          break;
        }
        currentState.guestCount = val;
        break;
      }

      case 'scale_guest_count': {
        if (typeof op.factor !== 'number' || isNaN(op.factor) || op.factor <= 0 || op.factor > 10) {
          rejected.push({ op, reason: 'Guest count scale factor must be between 0 and 10.' });
          break;
        }
        const currentGuests = currentState.guestCount || 0;
        if (currentGuests <= 0) {
          rejected.push({ op, reason: 'Cannot scale guest count when it is unset or zero.' });
          break;
        }
        const scaledGuests = Math.round(currentGuests * op.factor);
        if (scaledGuests < GUEST_LIMITS.min || scaledGuests > GUEST_LIMITS.max) {
          rejected.push({
            op,
            reason: `Scaled guest count ${scaledGuests} exceeds allowed bounds (${GUEST_LIMITS.min} - ${GUEST_LIMITS.max}).`,
          });
          break;
        }
        currentState.guestCount = scaledGuests;
        break;
      }

      case 'set_date': {
        if (typeof op.value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(op.value)) {
          rejected.push({ op, reason: 'Date must be formatted as YYYY-MM-DD.' });
          break;
        }
        if (referenceDate && op.value < referenceDate) {
          rejected.push({ op, reason: `Event date ${op.value} cannot be set in the past relative to ${referenceDate}.` });
          break;
        }
        currentState.eventDate = op.value;
        break;
      }

      case 'shift_date_days': {
        if (typeof op.days !== 'number' || !Number.isInteger(op.days)) {
          rejected.push({ op, reason: 'Days to shift must be an integer.' });
          break;
        }
        if (!currentState.eventDate) {
          rejected.push({ op, reason: 'Cannot shift date when eventDate is not yet set.' });
          break;
        }
        const newDate = addDays(currentState.eventDate, op.days);
        if (referenceDate && newDate < referenceDate) {
          rejected.push({ op, reason: `Shifted date ${newDate} cannot be in the past relative to ${referenceDate}.` });
          break;
        }
        currentState.eventDate = newDate;
        break;
      }

      case 'set_priority': {
        if (!VALID_CORE_CATEGORIES.has(op.category)) {
          rejected.push({ op, reason: `Unknown category "${op.category}".` });
          break;
        }
        if (![1, 2, 3, 4, 5].includes(op.level)) {
          rejected.push({ op, reason: `Priority level must be 1, 2, 3, 4, or 5.` });
          break;
        }
        currentState.priorities = {
          ...currentState.priorities,
          [op.category]: op.level,
        };
        break;
      }

      case 'lock_category': {
        if (!VALID_CORE_CATEGORIES.has(op.category)) {
          rejected.push({ op, reason: `Unknown category "${op.category}".` });
          break;
        }
        if (!currentState.lockedCategories.includes(op.category)) {
          currentState.lockedCategories = [...currentState.lockedCategories, op.category];
        }
        break;
      }

      case 'unlock_category': {
        if (!VALID_CORE_CATEGORIES.has(op.category)) {
          rejected.push({ op, reason: `Unknown category "${op.category}".` });
          break;
        }
        currentState.lockedCategories = currentState.lockedCategories.filter((c) => c !== op.category);
        const nextLockedLines = { ...currentState.lockedBudgetLines };
        delete nextLockedLines[op.category];
        currentState.lockedBudgetLines = nextLockedLines;
        break;
      }

      case 'add_constraint': {
        const validKinds = ['dietary', 'accessibility', 'cultural', 'other'] as const;
        if (!validKinds.includes(op.kind)) {
          rejected.push({ op, reason: `Invalid constraint kind "${op.kind}".` });
          break;
        }
        const trimmed = op.value?.trim();
        if (!trimmed) {
          rejected.push({ op, reason: 'Constraint value cannot be empty.' });
          break;
        }
        const existing = currentState.constraints[op.kind] || [];
        if (!existing.includes(trimmed)) {
          currentState.constraints = {
            ...currentState.constraints,
            [op.kind]: [...existing, trimmed],
          };
        }
        break;
      }

      case 'remove_constraint': {
        const validKinds = ['dietary', 'accessibility', 'cultural', 'other'] as const;
        if (!validKinds.includes(op.kind)) {
          rejected.push({ op, reason: `Invalid constraint kind "${op.kind}".` });
          break;
        }
        const existing = currentState.constraints[op.kind] || [];
        currentState.constraints = {
          ...currentState.constraints,
          [op.kind]: existing.filter((item) => item !== op.value),
        };
        break;
      }

      case 'complete_task': {
        if (!op.taskId || !KNOWN_TASK_IDS.has(op.taskId)) {
          rejected.push({ op, reason: `Unknown taskId "${op.taskId}".` });
          break;
        }
        if (!currentState.completedTasks.includes(op.taskId)) {
          currentState.completedTasks = [...currentState.completedTasks, op.taskId];
        }
        break;
      }

      default: {
        rejected.push({ op, reason: 'Unrecognized operation.' });
        break;
      }
    }
  }

  return { state: currentState, rejected };
}
