'use client';

import React, { useState } from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { formatINR } from '@/lib/ui/format';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { CoreCategory, PriorityLevel } from '@/lib/domain/types';
import { GUEST_DRIVEN_CATEGORIES } from '@/lib/config/limits';

const CATEGORY_ICONS: Record<string, string> = {
  venue: '🏛️',
  catering: '🍲',
  decor: '🌸',
  photography: '📸',
  attire: '👗',
  entertainment: '🎵',
  invitations_misc: '💌',
  logistics: '🚗',
  contingency: '🛡️',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  venue: 'Hall rental, lawn, permissions & electricity',
  catering: 'Food, live counters, service staff & cutlery',
  decor: 'Stage, mandap, floral work & ambient lighting',
  photography: 'Traditional + candid photos & cinematic video',
  attire: 'Festive outfits, bridal/groom wear & trials',
  entertainment: 'DJ, sound, live performers & choreography',
  invitations_misc: 'Printed cards, digital invites & shagun boxes',
  logistics: 'Outstation guest transport, stays & transfers',
  contingency: 'Buffer for unforeseen last-minute additions (fixed 8%)',
};

export const BudgetTab: React.FC = () => {
  const { state, plan, updateField } = useEventStore();
  const [viewMode, setViewMode] = useState<'bars' | 'table'>('bars');

  const budgetLines = plan?.budget || [];
  const totalBudget = state.totalBudget || 0;
  const lockedSet = new Set(state.lockedCategories || []);

  const handlePriorityChange = (cat: CoreCategory, level: PriorityLevel) => {
    const nextPriorities = {
      ...(state.priorities || {}),
      [cat]: level,
    };
    updateField('priorities', nextPriorities);
  };

  const handleToggleLock = (cat: CoreCategory) => {
    const isLocked = lockedSet.has(cat);
    const line = budgetLines.find((b) => b.category === cat);
    const currentAmount = line?.amount || 0;

    if (isLocked) {
      // Unlock
      const nextLocked = (state.lockedCategories || []).filter((c) => c !== cat);
      const nextLockedLines = { ...(state.lockedBudgetLines || {}) };
      delete nextLockedLines[cat];
      updateField('lockedCategories', nextLocked);
      updateField('lockedBudgetLines', nextLockedLines);
    } else {
      // Lock with current allocated amount
      const nextLocked = [...(state.lockedCategories || []), cat];
      const nextLockedLines = {
        ...(state.lockedBudgetLines || {}),
        [cat]: currentAmount,
      };
      updateField('lockedCategories', nextLocked);
      updateField('lockedBudgetLines', nextLockedLines);
    }
  };

  const budgetWarnings = (plan?.warnings || []).filter(
    (w) => w.code === 'LOW_PER_GUEST_CATERING' || w.code === 'HIGH_PER_HEAD_VENUE'
  );

  const contingencyLine = budgetLines.find((b) => b.category === 'contingency');

  if (totalBudget <= 0 || budgetLines.length === 0) {
    return (
      <section
        aria-label="Budget Breakdown"
        className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center shadow-xs"
      >
        <span className="text-4xl mb-3">💰</span>
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Budget Not Initialized
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
          Tell the assistant your total budget in the intake chat or click &quot;Load Sample Event&quot; above to view the full allocation breakdown.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Budget Breakdown"
      className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Budget Allocation Breakdown
            </h2>
            <ProvenanceBadge provenance="derived" />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Total {formatINR(totalBudget)} · 8 Categories + 8% Contingency Buffer
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/60 dark:bg-stone-800 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('bars')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'bars'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Bars View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
            }`}
          >
            Table View
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* Warnings Banner */}
        {budgetWarnings.map((warn) => (
          <div
            key={warn.code}
            role="alert"
            className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs flex items-start gap-3"
          >
            <span className="text-base leading-none">⚠️</span>
            <div>
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                {warn.code === 'LOW_PER_GUEST_CATERING'
                  ? 'Catering Headroom Notice'
                  : 'High Venue Share Notice'}
              </span>
              <p className="text-amber-800 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                {warn.message}
              </p>
            </div>
          </div>
        ))}

        {/* View 1: Visual Bars */}
        {viewMode === 'bars' ? (
          <div className="space-y-4">
            {budgetLines.map((line) => {
              const cat = line.category as CoreCategory;
              const isContingency = cat === ('contingency' as CoreCategory);
              const isLocked = lockedSet.has(cat);
              const icon = CATEGORY_ICONS[line.category] || '📦';
              const percent = Math.round(line.share * 100);
              const currentPrio = state.priorities?.[cat] || 3;
              const isGuestDriven = GUEST_DRIVEN_CATEGORIES.includes(
                cat as (typeof GUEST_DRIVEN_CATEGORIES)[number]
              );

              return (
                <div
                  key={line.category}
                  className={`p-4 rounded-xl border transition-all ${
                    isLocked
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-800/80 shadow-xs'
                      : isContingency
                      ? 'bg-stone-50/70 dark:bg-stone-800/30 border-dashed border-stone-300 dark:border-stone-700'
                      : 'bg-stone-50/50 dark:bg-stone-800/40 border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  {/* Top Line: Title, Provenance, Lock & Amount */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base" aria-hidden="true">
                        {icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 capitalize">
                            {line.category.replace('_', ' ')}
                          </h3>
                          {isLocked && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                              🔒 Locked
                            </span>
                          )}
                          <ProvenanceBadge provenance={line.provenance} />
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400">
                          {CATEGORY_DESCRIPTIONS[line.category]}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {formatINR(line.amount)}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                        {percent}% of budget
                        {isGuestDriven && line.perGuest && (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold ml-1.5">
                            (₹{line.perGuest.toLocaleString('en-IN')}/head)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div
                    className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 overflow-hidden mb-3"
                    role="progressbar"
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${line.category} allocation percentage`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isLocked
                          ? 'bg-amber-600'
                          : isContingency
                          ? 'bg-stone-500'
                          : 'bg-linear-to-r from-amber-500 to-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
                    />
                  </div>

                  {/* Bottom Controls: Lock Button and Priority Multiplier */}
                  {!isContingency && (
                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                      {/* Priority Controls */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                          Priority:
                        </span>
                        <div className="flex items-center gap-1">
                          {([1, 2, 3, 4, 5] as PriorityLevel[]).map((lvl) => (
                            <button
                              key={lvl}
                              type="button"
                              disabled={isLocked}
                              onClick={() => handlePriorityChange(cat, lvl)}
                              className={`w-5 h-5 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                                currentPrio === lvl
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Lock Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleLock(cat)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                          isLocked
                            ? 'bg-amber-600 text-white hover:bg-amber-700'
                            : 'bg-stone-200/80 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600'
                        }`}
                        title={
                          isLocked
                            ? `Unlock ${cat} to let it rebalance dynamically`
                            : `Lock ${cat} at ₹${line.amount.toLocaleString('en-IN')}`
                        }
                      >
                        <span aria-hidden="true">{isLocked ? '🔒' : '🔓'}</span>
                        <span>{isLocked ? 'Locked' : 'Lock Amount'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* View 2: Accessible Data Table */
          <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
            <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
              <thead className="bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold border-b border-stone-200 dark:border-stone-700">
                <tr>
                  <th scope="col" className="p-3">Category</th>
                  <th scope="col" className="p-3">Share %</th>
                  <th scope="col" className="p-3">Total Amount</th>
                  <th scope="col" className="p-3">Per Guest</th>
                  <th scope="col" className="p-3">Priority</th>
                  <th scope="col" className="p-3">Status</th>
                  <th scope="col" className="p-3">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900">
                {budgetLines.map((line) => {
                  const cat = line.category as CoreCategory;
                  const isContingency = cat === ('contingency' as CoreCategory);
                  const isLocked = lockedSet.has(cat);
                  const icon = CATEGORY_ICONS[line.category] || '📦';
                  const percent = Math.round(line.share * 100);
                  const currentPrio = state.priorities?.[cat] || 3;

                  return (
                    <tr key={line.category} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                      <td className="p-3 font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 capitalize">
                        <span>{icon}</span>
                        <span>{line.category.replace('_', ' ')}</span>
                      </td>
                      <td className="p-3 font-mono font-medium">{percent}%</td>
                      <td className="p-3 font-bold text-stone-900 dark:text-stone-100">
                        {formatINR(line.amount)}
                      </td>
                      <td className="p-3">
                        {line.perGuest ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            {formatINR(line.perGuest)}
                          </span>
                        ) : (
                          <span className="text-stone-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {!isContingency ? (
                          <span className="font-bold">{currentPrio}/5</span>
                        ) : (
                          <span className="text-stone-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isLocked ? (
                          <span className="text-amber-700 dark:text-amber-400 font-bold">🔒 Locked</span>
                        ) : isContingency ? (
                          <span className="text-stone-500">Fixed</span>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400">Dynamic</span>
                        )}
                      </td>
                      <td className="p-3">
                        <ProvenanceBadge provenance={line.provenance} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Contingency Explainer Note */}
        {contingencyLine && (
          <div className="p-3.5 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700/60 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            🛡️ <strong className="text-stone-800 dark:text-stone-200">8% Contingency Buffer ({formatINR(contingencyLine.amount)}):</strong> Pre-allocated safety net reserved for emergency cash advances, tips, sudden guest additions, or overtime charges on the event day.
          </div>
        )}
      </div>
    </section>
  );
};
