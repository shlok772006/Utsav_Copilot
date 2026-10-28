'use client';

import React from 'react';

export type TabId = 'intake' | 'budget' | 'timeline' | 'ideas' | 'vendors';

export interface TabItem {
  id: TabId;
  label: string;
  icon: string;
  disabled?: boolean;
  badge?: number | string;
  badgeType?: 'warning' | 'info';
}

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  tabs: TabItem[];
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
  className = '',
}) => {
  return (
    <nav
      role="tablist"
      aria-label="Event Dashboard Tabs"
      className={`flex items-center gap-1.5 p-1.5 bg-stone-100 dark:bg-stone-800/60 rounded-xl border border-stone-200 dark:border-stone-700/60 overflow-x-auto ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
            onClick={() => !isDisabled && onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer select-none ${
              isActive
                ? 'bg-white dark:bg-stone-900 text-amber-900 dark:text-amber-300 shadow-xs border border-stone-200/60 dark:border-stone-700/80'
                : isDisabled
                ? 'opacity-40 cursor-not-allowed text-stone-400 dark:text-stone-500'
                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-700/50'
            }`}
          >
            <span aria-hidden="true" className="text-sm leading-none">
              {tab.icon}
            </span>
            <span>{tab.label}</span>

            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  tab.badgeType === 'warning'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                    : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
