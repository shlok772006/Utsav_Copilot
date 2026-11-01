'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root Error Boundary for Next.js App Router.
 * Catches uncaught runtime errors gracefully, preserving user experience without crashing the viewport.
 */
export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error digest safely in development
    if (process.env.NODE_ENV !== 'production') {
      // Diagnostic digest available for debugging
    }
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="min-h-screen flex items-center justify-center bg-[#FBF9F5] dark:bg-[#121110] p-6 text-stone-900 dark:text-stone-100"
    >
      <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-amber-300/60 dark:border-amber-800/60 rounded-3xl p-8 text-center shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-5 shadow-xs">
          उ
        </div>

        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Something went wrong
        </h1>

        <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
          Utsav Copilot encountered an unexpected issue while rendering your celebration workspace. Your plan data in local storage remains safe.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto px-5 py-2.5 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            ↻ Try Again
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl border border-stone-200 dark:border-stone-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
