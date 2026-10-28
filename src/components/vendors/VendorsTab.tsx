'use client';

import React, { useState } from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { formatINR } from '@/lib/ui/format';
import { ProvenanceBadge } from '../ui/ProvenanceBadge';
import { CoreCategory } from '@/lib/domain/types';
import { QuotePasteModal } from './QuotePasteModal';

const CATEGORY_NAMES: Record<CoreCategory, string> = {
  venue: 'Venue',
  catering: 'Catering',
  decor: 'Decor',
  photography: 'Photography',
  attire: 'Attire',
  entertainment: 'Entertainment',
  invitations_misc: 'Invitations & Misc',
  logistics: 'Logistics',
};

export const VendorsTab: React.FC = () => {
  const { plan, quotes, removeQuote } = useEventStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());

  const filteredQuotes = quotes.filter((q) => {
    if (selectedCategory === 'all') return true;
    return q.category === selectedCategory;
  });

  const categoriesWithQuotes = Array.from(new Set(quotes.map((q) => q.category)));

  const toggleQuestionCheck = (qKey: string) => {
    setCheckedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qKey)) {
        next.delete(qKey);
      } else {
        next.add(qKey);
      }
      return next;
    });
  };

  if (!plan) {
    return (
      <section
        aria-label="Vendor Quotes"
        className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-center shadow-xs"
      >
        <span className="text-4xl mb-3">🧾</span>
        <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
          Vendor Comparator Not Initialized
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mt-1">
          Set up your event in the chat or load the sample event above to start extracting, normalizing, and comparing vendor quotes side by side.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Vendor Quotes"
      className="flex flex-col h-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Vendor Quotes & Comparison
            </h2>
            <ProvenanceBadge provenance="vendor" />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Normalized side-by-side against your budget lines with missing-field detection
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Add Vendor Quote</span>
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-amber-800 text-amber-50 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            All Quotes ({quotes.length})
          </button>
          {categoriesWithQuotes.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap capitalize ${
                selectedCategory === cat
                  ? 'bg-amber-800 text-amber-50 shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              {CATEGORY_NAMES[cat] || cat} (
              {quotes.filter((q) => q.category === cat).length})
            </button>
          ))}
        </div>

        {/* Empty State when no quotes */}
        {filteredQuotes.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl text-center space-y-2 p-6">
            <span className="text-3xl">📋</span>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              No quotes added {selectedCategory !== 'all' ? `for ${selectedCategory}` : ''}
            </h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Paste raw quotes from WhatsApp or emails to calculate true costs, compare per-guest rates, and identify missing clauses.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 rounded-lg cursor-pointer"
            >
              + Paste First Quote
            </button>
          </div>
        ) : (
          /* Side-by-Side Comparison Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuotes.map((q) => {
              const { normalized, extraction } = q;
              const isOver = normalized.isOverBudget;
              const vsBudget = normalized.vsBudgetLine;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isOver
                      ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/30 dark:bg-rose-950/20'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs'
                  }`}
                >
                  {/* Top Bar: Name, Category & Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 capitalize">
                        {CATEGORY_NAMES[q.category] || q.category} Quote
                      </span>
                      <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {q.vendorName}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeQuote(q.id)}
                      className="text-stone-400 hover:text-rose-600 text-xs cursor-pointer p-1"
                      aria-label={`Remove quote from ${q.vendorName}`}
                      title="Remove quote"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Price Banner */}
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block">
                        Total Normalized Cost:
                      </span>
                      <div className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {normalized.totalPrice ? formatINR(normalized.totalPrice) : 'Not stated'}
                      </div>
                      {normalized.perGuest && (
                        <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">
                          ({formatINR(normalized.perGuest)} / guest)
                        </span>
                      )}
                    </div>

                    {/* vs Budget Line delta */}
                    {vsBudget !== null && (
                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isOver
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          {isOver
                            ? `+${formatINR(vsBudget)} Over budget`
                            : `${formatINR(Math.abs(vsBudget))} Under budget`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Over Budget Warning Alert */}
                  {isOver && (
                    <div
                      role="alert"
                      className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-lg text-[11px] text-rose-900 dark:text-rose-200 flex items-center gap-1.5"
                    >
                      <span>⚠️</span>
                      <span>
                        <strong>Over-Budget Notice:</strong> Exceeds allocated {q.category} line.
                      </span>
                    </div>
                  )}

                  {/* Missing Fields / Not Stated Badges */}
                  {(extraction.missing.length > 0 || normalized.missingFields.length > 0) && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 block">
                        ⚠️ Ambiguities / Not Stated in Quote:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set([...extraction.missing, ...normalized.missingFields])).map(
                          (field, fIdx) => (
                            <span
                              key={fIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800"
                            >
                              Not stated: {field}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inclusions & Exclusions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {/* Inclusions */}
                    <div className="p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg border border-stone-200/80 dark:border-stone-800">
                      <strong className="text-emerald-800 dark:text-emerald-400 block text-[11px] mb-1">
                        ✓ Inclusions:
                      </strong>
                      {extraction.inclusions.length === 0 ? (
                        <span className="text-stone-400 text-[11px]">Not stated</span>
                      ) : (
                        <ul className="space-y-0.5 text-[11px] text-stone-600 dark:text-stone-300">
                          {extraction.inclusions.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Exclusions */}
                    <div className="p-2.5 bg-stone-50 dark:bg-stone-800/40 rounded-lg border border-stone-200/80 dark:border-stone-800">
                      <strong className="text-rose-800 dark:text-rose-400 block text-[11px] mb-1">
                        ✕ Exclusions / Extras:
                      </strong>
                      {extraction.exclusions.length === 0 && extraction.additionalCharges.length === 0 ? (
                        <span className="text-stone-400 text-[11px]">None stated</span>
                      ) : (
                        <ul className="space-y-0.5 text-[11px] text-stone-600 dark:text-stone-300">
                          {extraction.exclusions.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                          {extraction.additionalCharges.map((item, i) => (
                            <li key={i} className="text-amber-700 dark:text-amber-400">
                              + {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Payment Terms & Validity */}
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 space-y-0.5 pt-1 border-t border-stone-200/60 dark:border-stone-800">
                    <div>
                      <strong>Payment Terms:</strong>{' '}
                      {extraction.paymentTerms || <span className="text-amber-700 font-semibold">Not stated</span>}
                    </div>
                    {extraction.validity && (
                      <div>
                        <strong>Validity:</strong> {extraction.validity}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Questions to Ask Before Booking Section */}
        {filteredQuotes.length > 0 && (
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-base" aria-hidden="true">
                🎯
              </span>
              <div>
                <h3 className="text-xs font-bold text-amber-950 dark:text-amber-100 uppercase tracking-wider">
                  Questions to Ask Vendors Before Booking
                </h3>
                <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                  Curated questions to protect your family from surprise charges and day-of-event chaos
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {filteredQuotes.map((q) => {
                const questions = q.extraction.questionsToAsk || [];
                if (questions.length === 0) return null;

                return (
                  <div key={q.id} className="space-y-1.5">
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      For {q.vendorName}:
                    </span>
                    <div className="space-y-1">
                      {questions.map((question, idx) => {
                        const qKey = `${q.id}-${idx}`;
                        const isChecked = checkedQuestions.has(qKey);

                        return (
                          <label
                            key={idx}
                            className="flex items-start gap-2.5 p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 cursor-pointer hover:border-amber-300"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleQuestionCheck(qKey)}
                              className="mt-0.5 w-3.5 h-3.5 rounded text-amber-600 accent-amber-600 cursor-pointer"
                            />
                            <span className={isChecked ? 'line-through opacity-50' : ''}>
                              {question}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quote Paste Modal */}
      <QuotePasteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
};
