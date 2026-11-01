import React from 'react';
import Link from 'next/link';

/**
 * Custom 404 Not Found Page for Next.js App Router.
 * Directs lost users back to the celebration workspace.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F5] dark:bg-[#121110] p-6 text-stone-900 dark:text-stone-100">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 flex items-center justify-center text-2xl font-bold mx-auto mb-5">
          404
        </div>

        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Page Not Found
        </h1>

        <p className="text-xs text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
          The celebration planning page you are looking for does not exist or has moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          <span>← Back to Utsav Copilot</span>
        </Link>
      </div>
    </div>
  );
}
