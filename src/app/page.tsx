'use client';

import React from 'react';
import { Header } from '@/components/ui/Header';
import { IntakeChat } from '@/components/chat/IntakeChat';
import { EventCard } from '@/components/eventcard/EventCard';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-100 dark:bg-stone-950 font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-amber-200 dark:selection:bg-amber-900">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-[calc(100vh-8rem)]">
          {/* Left Column: Intake Chat (7 cols on lg = ~58%) */}
          <div className="lg:col-span-7 h-[650px] lg:h-full">
            <IntakeChat />
          </div>

          {/* Right Column: Live Event Card (5 cols on lg = ~42%) */}
          <div className="lg:col-span-5 h-[650px] lg:h-full">
            <EventCard />
          </div>
        </div>
      </main>
    </div>
  );
}
