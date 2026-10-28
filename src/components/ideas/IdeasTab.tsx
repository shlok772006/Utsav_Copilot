'use client';

import React, { useState } from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { ConceptIdea } from '@/lib/llm/schemas';

const COST_LEVEL_STYLES: Record<ConceptIdea['costLevel'], { label: string; bg: string; text: string; border: string }> = {
  lower: {
    label: 'Cost Level: Lower',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-200',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  similar: {
    label: 'Cost Level: Similar',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    text: 'text-amber-900 dark:text-amber-200',
    border: 'border-amber-300 dark:border-amber-800',
  },
  higher: {
    label: 'Cost Level: Higher',
    bg: 'bg-purple-100 dark:bg-purple-950/60',
    text: 'text-purple-900 dark:text-purple-200',
    border: 'border-purple-300 dark:border-purple-800',
  },
};

const SUGGESTION_CHIPS = [
  'More traditional Maharashtrian flavor',
  'Prioritize elder comfort & quiet seating',
  'Cut decor share, maximize live food counters',
  'Kid-friendly entertainment & games',
];

export const IdeasTab: React.FC = () => {
  const { state, plan, concepts, setConcepts } = useEventStore();
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchConcepts = async (customFeedback?: string) => {
    if (!plan || plan.budget.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          budgetLines: plan.budget,
          feedback: customFeedback || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to generate ideas (HTTP ${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data.concepts) && data.concepts.length > 0) {
        setConcepts(data.concepts);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate personalized concepts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    fetchConcepts(feedback);
    setFeedback('');
  };

  const handleChipClick = (chipText: string) => {
    setFeedback(chipText);
    fetchConcepts(chipText);
  };

  if (!plan) {
    return (
      <section
        aria-label="Personalized Ideas"
        className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center shadow-xs"
      >
        <span className="text-4xl mb-3">💡</span>
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Ideas Not Available Yet
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
          Tell the assistant about your event in the chat or load the sample event above to generate personalized concept cards tailored to your budget and guest mix.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Personalized Ideas"
      className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Personalized Celebration Concepts
            </h2>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-900 border border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800 shadow-xs"
              title="Provenance: AI concept"
            >
              <span>✨</span>
              <span>AI concepts</span>
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Tailored to your {state.occasion || 'celebration'} for {state.guestCount || 60} guests in {state.city || 'your city'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchConcepts()}
          disabled={isLoading}
          className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-lg border border-stone-300 dark:border-stone-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
        >
          <span>🔄</span>
          <span>{isLoading ? 'Generating...' : 'Refresh Concepts'}</span>
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-5">
        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between"
          >
            <span>⚠️ {error}</span>
            <button
              type="button"
              onClick={() => fetchConcepts()}
              className="text-xs font-bold underline ml-3 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && concepts.length === 0 ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 space-y-3"
              >
                <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-1/3" />
                <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
                <div className="h-16 bg-stone-200 dark:bg-stone-700 rounded" />
              </div>
            ))}
          </div>
        ) : concepts.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-3 p-6">
            <span className="text-3xl">✨</span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              No concepts generated yet
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Generate 3 distinct celebration concepts with elder & kid comfort notes, tailored to your budget share.
            </p>
            <button
              type="button"
              onClick={() => fetchConcepts()}
              className="mt-1 px-4 py-2 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              ✨ Generate Celebration Concepts
            </button>
          </div>
        ) : (
          /* 3 Concept Cards */
          <div className="space-y-4">
            {concepts.map((concept, idx) => {
              const costStyle = COST_LEVEL_STYLES[concept.costLevel] || COST_LEVEL_STYLES.similar;

              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs hover:border-amber-300 dark:hover:border-amber-700/60 transition-all space-y-3.5"
                >
                  {/* Card Title & Cost Level Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Concept {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {concept.name}
                      </h3>
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                        {concept.vibe}
                      </p>
                    </div>

                    {/* Cost Level Badge (Strictly relative label, no rupee prices) */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide select-none ${costStyle.bg} ${costStyle.text} ${costStyle.border}`}
                    >
                      {costStyle.label}
                    </span>
                  </div>

                  {/* Where the Money Goes */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/80 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300">
                    <strong className="text-stone-900 dark:text-stone-100 block mb-0.5">
                      💰 Where the Money Goes:
                    </strong>
                    <p className="leading-relaxed">{concept.whereMoneyGoes}</p>
                  </div>

                  {/* Elder & Kid Comfort Notes */}
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200">
                    <strong className="text-amber-900 dark:text-amber-100 block mb-0.5">
                      👵 Elder & Child Comfort:
                    </strong>
                    <p className="leading-relaxed">{concept.comfortNotes}</p>
                  </div>

                  {/* Risks & Watchouts */}
                  {concept.risks && (
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      <strong>⚠️ Watchout:</strong> {concept.risks}
                    </div>
                  )}

                  {/* First 3 Steps Checklist */}
                  {concept.firstThreeSteps && concept.firstThreeSteps.length > 0 && (
                    <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800 text-xs">
                      <span className="font-bold text-stone-800 dark:text-stone-200 block mb-1.5">
                        First 3 Steps to Execute:
                      </span>
                      <ul className="space-y-1 text-stone-600 dark:text-stone-400 list-inside">
                        {concept.firstThreeSteps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold leading-none">
                              {sIdx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Refinement / Feedback Bar */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
            <span>✨</span>
            <span>Refine These Concepts with AI:</span>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. 'Too heavy on decor, shift focus to live food and kids music'..."
              className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!feedback.trim() || isLoading}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? 'Adapting...' : 'Refine'}
            </button>
          </form>

          {/* Suggestion Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-stone-500">
            <span className="whitespace-nowrap">Try:</span>
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-md bg-stone-200/70 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
