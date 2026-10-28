'use client';

import React, { useMemo, useState } from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { formatDateDisplay } from '@/lib/ui/format';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { ScheduledTask, TaskStatus } from '@/lib/domain/types';

const CATEGORY_ICONS: Record<string, string> = {
  venue: '🏛️',
  catering: '🍲',
  decor: '🌸',
  photography: '📸',
  attire: '👗',
  entertainment: '🎵',
  invitations_misc: '💌',
  logistics: '🚗',
};

type FilterStatus = 'all' | TaskStatus;

export const TimelineTab: React.FC = () => {
  const { state, plan, updateField } = useEventStore();
  const [filter, setFilter] = useState<FilterStatus>('all');

  const tasks = useMemo(() => plan?.tasks || [], [plan?.tasks]);
  const completedSet = useMemo(() => new Set(state.completedTasks || []), [state.completedTasks]);

  // Map task ID to title for human-readable dependency display
  const taskTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => map.set(t.id, t.title));
    return map;
  }, [tasks]);

  const handleToggleTask = (taskId: string) => {
    const isCompleted = completedSet.has(taskId);
    let nextCompleted: string[];
    if (isCompleted) {
      nextCompleted = (state.completedTasks || []).filter((id) => id !== taskId);
    } else {
      nextCompleted = [...(state.completedTasks || []), taskId];
    }
    updateField('completedTasks', nextCompleted);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      ready: tasks.filter((t) => t.status === 'ready').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => t.status === 'overdue').length,
    };
  }, [tasks]);

  if (!plan || tasks.length === 0) {
    return (
      <section
        aria-label="Timeline & Tasks"
        className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center shadow-xs"
      >
        <span className="text-4xl mb-3">🗓️</span>
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Timeline Not Initialized
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
          Provide your event date and occasion in the chat or load the sample event above to generate a dependency-ordered critical path schedule.
        </p>
      </section>
    );
  }

  const { daysAvailable, criticalPathDays, compressed } = plan;

  return (
    <section
      aria-label="Timeline & Tasks"
      className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Timeline & Task Critical Path
            </h2>
            <ProvenanceBadge provenance="heuristic" />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {daysAvailable >= 0 ? `${daysAvailable} days available` : 'Event in past'} · Critical path: {criticalPathDays} days · {tasks.length} total milestones
          </p>
        </div>

        {/* Schedule Metric Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
              compressed
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
            }`}
          >
            <span>{compressed ? '⚡' : '✅'}</span>
            <span>{compressed ? 'Compressed Timeline' : 'Comfortable Schedule'}</span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        {/* Compressed Schedule Warning Banner */}
        {compressed && (
          <div
            role="alert"
            className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs flex items-start gap-3 shadow-xs"
          >
            <span className="text-xl leading-none" aria-hidden="true">
              ⚠️
            </span>
            <div className="space-y-1">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                Compressed Timeline Warning
              </h3>
              <p className="text-rose-800 dark:text-rose-300/90 leading-relaxed">
                You have <strong>{daysAvailable} days</strong> until the event, but standard Indian celebration planning suggests a critical path of <strong>{criticalPathDays} days</strong>. Multiple preparation tasks must run concurrently. Prioritize vendor confirmations immediately.
              </p>
            </div>
          </div>
        )}

        {/* Filter Pills */}
        <div
          role="group"
          aria-label="Filter tasks by status"
          className="flex items-center gap-1.5 overflow-x-auto pb-1"
        >
          {(
            [
              { id: 'all', label: 'All Tasks', count: counts.all },
              { id: 'ready', label: 'Ready to Do', count: counts.ready },
              { id: 'blocked', label: 'Blocked', count: counts.blocked },
              { id: 'done', label: 'Completed', count: counts.done },
              { id: 'overdue', label: 'Overdue', count: counts.overdue },
            ] as const
          ).map((item) => {
            const isActive = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-800 text-amber-50 shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-amber-950 text-amber-200'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Task Cards List (Kahn Topological Order) */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
              No tasks found under the &quot;{filter}&quot; filter.
            </div>
          ) : (
            filteredTasks.map((t, index) => {
              const isCompleted = completedSet.has(t.id);
              const icon = CATEGORY_ICONS[t.category] || '📋';

              // Pending dependencies
              const pendingDeps = t.dependsOn
                .filter((depId) => !completedSet.has(depId))
                .map((depId) => taskTitleMap.get(depId) || depId);

              return (
                <div
                  key={t.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCompleted
                      ? 'bg-stone-50/50 dark:bg-stone-800/20 border-stone-200 dark:border-stone-800 opacity-60'
                      : t.status === 'ready'
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70 shadow-xs'
                      : t.status === 'overdue'
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                      : 'bg-stone-50/40 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Mark Done Checkbox */}
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        id={`task-check-${t.id}`}
                        checked={isCompleted}
                        onChange={() => handleToggleTask(t.id)}
                        className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                        aria-label={`Mark task ${t.title} as ${isCompleted ? 'incomplete' : 'completed'}`}
                      />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base" aria-hidden="true">
                            {icon}
                          </span>
                          <span className="text-[11px] font-mono text-stone-400">
                            #{index + 1}
                          </span>
                          <label
                            htmlFor={`task-check-${t.id}`}
                            className={`text-sm font-bold cursor-pointer transition-colors ${
                              isCompleted
                                ? 'line-through text-stone-500 dark:text-stone-400'
                                : 'text-stone-900 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400'
                            }`}
                          >
                            {t.title}
                          </label>
                          {t.optional && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                              Optional
                            </span>
                          )}
                        </div>

                        {/* Status Chip */}
                        <div className="flex items-center gap-2">
                          <StatusChip status={t.status} />
                          <ProvenanceBadge provenance={t.provenance} />
                        </div>
                      </div>

                      {/* Meta: Duration, Deadline & Dependencies */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                        <span>
                          ⏱️ Duration: <strong className="text-stone-700 dark:text-stone-300">{t.durationDays} {t.durationDays === 1 ? 'day' : 'days'}</strong>
                        </span>
                        <span>
                          📅 Deadline: <strong className="text-stone-700 dark:text-stone-300">{formatDateDisplay(t.deadline)}</strong>
                        </span>
                      </div>

                      {/* Blocked Dependencies Info */}
                      {!isCompleted && pendingDeps.length > 0 && (
                        <div className="mt-2 text-[11px] bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 px-2.5 py-1.5 rounded-md border border-amber-200 dark:border-amber-900/60 flex items-center gap-1.5">
                          <span aria-hidden="true">⏳</span>
                          <span>
                            Waiting on: <strong>{pendingDeps.join(', ')}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

const StatusChip: React.FC<{ status: ScheduledTask['status'] }> = ({ status }) => {
  switch (status) {
    case 'ready':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
          ● Ready to start
        </span>
      );
    case 'blocked':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
          ⏳ Blocked
        </span>
      );
    case 'done':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700">
          ✓ Completed
        </span>
      );
    case 'overdue':
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
          ⚠️ Overdue
        </span>
      );
    default:
      return null;
  }
};
