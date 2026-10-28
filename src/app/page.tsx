'use client';

import React, { useState } from 'react';
import { Header } from '@/components/ui/Header';
import { IntakeChat } from '@/components/chat/IntakeChat';
import { EventCard } from '@/components/eventcard/EventCard';
import { BudgetTab } from '@/components/budget/BudgetTab';
import { TimelineTab } from '@/components/timeline/TimelineTab';
import { Tabs, TabId, TabItem } from '@/components/ui/Tabs';
import { useEventStore } from '@/lib/store/useEventStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('intake');
  const { plan } = useEventStore();

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
      label: 'Tradeoffs & Ideas',
      icon: '💡',
      disabled: true,
      badge: 'Phase 5',
    },
    {
      id: 'vendors',
      label: 'Vendor Quotes',
      icon: '🧾',
      disabled: true,
      badge: 'Phase 6',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-100 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-200 dark:selection:bg-amber-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-8rem)]">
          {/* Left Column: Tabbed Workspace (7 cols on lg = ~58%) */}
          <div className="lg:col-span-7 h-[680px] lg:h-full flex flex-col gap-3">
            <Tabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={tabsConfig}
            />

            <div className="flex-1 min-h-0">
              {activeTab === 'intake' && <IntakeChat />}
              {activeTab === 'budget' && <BudgetTab />}
              {activeTab === 'timeline' && <TimelineTab />}
            </div>
          </div>

          {/* Right Column: Live Event Card (5 cols on lg = ~42%) */}
          <div className="lg:col-span-5 h-[680px] lg:h-full">
            <EventCard />
          </div>
        </div>
      </main>
    </div>
  );
}
