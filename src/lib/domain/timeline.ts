import { TASK_TEMPLATES } from '../config/task-templates';
import { EventState, ScheduledTask, TaskStatus, TaskTemplate } from './types';

export class CycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CycleError';
  }
}

/**
 * Parses an ISO date string (YYYY-MM-DD) into a deterministic UTC Date object.
 *
 * @param isoStr - Date string formatted strictly as 'YYYY-MM-DD'.
 * @returns A Date object instantiated at UTC midnight (00:00:00Z).
 */
export function parseISODate(isoStr: string): Date {
  const [year, month, day] = isoStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a UTC Date object into a standard ISO calendar string ('YYYY-MM-DD').
 *
 * @param d - The UTC Date to format.
 * @returns An ISO date string padded with leading zeros (e.g. '2026-11-05').
 */
export function formatISODate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministically adds or subtracts a signed number of calendar days to an ISO date.
 *
 * @param isoStr - Base date string formatted as 'YYYY-MM-DD'.
 * @param days - Number of days to add (positive) or subtract (negative).
 * @returns The resulting date as an ISO 'YYYY-MM-DD' string.
 */
export function addDays(isoStr: string, days: number): string {
  const d = parseISODate(isoStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatISODate(d);
}

/**
 * Computes the exact signed number of calendar days between two ISO dates.
 *
 * @param fromIso - Start date string ('YYYY-MM-DD').
 * @param toIso - End date string ('YYYY-MM-DD').
 * @returns The difference in whole calendar days (positive if toIso is after fromIso).
 */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseISODate(fromIso).getTime();
  const to = parseISODate(toIso).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to - from) / msPerDay);
}

/**
 * Topological sort of task templates using Kahn's algorithm (O(V + E) complexity).
 *
 * Computes an in-degree map for all templates, enqueuing nodes with zero incoming edges,
 * and decrementing neighbor in-degrees as tasks are processed. Throws a CycleError
 * if circular dependencies exist.
 *
 * @param templates - Array of TaskTemplates to order by prerequisite dependencies.
 * @returns Topologically sorted array where each task appears strictly after its dependencies.
 * @throws {CycleError} If a cyclic dependency loop is detected among active templates.
 */
export function topologicalSortTasks(templates: TaskTemplate[]): TaskTemplate[] {
  const templateMap = new Map<string, TaskTemplate>();
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  templates.forEach((t) => {
    templateMap.set(t.id, t);
    inDegree.set(t.id, 0);
    adj.set(t.id, []);
  });

  // Build graph (only considering dependencies present in the filtered template list)
  templates.forEach((t) => {
    t.dependsOn.forEach((depId) => {
      if (templateMap.has(depId)) {
        adj.get(depId)!.push(t.id);
        inDegree.set(t.id, (inDegree.get(t.id) || 0) + 1);
      }
    });
  });

  // Collect all nodes with 0 in-degree
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) {
      queue.push(id);
    }
  });

  const sorted: TaskTemplate[] = [];

  while (queue.length > 0) {
    const currId = queue.shift()!;
    sorted.push(templateMap.get(currId)!);

    const neighbors = adj.get(currId) || [];
    for (const neighbor of neighbors) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== templates.length) {
    const unvisited = templates.filter((t) => !sorted.some((s) => s.id === t.id)).map((t) => t.id);
    throw new CycleError(`Cyclic dependency detected among tasks: ${unvisited.join(', ')}`);
  }

  return sorted;
}

export interface TimelineResult {
  tasks: ScheduledTask[];
  daysAvailable: number;
  criticalPathDays: number;
  compressed: boolean;
}

/**
 * Pure domain timeline scheduler (Critical Path Method - CPM).
 *
 * Implements a dual-pass scheduling algorithm over the directed acyclic graph:
 * 1. Filter templates by active celebration occasion (wedding, anniversary, birthday, etc.).
 * 2. Kahn's topological sort (O(V+E)) with circular dependency detection.
 * 3. CPM Forward Pass: Calculates early start and earliest finish times, determining critical path days.
 * 4. CPM Backward Pass: Traverses backward from eventDate to compute exact deadlines and latest start dates.
 * 5. Status Resolution: Assigns `done`, `blocked`, `overdue`, or `ready` statuses dynamically.
 * 6. Compression Detection: Flags `compressed = true` if available days < critical path duration.
 *
 * @param state - The current EventState with occasion, eventDate, and completedTasks.
 * @param today - Current reference date as an ISO 'YYYY-MM-DD' string.
 * @param customTemplates - Optional custom TaskTemplate array (defaults to TASK_TEMPLATES).
 * @returns TimelineResult containing scheduled tasks, available countdown, critical path days, and compression flag.
 */
