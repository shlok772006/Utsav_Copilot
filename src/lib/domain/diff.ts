import { daysBetween } from './timeline';
import {
  Category,
  CategoryDiff,
  Plan,
  PlanDiff,
  TaskDiff,
  TaskStatus,
  Warning,
} from './types';

/**
 * Pure domain function to calculate the diff between two plans:
 * - Budget category line amount and share changes.
 * - Tasks whose deadlines shifted (with days moved).
 * - Task status transitions.
 * - Warnings newly triggered (added) vs resolved.
 */
export function diffPlans(before: Plan, after: Plan): PlanDiff {
  // 1. Budget deltas
  const beforeLines = new Map<Category, { amount: number; share: number }>();
  before.budget.forEach((b) => beforeLines.set(b.category, { amount: b.amount, share: b.share }));

  const afterLines = new Map<Category, { amount: number; share: number }>();
  after.budget.forEach((b) => afterLines.set(b.category, { amount: b.amount, share: b.share }));

  const allCategories = new Set<Category>([
    ...Array.from(beforeLines.keys()),
    ...Array.from(afterLines.keys()),
  ]);

  const budgetDeltas: CategoryDiff[] = [];
  allCategories.forEach((cat) => {
    const prev = beforeLines.get(cat) || { amount: 0, share: 0 };
    const curr = afterLines.get(cat) || { amount: 0, share: 0 };

    const deltaAmount = curr.amount - prev.amount;
    const deltaShare = Number((curr.share - prev.share).toFixed(4));

    budgetDeltas.push({
      category: cat,
      previousAmount: prev.amount,
      currentAmount: curr.amount,
      deltaAmount,
      previousShare: prev.share,
      currentShare: curr.share,
      deltaShare,
    });
  });

  // 2. Shifted tasks & status changes
  const beforeTasks = new Map<string, { deadline: string; status: TaskStatus; title: string }>();
  before.tasks.forEach((t) => beforeTasks.set(t.id, { deadline: t.deadline, status: t.status, title: t.title }));

  const shiftedTasks: TaskDiff[] = [];
  const statusChanges: Array<{ taskId: string; from: TaskStatus; to: TaskStatus }> = [];

  after.tasks.forEach((currTask) => {
    const prev = beforeTasks.get(currTask.id);
    if (!prev) return;

    if (prev.deadline !== currTask.deadline) {
      const daysShifted = daysBetween(prev.deadline, currTask.deadline);
      shiftedTasks.push({
        taskId: currTask.id,
        title: currTask.title,
        previousDeadline: prev.deadline,
        currentDeadline: currTask.deadline,
        daysShifted,
      });
    }

    if (prev.status !== currTask.status) {
      statusChanges.push({
        taskId: currTask.id,
        from: prev.status,
        to: currTask.status,
      });
    }
  });

  // 3. Warnings added vs resolved
  const beforeWarningCodes = new Set(before.warnings.map((w) => w.code));
  const afterWarningCodes = new Set(after.warnings.map((w) => w.code));

  const addedWarnings: Warning[] = after.warnings.filter((w) => !beforeWarningCodes.has(w.code));
  const resolvedWarnings: Warning[] = before.warnings.filter((w) => !afterWarningCodes.has(w.code));

  return {
    budgetDeltas,
    shiftedTasks,
    statusChanges,
    addedWarnings,
    resolvedWarnings,
  };
}
