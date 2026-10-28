'use client';

import React, { useEffect, useState } from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { formatINR, formatDateDisplay } from '@/lib/ui/format';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { ReplanReviewPayload } from './ChangeBar';

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

interface ReplanDiffModalProps {
  payload: ReplanReviewPayload | null;
  isOpen: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export const ReplanDiffModal: React.FC<ReplanDiffModalProps> = ({
  payload,
  isOpen,
  onClose,
  onApplied,
}) => {
  const { state, applyOpsAction } = useEventStore();
  const [userSelectedScenarioId, setUserSelectedScenarioId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'scenarios' | 'budget' | 'timeline' | 'warnings'>('scenarios');

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !payload) return null;

  const { proposedState, proposedPlan, diff, scenarios, advice, userText } = payload;
  const defaultScenarioId = advice.recommendedScenarioId || scenarios[0]?.id || 'direct-change';
  const selectedScenarioId = userSelectedScenarioId ?? defaultScenarioId;
  const lockedSet = new Set(state.lockedCategories || []);

  const totalBefore = state.totalBudget || 0;
  const totalAfter = proposedState.totalBudget || 0;
  const netBudgetDelta = totalAfter - totalBefore;

  const handleApply = () => {
    const chosenScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
    if (chosenScenario) {
      applyOpsAction(chosenScenario.ops, `Replan: ${chosenScenario.headline}`);
      onClose();
      if (onApplied) onApplied();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="replan-modal-title" className="text-base font-bold text-stone-900 dark:text-stone-100">
                Plan Revision & Impact Analysis
              </h2>
              <ProvenanceBadge provenance="ai" />
              <ProvenanceBadge provenance="derived" />
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Triggered by: &quot;<strong className="text-stone-700 dark:text-stone-300">{userText}</strong>&quot;
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer text-sm"
            aria-label="Close revision modal"
          >
            ✕
          </button>
        </div>

        {/* Advisor Summary Card */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5">
            <span className="text-base leading-none" aria-hidden="true">
              ✨
            </span>
            <div className="space-y-1">
              <strong className="block text-amber-900 dark:text-amber-100 font-semibold">
                Advisor Assessment:
              </strong>
              <p className="leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                {advice.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-5 pt-2 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('scenarios')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'scenarios'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            ⭐ Tradeoff Options ({scenarios.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'budget'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            💰 Budget Deltas ({diff.budgetDeltas.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            🗓️ Schedule Shifts ({diff.shiftedTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('warnings')}
            className={`pb-2.5 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'warnings'
                ? 'border-amber-600 text-amber-900 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            ⚠️ Warnings ({diff.addedWarnings.length} new)
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: Tradeoff Scenarios */}
          {activeTab === 'scenarios' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Choose how you want to adapt to the new constraints. Every option calculates all numbers with zero guesswork:
              </p>

              <div className="space-y-3" role="radiogroup" aria-label="Tradeoff scenario choices">
                {scenarios.map((s, index) => {
                  const isSelected = selectedScenarioId === s.id;
                  const isRecommended = advice.recommendedScenarioId === s.id;
                  const analysisText = advice.options.find((o) => o.scenarioId === s.id)?.analysis;

                  return (
                    <div
                      key={s.id}
                      role="radio"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onClick={() => setUserSelectedScenarioId(s.id)}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          setUserSelectedScenarioId(s.id);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs'
                          : 'border-stone-200 dark:border-stone-700/80 hover:border-stone-300 dark:hover:border-stone-600 bg-stone-50/50 dark:bg-stone-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="replan-scenario"
                            id={`scenario-${s.id}`}
                            checked={isSelected}
                            onChange={() => setUserSelectedScenarioId(s.id)}
                            className="mt-1 w-4 h-4 text-amber-600 accent-amber-600 cursor-pointer"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <label
                                htmlFor={`scenario-${s.id}`}
                                className="text-sm font-bold text-stone-900 dark:text-stone-100 cursor-pointer"
                              >
                                Option {String.fromCharCode(65 + index)}: {s.headline}
                              </label>
                              {isRecommended && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                  ⭐ Recommended
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-stone-700 dark:text-stone-300 mt-1 leading-relaxed">
                              {s.why}
                            </p>

                            <div className="mt-2 text-[11px] p-2 rounded-lg bg-white/70 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                              <strong className="text-stone-800 dark:text-stone-200">Tradeoff:</strong>{' '}
                              {s.tradeoff}
                              {analysisText && (
                                <span className="block mt-1 text-amber-800 dark:text-amber-300 font-medium">
                                  Advisor note: {analysisText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {s.savingsAmount !== undefined && s.savingsAmount > 0 && (
                          <div className="text-right whitespace-nowrap">
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              Saves {formatINR(s.savingsAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Budget Deltas */}
          {activeTab === 'budget' && (
            <div className="space-y-3">
              {/* Total Budget Delta Banner */}
              <div className="p-3 bg-stone-100 dark:bg-stone-800/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-500 dark:text-stone-400">Total Budget:</span>
                  <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {formatINR(totalBefore)} → {formatINR(totalAfter)}
                  </div>
                </div>
                <div
                  className={`text-sm font-bold px-2.5 py-1 rounded-lg ${
                    netBudgetDelta < 0
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                      : netBudgetDelta > 0
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {netBudgetDelta > 0 ? `+${formatINR(netBudgetDelta)}` : netBudgetDelta < 0 ? `-${formatINR(Math.abs(netBudgetDelta))}` : '₹0 Change'}
                </div>
              </div>

              {/* Category Deltas Table */}
              <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold border-b border-stone-200 dark:border-stone-700">
                    <tr>
                      <th scope="col" className="p-2.5">Category</th>
                      <th scope="col" className="p-2.5 text-right">Previous</th>
                      <th scope="col" className="p-2.5 text-right">Revised</th>
                      <th scope="col" className="p-2.5 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900">
                    {diff.budgetDeltas.map((line) => {
                      const icon = CATEGORY_ICONS[line.category] || '📦';
                      const isLocked = lockedSet.has(line.category as (typeof state.lockedCategories)[number]);
                      const delta = line.deltaAmount;

                      return (
                        <tr key={line.category} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="p-2.5 font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 capitalize">
                            <span>{icon}</span>
                            <span>{line.category.replace('_', ' ')}</span>
                            {isLocked && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 rounded font-semibold">
                                🔒 Locked
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right text-stone-500">
                            {formatINR(line.previousAmount)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-stone-900 dark:text-stone-100">
                            {formatINR(line.currentAmount)}
                          </td>
                          <td className="p-2.5 text-right">
                            <span
                              className={`font-semibold ${
                                delta < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : delta > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-stone-400'
                              }`}
                            >
                              {delta > 0 ? `+${formatINR(delta)}` : delta < 0 ? `-${formatINR(Math.abs(delta))}` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Schedule Shifts */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {proposedPlan.compressed && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <span>⚡</span>
                  <span>
                    <strong>Schedule is now compressed:</strong> available days ({proposedPlan.daysAvailable}) &lt; critical path ({proposedPlan.criticalPathDays} days).
                  </span>
                </div>
              )}

              {diff.shiftedTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500">
                  No task deadlines were shifted by this change.
                </div>
              ) : (
                <div className="space-y-2">
                  {diff.shiftedTasks.map((t) => (
                    <div
                      key={t.taskId}
                      className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-900 dark:text-stone-100">
                          {t.title}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                          {formatDateDisplay(t.previousDeadline)} → <strong className="text-stone-700 dark:text-stone-300">{formatDateDisplay(t.currentDeadline)}</strong>
                        </div>
                      </div>

                      <div
                        className={`font-bold px-2 py-1 rounded-md text-[11px] ${
                          t.daysShifted < 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}
                      >
                        {t.daysShifted < 0 ? `${Math.abs(t.daysShifted)}d earlier` : `${t.daysShifted}d later`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Warnings & Health */}
          {activeTab === 'warnings' && (
            <div className="space-y-3">
              {diff.addedWarnings.length === 0 && diff.resolvedWarnings.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500">
                  Plan health is unchanged. No new warnings were triggered or resolved.
                </div>
              ) : (
                <>
                  {diff.addedWarnings.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        New Warnings Triggered ({diff.addedWarnings.length})
                      </h4>
                      {diff.addedWarnings.map((w, i) => (
                        <div
                          key={i}
                          className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200"
                        >
                          <strong>{w.code}:</strong> {w.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {diff.resolvedWarnings.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Resolved Warnings ({diff.resolvedWarnings.length})
                      </h4>
                      {diff.resolvedWarnings.map((w, i) => (
                        <div
                          key={i}
                          className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200"
                        >
                          ✓ <strong>{w.code} resolved:</strong> {w.message}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
          >
            Discard & Keep Current Plan
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>✓</span>
            <span>Apply Selected Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