export function scheduleTasks(
  state: EventState,
  today: string,
  customTemplates?: TaskTemplate[]
): TimelineResult {
  const rawTemplates = customTemplates || TASK_TEMPLATES;
  const occasion = state.occasion;

  // Filter templates by occasion
  const activeTemplates = rawTemplates.filter((t) => {
    if (!t.occasions || t.occasions.length === 0) {
      return true;
    }
    return occasion ? t.occasions.includes(occasion) : true;
  });

  // Kahn's topological sort
  const sortedTemplates = topologicalSortTasks(activeTemplates);

  const eventDate = state.eventDate || today;
  const daysAvailable = daysBetween(today, eventDate);

  // Map dependencies for active templates
  const templateMap = new Map<string, TaskTemplate>();
  const activeDepsMap = new Map<string, string[]>();
  const dependentsMap = new Map<string, string[]>();

  sortedTemplates.forEach((t) => {
    templateMap.set(t.id, t);
    dependentsMap.set(t.id, []);
  });

  sortedTemplates.forEach((t) => {
    const validDeps = t.dependsOn.filter((d) => templateMap.has(d));
    activeDepsMap.set(t.id, validDeps);
    validDeps.forEach((d) => {
      dependentsMap.get(d)!.push(t.id);
    });
  });

  // Forward pass: Critical path calculation (earliest finish relative to start)
  const earliestFinish = new Map<string, number>();
  let criticalPathDays = 0;

  for (const t of sortedTemplates) {
    const deps = activeDepsMap.get(t.id) || [];
    let maxPrevFinish = 0;
    for (const d of deps) {
      maxPrevFinish = Math.max(maxPrevFinish, earliestFinish.get(d) || 0);
    }
    const finish = maxPrevFinish + t.durationDays;
    earliestFinish.set(t.id, finish);
    criticalPathDays = Math.max(criticalPathDays, finish);
  }

  // Backward pass: From eventDate
  // Reverse topological order
  const deadlines = new Map<string, string>();
  const latestStarts = new Map<string, string>();

  for (let i = sortedTemplates.length - 1; i >= 0; i--) {
    const t = sortedTemplates[i];
    const dependents = dependentsMap.get(t.id) || [];

    let deadlineIso: string;
    if (dependents.length === 0) {
      // Leaf task: deadline is the event date itself
      deadlineIso = eventDate;
    } else {
      // Must finish before the earliest latestStart of any dependent
      let earliestNextStart = latestStarts.get(dependents[0])!;
      for (let j = 1; j < dependents.length; j++) {
        const nextStart = latestStarts.get(dependents[j])!;
        if (nextStart < earliestNextStart) {
          earliestNextStart = nextStart;
        }
      }
      deadlineIso = earliestNextStart;
    }

    const latestStartIso = addDays(deadlineIso, -t.durationDays);
    deadlines.set(t.id, deadlineIso);
    latestStarts.set(t.id, latestStartIso);
  }

  // Determine statuses
  const completedSet = new Set<string>(state.completedTasks || []);

  const scheduledTasks: ScheduledTask[] = sortedTemplates.map((t) => {
    const deadline = deadlines.get(t.id)!;
    const latestStart = latestStarts.get(t.id)!;
    const validDeps = activeDepsMap.get(t.id) || [];

    let status: TaskStatus;
    if (completedSet.has(t.id)) {
      status = 'done';
    } else {
      const allDepsDone = validDeps.every((depId) => completedSet.has(depId));
      if (!allDepsDone) {
        status = 'blocked';
      } else if (deadline < today) {
        status = 'overdue';
      } else {
        status = 'ready';
      }
    }

    return {
      id: t.id,
      title: t.title,
      category: t.category,
      dependsOn: validDeps,
      durationDays: t.durationDays,
      deadline,
      latestStart,
      status,
      optional: t.optional ?? false,
      provenance: 'heuristic',
    };
  });

  const compressed = daysAvailable < criticalPathDays;

  return {
    tasks: scheduledTasks,
    daysAvailable,
    criticalPathDays,
    compressed,
  };
}
