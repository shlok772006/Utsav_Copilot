import React from 'react';

/**
 * Root Loading Skeleton for Next.js App Router streaming transitions.
 * Provides accessible, immediate visual feedback while route segments load.
 */
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen flex flex-col bg-[#FBF9F5] dark:bg-[#121110] p-6 text-stone-900 dark:text-stone-100"
    >
      <span className="sr-only">Loading Utsav Copilot workspace...</span>

      {/* Header skeleton */}
      <header className="h-16 border-b border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 rounded-2xl mb-6 animate-pulse" />

      {/* Main content skeleton */}
      <main className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-6">
        <div className="h-24 bg-white/80 dark:bg-stone-900/80 rounded-2xl border border-stone-200 dark:border-stone-800 animate-pulse" />
        <div className="h-12 bg-white/60 dark:bg-stone-900/60 rounded-2xl border border-stone-200 dark:border-stone-800 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
          <div className="lg:col-span-8 bg-white/70 dark:bg-stone-900/70 rounded-2xl border border-stone-200 dark:border-stone-800 animate-pulse" />
          <div className="lg:col-span-4 bg-white/70 dark:bg-stone-900/70 rounded-2xl border border-stone-200 dark:border-stone-800 animate-pulse" />
        </div>
      </main>
    </div>
  );
}
