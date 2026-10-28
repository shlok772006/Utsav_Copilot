'use client';

import React, { useEffect, useState } from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { normalizeQuote } from '@/lib/domain/quote';
import { CoreCategory, RawQuote } from '@/lib/domain/types';
import { QuoteExtractionOutput } from '@/lib/llm/schemas';

interface QuotePasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuoteAdded?: () => void;
}

const CATEGORY_OPTIONS: { value: CoreCategory; label: string }[] = [
  { value: 'catering', label: '🍲 Catering' },
  { value: 'venue', label: '🏛️ Venue' },
  { value: 'decor', label: '🌸 Decor' },
  { value: 'photography', label: '📸 Photography' },
  { value: 'attire', label: '👗 Attire' },
  { value: 'entertainment', label: '🎵 Entertainment' },
  { value: 'invitations_misc', label: '💌 Invitations & Misc' },
  { value: 'logistics', label: '🚗 Logistics' },
];

export const SAMPLE_QUOTE_1_TEXT =
  'Annapurna Caterers: ₹650 per plate, 60 guests min, includes service staff and setup, GST 5% extra. Excludes live dessert counter.';

export const SAMPLE_QUOTE_2_TEXT =
  'Royal Feast: Fixed package ₹1,65,000 all inclusive, covers up to 60 guests, live chaat and hot jalebi counters, cinematic buffet presentation, 50% advance.';

export const QuotePasteModal: React.FC<QuotePasteModalProps> = ({
  isOpen,
  onClose,
  onQuoteAdded,
}) => {
  const { state, plan, addQuote } = useEventStore();
  const [category, setCategory] = useState<CoreCategory>('catering');
  const [rawText, setRawText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !plan) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          category,
          rawText: trimmed,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to parse vendor quote (HTTP ${res.status})`);
      }

      const data = (await res.json()) as {
        extraction: QuoteExtractionOutput;
        questionsToAsk: string[];
      };

      const extraction = data.extraction;

      // Pure domain normalization
      const rawQuoteObj: RawQuote = {
        category,
        vendorName: extraction.vendorName || undefined,
        totalPrice: extraction.totalPrice ?? undefined,
        unitPrice: extraction.unitPrice ?? undefined,
        unitType:
          extraction.unitLabel?.toLowerCase().includes('plate') ||
          extraction.unitLabel?.toLowerCase().includes('guest')
            ? 'per_guest'
            : typeof extraction.totalPrice === 'number'
            ? 'fixed'
            : undefined,
        coverageCount: extraction.guestsCovered ?? undefined,
        includesTax: !extraction.additionalCharges.some(
          (c) => c.toLowerCase().includes('gst') || c.toLowerCase().includes('tax')
        ),
        taxRate: 0.05,
        rawText: trimmed,
      };

      const normalized = normalizeQuote(rawQuoteObj, state, plan);

      addQuote({
        id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        category,
        vendorName: extraction.vendorName || 'Vendor (Not stated)',
        rawText: trimmed,
        extraction,
        normalized,
        timestamp: Date.now(),
      });

      setRawText('');
      onClose();
      if (onQuoteAdded) onQuoteAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze vendor quote. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paste-quote-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-amber-50/50 dark:bg-stone-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 id="paste-quote-title" className="text-base font-bold text-stone-900 dark:text-stone-100">
              Add Vendor Quote for Comparison
            </h2>
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
              title="Extraction parsed by Gemini, calculated by code"
            >
              AI + Code
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
            aria-label="Close quote modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200"
            >
              ⚠️ {error}
            </div>
          )}

          {/* Category Dropdown */}
          <div>
            <label htmlFor="quote-category" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
              Select Category
            </label>
            <select
              id="quote-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as CoreCategory)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Raw Text Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="raw-quote-text" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Paste Quote Text (WhatsApp, Email, Rate Card)
              </label>
              <span className="text-[11px] font-mono text-stone-400">
                {rawText.length}/6000
              </span>
            </div>
            <textarea
              id="raw-quote-text"
              rows={5}
              maxLength={6000}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="e.g. 'Shree Ganesh Caterers: ₹650 per plate, 60 people min, includes live counter, service staff extra, GST 5%'..."
              className="w-full p-3 text-xs sm:text-sm bg-stone-50 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* Quick Demo Sample Buttons */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium text-stone-500">
              Or load sample caterer quote for instant demo:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('catering');
                  setRawText(SAMPLE_QUOTE_1_TEXT);
                }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
              >
                🍲 Sample A: Annapurna (₹650/plate)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory('catering');
                  setRawText(SAMPLE_QUOTE_2_TEXT);
                }}
                className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer border border-stone-200 dark:border-stone-700"
              >
                🍲 Sample B: Royal Feast (₹1.65L pkg)
              </button>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!rawText.trim() || isLoading}
              className="px-5 py-2.5 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Extracting & Normalizing...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Extract & Compare Quote</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
