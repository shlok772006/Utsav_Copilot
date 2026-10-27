'use client';

import React from 'react';
import { useEventStore } from '@/lib/store/useEventStore';

export const Header: React.FC = () => {
  const { history, undo, loadSampleEvent, resetEvent } = useEventStore();
  const canUndo = history.length > 0;

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            उ
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Utsav Copilot</span>
              <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-serif border border-amber-300 dark:border-amber-800">
                उत्सव
              </span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 hidden sm:block">
              Living Event Plan for Indian Family Celebrations
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Load Sample Event */}
          <button
            type="button"
            onClick={loadSampleEvent}
            className="px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            title="Load 25th Anniversary demo scenario (₹3L, 60 guests)"
          >
            <span aria-hidden="true">★</span>
            <span className="hidden sm:inline">Load</span> Sample Event
          </button>

          {/* Undo Button */}
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            title={canUndo ? `Undo last action (${history.length} snapshots)` : 'No actions to undo'}
            aria-label={`Undo last action (${history.length} snapshots available)`}
          >
            <span aria-hidden="true">↺</span>
            <span>Undo</span>
            {canUndo && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold bg-amber-600 text-white rounded-full">
                {history.length}
              </span>
            )}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset event plan and clear history?')) {
                resetEvent();
              }
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
            title="Clear all inputs and reset to new event"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
};
