import { TASK_TEMPLATES } from '../config/task-templates';
import { EventState, ScheduledTask, TaskStatus, TaskTemplate } from './types';

export class CycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CycleError';
  }
}

/**
 * Pure UTC-based calendar date helpers to ensure determinism across all environments.
 */
export function parseISODate(isoStr: string): Date {
  const [year, month, day] = isoStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatISODate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(isoStr: string, days: number): string {
  const d = parseISODate(isoStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatISODate(d);
}

export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseISODate(fromIso).getTime();
  const to = parseISODate(toIso).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((to - from) / msPerDay);
}

/**
 * Topological sort of task templates using Kahn's algorithm.
 * Throws CycleError if a circular dependency is detected.
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
 * Pure domain timeline scheduler:
 * 1. Filter templates by occasion.
 * 2. Kahn's topological sort (throws CycleError if cyclic).
 * 3. CPM Forward pass to calculate critical path length.
 * 4. CPM Backward pass from eventDate to calculate deadlines and latestStart dates.
 * 5. Determine task status (done, blocked, overdue, ready).
 * 6. Detect compressed timeline (daysAvailable < criticalPathDays).
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
