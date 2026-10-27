'use client';

import React, { useState } from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { formatINR, formatNumber, formatDateDisplay } from '@/lib/ui/format';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { Occasion, PriorityLevel, CoreCategory } from '@/lib/domain/types';

const OCCASIONS: Array<{ value: Occasion; label: string }> = [
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'sangeet', label: 'Sangeet' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'reception', label: 'Reception' },
  { value: 'general', label: 'Celebration' },
];

export const EventCard: React.FC = () => {
  const { state, plan, updateField } = useEventStore();
  const [isEditing, setIsEditing] = useState(false);

  // Form local state for editing
  const [editOccasion, setEditOccasion] = useState<Occasion>(state.occasion || 'anniversary');
  const [editBudget, setEditBudget] = useState(state.totalBudget ? String(state.totalBudget) : '');
  const [editGuests, setEditGuests] = useState(state.guestCount ? String(state.guestCount) : '');
  const [editDate, setEditDate] = useState(state.eventDate || '');
  const [editCity, setEditCity] = useState(state.city || '');

  const startEdit = () => {
    setEditOccasion(state.occasion || 'anniversary');
    setEditBudget(state.totalBudget ? String(state.totalBudget) : '');
    setEditGuests(state.guestCount ? String(state.guestCount) : '');
    setEditDate(state.eventDate || '');
    setEditCity(state.city || '');
    setIsEditing(true);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editOccasion) updateField('occasion', editOccasion);
    const parsedBudget = parseInt(editBudget, 10);
    if (!isNaN(parsedBudget) && parsedBudget > 0) {
      updateField('totalBudget', parsedBudget);
    }
    const parsedGuests = parseInt(editGuests, 10);
    if (!isNaN(parsedGuests) && parsedGuests > 0) {
      updateField('guestCount', parsedGuests);
    }
    if (editDate) updateField('eventDate', editDate);
    if (editCity) updateField('city', editCity);

    setIsEditing(false);
  };

  // Readiness checklist
  const hasOccasion = Boolean(state.occasion);
  const hasBudget = Boolean(state.totalBudget && state.totalBudget > 0);
  const hasGuests = Boolean(state.guestCount && state.guestCount > 0);
  const hasDate = Boolean(state.eventDate);
  const isReady = hasOccasion && hasBudget && hasGuests && hasDate;

  return (
    <aside
      aria-label="Event State Card"
      className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>Event Snapshot</span>
            {isReady ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                ✓ Plan Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                ◌ In Progress
              </span>
            )}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Live parameters driving your budget & schedule
          </p>
        </div>

        <button
          type="button"
          onClick={() => (isEditing ? setIsEditing(false) : startEdit())}
          className="px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors cursor-pointer border border-amber-300 dark:border-amber-800"
        >
          {isEditing ? 'Cancel' : '✎ Edit'}
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* Inline Edit Form */}
        {isEditing ? (
          <form onSubmit={saveEdit} className="space-y-4 bg-stone-50 dark:bg-stone-800/40 p-4 rounded-xl border border-stone-200 dark:border-stone-700/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Direct Field Override
            </h3>

            <div>
              <label htmlFor="edit-occasion" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                Occasion
              </label>
              <select
                id="edit-occasion"
                value={editOccasion}
                onChange={(e) => setEditOccasion(e.target.value as Occasion)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ.value} value={occ.value}>
                    {occ.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-budget" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Budget (₹ INR)
                </label>
                <input
                  id="edit-budget"
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  placeholder="e.g. 300000"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label htmlFor="edit-guests" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Guests Count
                </label>
                <input
                  id="edit-guests"
                  type="number"
                  value={editGuests}
                  onChange={(e) => setEditGuests(e.target.value)}
                  placeholder="e.g. 60"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-date" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Event Date
                </label>
                <input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>

              <div>
                <label htmlFor="edit-city" className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  City
                </label>
                <input
                  id="edit-city"
                  type="text"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Save Overrides
            </button>
          </form>
        ) : null}

        {/* Primary Parameters Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Occasion */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Occasion</span>
              <ProvenanceBadge provenance="user" />
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100 capitalize">
              {state.occasion || <span className="text-stone-400 font-normal">Not stated</span>}
            </p>
          </div>

          {/* Total Budget */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Total Budget</span>
              <ProvenanceBadge provenance="user" />
            </div>
            <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
              {state.totalBudget ? formatINR(state.totalBudget) : <span className="text-stone-400 font-normal">Not stated</span>}
            </p>
          </div>

          {/* Guests */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Guest Count</span>
              <ProvenanceBadge provenance="user" />
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {state.guestCount ? `${formatNumber(state.guestCount)} guests` : <span className="text-stone-400 font-normal">Not stated</span>}
            </p>
          </div>

          {/* Event Date */}
          <div className="p-3.5 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/80 dark:border-stone-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">Target Date</span>
              <ProvenanceBadge provenance="user" />
            </div>
            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {formatDateDisplay(state.eventDate)}
            </p>
          </div>
        </div>

        {/* City & Venue */}
        {state.city && (
          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">City / Destination</span>
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">{state.city}</span>
          </div>
        )}

        {/* Required Fields Completion Checklist */}
        <div className="p-4 bg-amber-50/40 dark:bg-stone-800/20 rounded-xl border border-amber-200/60 dark:border-stone-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-2.5">
            Plan Initialization Checklist
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className={hasOccasion ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                {hasOccasion ? '✓' : '○'}
              </span>
              <span className={hasOccasion ? 'text-stone-800 dark:text-stone-200 font-medium' : 'text-stone-500'}>
                Celebration Occasion
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasBudget ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                {hasBudget ? '✓' : '○'}
              </span>
              <span className={hasBudget ? 'text-stone-800 dark:text-stone-200 font-medium' : 'text-stone-500'}>
                Target Total Budget (INR)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasGuests ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                {hasGuests ? '✓' : '○'}
              </span>
              <span className={hasGuests ? 'text-stone-800 dark:text-stone-200 font-medium' : 'text-stone-500'}>
                Approximate Guest Headcount
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasDate ? 'text-emerald-600 font-bold' : 'text-stone-400'}>
                {hasDate ? '✓' : '○'}
              </span>
              <span className={hasDate ? 'text-stone-800 dark:text-stone-200 font-medium' : 'text-stone-500'}>
                Event Date & Countdown
              </span>
            </div>
          </div>
        </div>

        {/* Priority Sliders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Priority Weights (1 - 5)
            </h3>
            <ProvenanceBadge provenance="heuristic" />
          </div>

          <div className="space-y-2">
            {(['catering', 'venue', 'decor', 'photography'] as CoreCategory[]).map((cat) => {
              const currentPrio = state.priorities[cat] || 3;
              return (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <span className="capitalize font-medium text-stone-700 dark:text-stone-300 w-24">
                    {cat}
                  </span>
                  <div className="flex items-center gap-1">
                    {([1, 2, 3, 4, 5] as PriorityLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          const nextPrios = { ...state.priorities, [cat]: lvl };
                          updateField('priorities', nextPrios);
                        }}
                        className={`w-6 h-6 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                          currentPrio === lvl
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Constraints List */}
        {((state.constraints.dietary?.length || 0) > 0 ||
          (state.constraints.accessibility?.length || 0) > 0) && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Active Constraints
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {state.constraints.dietary.map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md font-medium"
                >
                  🥗 {d}
                </span>
              ))}
              {state.constraints.accessibility.map((a) => (
                <span
                  key={a}
                  className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-md font-medium"
                >
                  ♿ {a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live Plan Overview if ready */}
        {plan && (
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400">Timeline Scope</span>
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                {plan.daysAvailable} days available / {plan.criticalPathDays} days critical path
              </span>
            </div>
            {plan.compressed && (
              <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-medium border border-amber-300 dark:border-amber-800">
                ⚡ Compressed timeline — tasks require accelerated bookings
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
