'use client';

import React, { useState } from 'react';
import { useEventStore, getTodayIso } from '@/lib/store/useEventStore';
import { applyOps } from '@/lib/domain/ops';
import { buildPlan } from '@/lib/domain/plan';
import { diffPlans } from '@/lib/domain/diff';
import { generateScenarios } from '@/lib/domain/scenarios';
import { EventState, Op, Plan, PlanDiff, Scenario } from '@/lib/domain/types';
import { formatINR } from '@/lib/ui/format';

export interface AdvisorAdvice {
  summary: string;
  options: {
    scenarioId: string;
    analysis: string;
  }[];
  recommendedScenarioId?: string;
}

export interface ReplanReviewPayload {
  proposedState: EventState;
  proposedPlan: Plan;
  diff: PlanDiff;
  scenarios: Scenario[];
  advice: AdvisorAdvice;
  directOps: Op[];
  userText: string;
}

interface ChangeBarProps {
  onReplanReady: (payload: ReplanReviewPayload) => void;
  className?: string;
}

export const HERO_DEMO_TEXT = 'Cut budget to ₹2 Lakh & move date 2 weeks earlier';

export const ChangeBar: React.FC<ChangeBarProps> = ({ onReplanReady, className = '' }) => {
  const { state, plan } = useEventStore();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clarification, setClarification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitText = async (inputText: string) => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setClarification(null);
    setError(null);

    try {
      // 1. Call /api/change to convert natural language to operations
      const changeRes = await fetch('/api/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          text: trimmed,
        }),
      });

      if (!changeRes.ok) {
        const errJson = await changeRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Change request failed (HTTP ${changeRes.status})`);
      }

      const changeData = (await changeRes.json()) as {
        ops?: Op[];
        clarification?: string;
      };

      // 2. Check if clarification requested
      if (changeData.clarification) {
        setClarification(changeData.clarification);
        setIsLoading(false);
        return;
      }

      const ops = changeData.ops || [];
      if (ops.length === 0) {
        setClarification('No specific plan adjustments were detected. Try mentioning a budget amount, guest count, or date.');
        setIsLoading(false);
        return;
      }

      // 3. Deterministically compute proposed state and new plan
      const today = getTodayIso();
      const { state: nextState } = applyOps(state, ops, today);
      const proposedPlan = buildPlan(nextState, today);
      const currentPlan = plan || buildPlan(state, today);

      // 4. Compute deterministic diff and scenarios
      const diff = diffPlans(currentPlan, proposedPlan);
      const rawScenarios = generateScenarios(nextState, proposedPlan);

      // Ensure at least Option A (Direct change as requested) exists
      const directScenario: Scenario = {
        id: 'direct-change',
        headline: 'Direct Revision (Apply Requested Changes)',
        why: 'Directly applies your requested updates without secondary tradeoffs.',
        ops: ops,
        tradeoff: 'Accepts the new budget and deadline constraints directly.',
      };

      const scenarios: Scenario[] = [directScenario, ...rawScenarios.filter((s) => s.id !== 'direct-change')];

      // 5. Call /api/advise to get advisor narration
      let advice: AdvisorAdvice;
      try {
        const adviseRes = await fetch('/api/advise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: nextState,
            diff,
            scenarios,
          }),
        });

        if (adviseRes.ok) {
          const adviseData = await adviseRes.json();
          advice = {
            summary: adviseData.summary || 'Plan revised successfully.',
            options: adviseData.options || [],
            recommendedScenarioId: adviseData.recommendedScenarioId || 'direct-change',
          };
        } else {
          throw new Error('Advise request failed');
        }
      } catch {
        // Fallback local advice narration
        const budgetDelta = diff.budgetDeltas.reduce((acc, d) => acc + d.deltaAmount, 0);
        advice = {
          summary: `Plan revised: budget ${budgetDelta < 0 ? `reduced by ${formatINR(Math.abs(budgetDelta))}` : budgetDelta > 0 ? `increased by ${formatINR(budgetDelta)}` : 'unchanged'}, with ${diff.shiftedTasks.length} task deadlines shifted.`,
          options: scenarios.map((s) => ({
            scenarioId: s.id,
            analysis: s.tradeoff,
          })),
          recommendedScenarioId: scenarios.length > 1 ? scenarios[1].id : 'direct-change',
        };
      }

      // 6. Launch Replan Modal via callback
      onReplanReady({
        proposedState: nextState,
        proposedPlan,
        diff,
        scenarios,
        advice,
        directOps: ops,
        userText: trimmed,
      });

      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process plan change. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitText(text);
  };

  const handleQuickChipClick = (suggestion: string) => {
    setText(suggestion);
    handleSubmitText(suggestion);
  };

  return (
    <div
      aria-label="Plan Change Bar"
      className={`p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm ${className}`}
    >
      {/* Clarification Callout */}
      {clarification && (
        <div
          role="status"
          aria-live="polite"
          className="mb-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs flex items-start justify-between gap-2 text-amber-900 dark:text-amber-200"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="text-sm leading-none">
              💡
            </span>
            <span>
              <strong>Clarification needed:</strong> {clarification}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setClarification(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer text-xs"
            aria-label="Dismiss clarification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Callout */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-2.5 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs flex items-start justify-between gap-2 text-rose-900 dark:text-rose-200"
        >
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="text-sm leading-none">
              ⚠️
            </span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer text-xs"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Change Input Form */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            placeholder="Change anything (e.g. 'Budget is now 2 lakh and event moved 2 weeks earlier')..."
            aria-label="Plan change request"
            className="w-full pl-3.5 pr-8 py-2 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all disabled:opacity-50"
          />
          {text && (
            <button
              type="button"
              onClick={() => setText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 text-xs cursor-pointer"
              aria-label="Clear change text"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!text.trim() || isLoading}
          aria-busy={isLoading}
          className="px-4 py-2 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>Replan</span>
            </>
          )}
        </button>
      </form>

      {/* Hero Quick Demo Chip */}
      <div className="mt-2 flex items-center gap-1.5 overflow-x-auto text-[11px] text-stone-500 dark:text-stone-400">
        <span className="font-medium whitespace-nowrap">Try:</span>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleQuickChipClick(HERO_DEMO_TEXT)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer disabled:opacity-50 text-left font-medium whitespace-nowrap"
        >
          <span>🎯</span>
          <span>&quot;{HERO_DEMO_TEXT}&quot;</span>
        </button>
      </div>
    </div>
  );
};
