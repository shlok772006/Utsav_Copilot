'use client';

import React from 'react';
import { useEventStore } from '@/lib/store/useEventStore';
import { formatINR, formatNumber, formatDateDisplay } from '@/lib/ui/format';
import { Occasion } from '@/lib/domain/types';

const OCCASION_META: Record<Occasion, { icon: string; label: string; gradient: string }> = {
  wedding: { icon: '💒', label: 'Wedding Celebration', gradient: 'from-rose-500/20 to-amber-500/20' },
  sangeet: { icon: '🪕', label: 'Sangeet & Mehendi Night', gradient: 'from-amber-500/20 to-orange-500/20' },
  engagement: { icon: '💍', label: 'Engagement Ceremony', gradient: 'from-amber-500/20 to-yellow-500/20' },
  anniversary: { icon: '🌟', label: 'Milestone Anniversary', gradient: 'from-emerald-500/20 to-teal-500/20' },
  birthday: { icon: '🎂', label: 'Birthday Celebration', gradient: 'from-purple-500/20 to-pink-500/20' },
  reception: { icon: '🥂', label: 'Grand Reception', gradient: 'from-sky-500/20 to-indigo-500/20' },
  general: { icon: '✨', label: 'Family Celebration', gradient: 'from-amber-500/20 to-rose-500/20' },
};

interface CelebrationBannerProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const CelebrationBanner: React.FC<CelebrationBannerProps> = ({
  onToggleSidebar,
  isSidebarOpen = true,
}) => {
  const { state, plan } = useEventStore();

  const occasionMeta = state.occasion
    ? OCCASION_META[state.occasion] || OCCASION_META.general
    : null;

  const perGuest =
    state.totalBudget && state.guestCount && state.guestCount > 0
      ? Math.round(state.totalBudget / state.guestCount)
      : null;

  const isReady = Boolean(
    state.occasion &&
    state.totalBudget &&
    state.totalBudget > 0 &&
    state.guestCount &&
    state.guestCount > 0 &&
    state.eventDate
  );

  return (
    <div className="mb-5 rounded-2xl bg-white/95 dark:bg-stone-900/95 border border-amber-300/40 dark:border-amber-800/40 shadow-xs backdrop-blur-md p-4 sm:p-5 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Occasion, Status, and Location */}
        <div className="flex items-center gap-3.5 min-w-[220px]">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-amber-500/20 via-orange-500/15 to-rose-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-2xs shrink-0">
            {occasionMeta?.icon || '✨'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {occasionMeta?.label || 'Your Celebration Plan'}
              </h2>
              {isReady ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <span>✓</span>
                  <span>Plan Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <span>◌</span>
                  <span>In Setup</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1">📍 {state.city || 'City not set'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">📅 {formatDateDisplay(state.eventDate)}</span>
            </p>
          </div>
        </div>

        {/* Center: Executive Key Metrics Strip */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 bg-stone-50/80 dark:bg-stone-800/40 px-4 py-2.5 rounded-xl border border-stone-200/60 dark:border-stone-700/50">
          {/* Budget */}
          <div className="flex flex-col min-w-[110px]">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
              Total Budget
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-sm sm:text-base font-extrabold text-amber-700 dark:text-amber-400">
                {state.totalBudget ? `Budget: ${formatINR(state.totalBudget)}` : 'Not stated'}
              </span>
              {perGuest && (
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                  (₹{formatNumber(perGuest)}/head)
                </span>
              )}
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-stone-200 dark:bg-stone-700" />

          {/* Headcount */}
          <div className="flex flex-col min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
              Headcount
            </span>
            <span className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-200 mt-0.5">
              {state.guestCount ? `${formatNumber(state.guestCount)} guests` : 'Not stated'}
            </span>
          </div>

          <div className="hidden sm:block w-px h-8 bg-stone-200 dark:bg-stone-700" />

          {/* Countdown */}
          <div className="flex flex-col min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
              Countdown
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-200">
                {plan ? `${plan.daysAvailable} days` : '—'}
              </span>
              {plan?.compressed && (
                <span
                  title="Compressed schedule notice"
                  className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 text-[10px] font-bold border border-rose-200 dark:border-rose-800"
                >
                  ⚡ Compressed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Toggle */}
        {onToggleSidebar && (
          <div className="flex items-center gap-2 ml-auto lg:ml-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title={isSidebarOpen ? 'Hide parameters sidebar' : 'Show parameters sidebar'}
            >
              <span>{isSidebarOpen ? '◧ Hide Snapshot' : '◨ Show Snapshot'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
