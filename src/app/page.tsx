'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { IntakeChat } from '@/components/chat/IntakeChat';
import { EventCard } from '@/components/eventcard/EventCard';
import { BudgetTab } from '@/components/budget/BudgetTab';
import { TimelineTab } from '@/components/timeline/TimelineTab';
import { IdeasTab } from '@/components/ideas/IdeasTab';
import { VendorsTab } from '@/components/vendors/VendorsTab';
import { Tabs, TabId, TabItem } from '@/components/ui/Tabs';
import { ChangeBar, ReplanReviewPayload } from '@/components/replan/ChangeBar';
import { ReplanDiffModal } from '@/components/replan/ReplanDiffModal';
import { useEventStore } from '@/lib/store/useEventStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('intake');
  const [replanPayload, setReplanPayload] = useState<ReplanReviewPayload | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { plan, quotes } = useEventStore();

  const budgetWarningsCount = (plan?.warnings || []).filter(
    (w) => w.code === 'LOW_PER_GUEST_CATERING' || w.code === 'HIGH_PER_HEAD_VENUE'
  ).length;

  const tabsConfig: TabItem[] = [
    {
      id: 'intake',
      label: 'Chat & Intake',
      icon: '💬',
    },
    {
      id: 'budget',
      label: 'Budget Breakdown',
      icon: '💰',
      badge: budgetWarningsCount > 0 ? budgetWarningsCount : undefined,
      badgeType: 'warning',
    },
    {
      id: 'timeline',
      label: 'Timeline & Tasks',
      icon: '🗓️',
      badge: plan?.compressed ? '⚡' : undefined,
      badgeType: 'warning',
    },
    {
      id: 'ideas',
      label: 'Personalized Ideas',
      icon: '💡',
    },
    {
      id: 'vendors',
      label: 'Vendor Quotes',
      icon: '🧾',
      badge: quotes.length > 0 ? quotes.length : undefined,
    },
  ];

  const handleReplanReady = (payload: ReplanReviewPayload) => {
    setReplanPayload(payload);
    setIsModalOpen(true);
  };

  const handleReplanApplied = () => {
    setToastMessage('Plan revision applied! Click "Undo" above anytime to restore your previous plan.');
    setTimeout(() => setToastMessage(null), 8000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-200 dark:selection:bg-amber-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Success Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-in fade-in"
          >
            <div className="flex items-center gap-2">
              <span aria-hidden="true">✓</span>
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer ml-3"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-8rem)]">
          {/* Left Column: Tabbed Workspace & Change Bar (7 cols on lg = ~58%) */}
          <div className="lg:col-span-7 h-[740px] lg:h-full flex flex-col gap-3">
            <Tabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={tabsConfig}
            />

            <div className="flex-1 min-h-0">
              {activeTab === 'intake' && <IntakeChat />}
              {activeTab === 'budget' && <BudgetTab />}
              {activeTab === 'timeline' && <TimelineTab />}
              {activeTab === 'ideas' && <IdeasTab />}
              {activeTab === 'vendors' && <VendorsTab />}
            </div>

            {/* Always-accessible Change Bar */}
            <ChangeBar onReplanReady={handleReplanReady} />
          </div>

          {/* Right Column: Live Event Card (5 cols on lg = ~42%) */}
          <div className="lg:col-span-5 h-[740px] lg:h-full">
            <EventCard />
          </div>
        </div>
      </main>

      {/* Replan Diff & Tradeoff Options Modal */}
      <ReplanDiffModal
        payload={replanPayload}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApplied={handleReplanApplied}
      />
    </div>
  );
}
