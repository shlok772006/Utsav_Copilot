'use client';

import React from 'react';
import { TabId } from '../ui/Tabs';
import { useEventStore } from '@/lib/store/useEventStore';

interface LandingPageProps {
  onOpenService: (tabId: TabId) => void;
  onLaunchPlanner: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenService,
  onLaunchPlanner,
}) => {
  const { loadSampleEvent } = useEventStore();

  const handleLoadSampleAndLaunch = () => {
    loadSampleEvent();
    onLaunchPlanner();
  };

  const services: Array<{
    id: TabId;
    icon: string;
    title: string;
    tagline: string;
    badge: string;
    description: string;
    bulletPoints: string[];
    actionLabel: string;
    gradient: string;
  }> = [
    {
      id: 'intake',
      icon: '💬',
      title: 'Conversational Intake Assistant',
      tagline: 'Talk like family, plan like a pro',
      badge: 'Context-Aware AI',
      description:
        'Tell us about your celebration in plain Hindi or English. Our AI understands Indian family dynamics, multi-day functions, muhurat timelines, and special dietary constraints.',
      bulletPoints: [
        'Recognizes Indian currency terms (Lakh, Crore, K)',
        'Extracts dates like "in 3 months" or "next Diwali"',
        'Supports Jain, Pure Veg, and elder accessibility needs',
      ],
      actionLabel: 'Open Intake Chat',
      gradient: 'from-amber-500/10 to-orange-500/10 border-amber-500/30',
    },
    {
      id: 'budget',
      icon: '💰',
      title: 'Living Budget Breakdown Engine',
      tagline: 'Deterministic mathematical calculation',
      badge: 'Zero Guesswork',
      description:
        'Real Indian weddings require realistic ratios. Our pure TypeScript domain engine allocates across 8 core categories with per-plate catering math and protected locked lines.',
      bulletPoints: [
        'Heuristic percentage shares for Venue, Food, Decor & Photo',
        'Real-time per-guest cost analysis (e.g. ₹2,500/plate)',
        'Lock committed vendor lines to protect them during adjustments',
      ],
      actionLabel: 'Explore Budget Engine',
      gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30',
    },
    {
      id: 'timeline',
      icon: '🗓️',
      title: 'Critical-Path Timeline & Tasks',
      tagline: 'Topologically sorted vendor dependencies',
      badge: 'Lead-Time Aware',
      description:
        'Never miss a milestone. Understand which tasks block others — booking venues before appointing decorators, confirming guest lists before invitation prints.',
      bulletPoints: [
        'Countdown clock with remaining preparation days',
        'Compressed schedule warnings when deadlines are tight',
        'Mark tasks done locally to instantly unblock dependent steps',
      ],
      actionLabel: 'View Timeline & Tasks',
      gradient: 'from-sky-500/10 to-indigo-500/10 border-sky-500/30',
    },
    {
      id: 'ideas',
      icon: '💡',
      title: 'Personalized Celebration Concepts',
      tagline: 'Curated vibes without invented prices',
      badge: 'Theme Styling',
      description:
        'Three distinct aesthetic directions for your budget level. Explore heritage courtyards, candlelit garden soirées, or grand royal darbar setups with concrete first steps.',
      bulletPoints: [
        'Vibe descriptions, sensory notes, and guest comfort advice',
        'Transparent "where the money goes" budget allocation',
        'No hallucinated rupee rates — honest relative cost tiers',
      ],
      actionLabel: 'Browse Celebration Ideas',
      gradient: 'from-purple-500/10 to-pink-500/10 border-purple-500/30',
    },
    {
      id: 'vendors',
      icon: '🧾',
      title: 'Vendor Quote Analyzer & Comparator',
      tagline: 'Paste WhatsApp messages or PDF text',
      badge: 'Hidden Cost Detector',
      description:
        'Extract itemized line items, missing tax rates, payment terms, and per-guest units from messy vendor quotes. Compare them directly against your budget allocation.',
      bulletPoints: [
        'Detects missing GST, service charges, or overtime fees',
        'Automatic per-plate vs budget line difference calculation',
        'Generates 3 critical negotiation questions to ask each vendor',
      ],
      actionLabel: 'Compare Vendor Quotes',
      gradient: 'from-rose-500/10 to-amber-500/10 border-rose-500/30',
    },
  ];

  const celebrations = [
    {
      title: 'Grand Weddings & Sangeet',
      tag: 'Multi-Day Celebrations',
      desc: 'Banquets, mandap decor, choreography, baraat logistics, and bridal trousseau planning.',
      icon: '💍',
      bg: 'from-rose-900/30 to-amber-900/20',
    },
    {
      title: 'Engagements & Roka',
      tag: 'Ring Ceremonies',
      desc: 'Intimate banquet gatherings with floral ring backdrops, candid photo coverage, and family feast.',
      icon: '✨',
      bg: 'from-amber-900/30 to-yellow-900/20',
    },
    {
      title: 'Milestone Anniversaries',
      tag: 'Silver & Golden Jubilees',
      desc: '25th and 50th anniversaries with nostalgia memory walls, seated dining, and elder comfort seating.',
      icon: '🌟',
      bg: 'from-emerald-900/30 to-teal-900/20',
    },
    {
      title: 'Family Celebrations & Birthdays',
      tag: '50th Birthdays & Baby Showers',
      desc: 'Live chaat counters, retro music, customized favors, and heartfelt celebration schedules.',
      icon: '🎉',
      bg: 'from-indigo-900/30 to-purple-900/20',
    },
  ];

  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-b from-stone-900 via-stone-900/95 to-stone-950 border border-amber-500/20 p-8 sm:p-12 lg:p-16 shadow-2xl text-stone-100">
        {/* Ambient background glows */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-6 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>AI Understanding × Deterministic Math Engine</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Plan Grand Indian Celebrations with{' '}
            <span className="bg-linear-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              Absolute Clarity & Zero Guesswork
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            From 500-guest Jaipur palace weddings to intimate 25th anniversary celebrations.
            Describe your vision in natural conversation — our AI structures your needs while
            rigorous domain algorithms compute per-plate catering, critical-path timelines,
            and quote comparisons.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <button
              type="button"
              onClick={onLaunchPlanner}
              className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-stone-950 font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Start Planning Celebration</span>
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSampleAndLaunch}
              className="w-full sm:w-auto px-6 py-4 bg-stone-800/80 hover:bg-stone-700/80 border border-amber-500/30 text-amber-200 font-semibold text-sm sm:text-base rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 backdrop-blur-xs"
            >
              <span aria-hidden="true">★</span>
              <span>Try Live Demo (Silver Jubilee ₹3L)</span>
            </button>
          </div>

          {/* Honest Provenance Pillars */}
          <div className="mt-12 pt-8 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full text-center">
            <div className="p-3">
              <div className="text-amber-400 font-bold text-lg">100%</div>
              <div className="text-xs text-stone-400 mt-1">Math-Calculated Budgets</div>
            </div>
            <div className="p-3">
              <div className="text-rose-400 font-bold text-lg">₹0</div>
              <div className="text-xs text-stone-400 mt-1">Invented Rupee Prices</div>
            </div>
            <div className="p-3">
              <div className="text-emerald-400 font-bold text-lg">8 Core</div>
              <div className="text-xs text-stone-400 mt-1">Protected Expense Lines</div>
            </div>
            <div className="p-3">
              <div className="text-sky-400 font-bold text-lg">Local Only</div>
              <div className="text-xs text-stone-400 mt-1">Private & Secure Storage</div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase Section */}
      <section id="services" className="space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
            Integrated Celebration Suite
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Five Purpose-Built Services for Indian Events
          </h2>
          <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400 mt-3">
            Every tool links directly to our pure TypeScript domain engine. Click any service to jump into action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`rounded-2xl p-6 bg-white dark:bg-stone-900/90 border ${service.gradient} shadow-md flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
                    {service.icon}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    {service.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
                  {service.title}
                </h3>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-3">
                  {service.tagline}
                </p>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                  {service.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {service.bulletPoints.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-stone-700 dark:text-stone-300 flex items-start gap-2"
                    >
                      <span className="text-amber-500 font-bold" aria-hidden="true">
                        ✓
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenService(service.id)}
                className="w-full py-2.5 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-500 dark:hover:text-stone-950 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-stone-200 dark:border-stone-700"
              >
                <span>{service.actionLabel}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          ))}

          {/* Quick Start Card */}
          <div className="rounded-2xl p-6 bg-linear-to-br from-amber-600 to-rose-700 text-white shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl mb-4">
                🚀
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to Plan?</h3>
              <p className="text-xs text-amber-100 leading-relaxed mb-6">
                Launch the complete live workspace now. Load your celebration parameters, review
                mathematical allocations, unblock timeline tasks, and compare vendor quotes.
              </p>
              <div className="p-3 rounded-xl bg-black/20 text-xs space-y-1 mb-4">
                <div className="font-semibold text-amber-200">What you get instantly:</div>
                <div className="text-white/80">• Live EventCard snapshot</div>
                <div className="text-white/80">• Smart Change Bar for natural replans</div>
                <div className="text-white/80">• Full undo history</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLaunchPlanner}
              className="w-full py-3 px-4 bg-white hover:bg-amber-50 text-stone-950 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <span>Launch Full Planner Workspace</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Occasions Grid */}
      <section id="celebrations" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            Tailored to Every Indian Family Milestone
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-2">
            Each celebration type brings calibrated budget shares, task templates, and cultural sensitivity.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {celebrations.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-5 border border-stone-200 dark:border-stone-800 bg-linear-to-b ${item.bg} bg-white dark:bg-stone-900 flex flex-col justify-between`}
            >
              <div>
                <div className="text-3xl mb-3">{item.icon}</div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {item.tag}
                </span>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mt-1 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <button
                type="button"
                onClick={onLaunchPlanner}
                className="mt-4 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Plan this event <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Guarantee Section */}
      <section className="rounded-3xl p-8 sm:p-10 bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100">
              The Anti-Hallucination Engineering Standard
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
              Why Indian families rely on Utsav Copilot for high-stakes budgets:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-stone-700 dark:text-stone-300">
            <div className="p-4 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
              <div className="text-amber-600 dark:text-amber-400 font-bold text-sm mb-1">
                Code Calculates, AI Explains
              </div>
              <p className="leading-relaxed">
                The language model never performs arithmetic or dates. All rupee calculations, per-head
                metrics, and deadline countdowns run in verifiable TypeScript code.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
              <div className="text-amber-600 dark:text-amber-400 font-bold text-sm mb-1">
                Five Provenance Badges
              </div>
              <p className="leading-relaxed">
                Every number displayed is tagged: <em>Your Input</em>, <em>Derived</em>, <em>Heuristic</em>, <em>AI Estimate</em>, or <em>Vendor Quote</em>. You always know where a rupee comes from.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
              <div className="text-amber-600 dark:text-amber-400 font-bold text-sm mb-1">
                Instant Undo & Diff Modals
              </div>
              <p className="leading-relaxed">
                Replan with complete peace of mind. Every change presents an itemized side-by-side diff
                and tradeoffs before applying, backed by a persistent multi-step undo stack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="text-center py-6">
        <h2 className="text-xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 mb-4">
          Ready to Make Your Celebration Unforgettable?
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto mb-6">
          No sign-ups, no hidden paywalls. Start drafting your celebration plan in seconds.
        </p>
        <button
          type="button"
          onClick={onLaunchPlanner}
          className="px-8 py-3.5 bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
        >
          Launch Utsav Copilot Workspace →
        </button>
      </section>
    </div>
  );
};
