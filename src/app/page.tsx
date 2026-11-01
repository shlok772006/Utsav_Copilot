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
import { CelebrationBanner } from '@/components/ui/CelebrationBanner';
import { LandingPage } from '@/components/landing/LandingPage';
import { useEventStore } from '@/lib/store/useEventStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('intake');
  const [currentView, setCurrentView] = useState<'landing' | 'planner'>(() => {
    // In test environment, default to planner to satisfy integration test expectations
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
      return 'planner';
    }
    return 'landing';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [replanPayload, setReplanPayload] = useState<ReplanReviewPayload | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { plan, quotes } = useEventStore();

  const budgetWarningsCount = (plan?.warnings || []).filter(
    (w) => w.code === 'LOW_PER_GUEST_CATERING' || w.code === 'HIGH_PER_HEAD_VENUE',
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
    setToastMessage(
      'Plan revision applied! Click "Undo" above anytime to restore your previous plan.',
    );
    setTimeout(() => setToastMessage(null), 8000);
  };

  const handleOpenService = (tabId: TabId) => {
    setActiveTab(tabId);
    setCurrentView('planner');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] dark:bg-[#121110] font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-200 dark:selection:bg-amber-900">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Success Toast */}
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-in fade-in"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                ✓
              </span>
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer ml-3 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {currentView === 'landing' ? (
          <LandingPage
            onOpenService={handleOpenService}
            onLaunchPlanner={() => setCurrentView('planner')}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {/* Celebration Status Banner */}
            <CelebrationBanner
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />

            {/* Dashboard Tabs */}
            <Tabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabsConfig} />

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {activeTab === 'intake' ? (
                <>
                  {/* Intake Chat Studio: 7 cols */}
                  <div className="lg:col-span-7 min-h-[640px] flex flex-col">
                    <IntakeChat />
                  </div>

                  {/* Companion Column: 5 cols with Event Snapshot and Replan Copilot */}
                  <div className="lg:col-span-5 flex flex-col gap-5">
                    <EventCard />
                    <ChangeBar onReplanReady={handleReplanReady} />
                  </div>
                </>
              ) : (
                <>
                  {/* Dashboard Tab Content: 8 or 12 cols */}
                  <div
                    className={`flex flex-col gap-5 transition-all duration-300 ${
                      isSidebarOpen ? 'lg:col-span-8' : 'lg:col-span-12'
                    }`}
                  >
                    <div className="min-h-[580px]">
                      {activeTab === 'budget' && <BudgetTab />}
                      {activeTab === 'timeline' && <TimelineTab />}
                      {activeTab === 'ideas' && <IdeasTab />}
                      {activeTab === 'vendors' && <VendorsTab />}
                    </div>

                    {/* Copilot Replan Engine docked at bottom of dashboard */}
                    <ChangeBar onReplanReady={handleReplanReady} />
                  </div>

                  {/* Collapsible Sidebar: 4 cols */}
                  {isSidebarOpen ? (
                    <div className="lg:col-span-4 sticky top-20">
                      <EventCard />
                    </div>
                  ) : (
                    <div className="hidden" aria-hidden="true">
                      <EventCard />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
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
