import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDays, formatISODate } from '../domain/timeline';
import { applyOps } from '../domain/ops';
import { buildPlan } from '../domain/plan';
import { ConceptIdea, QuoteExtractionOutput } from '../llm/schemas';
import { CoreCategory, EventState, EventStateSchema, NormalizedQuote, Op, Plan } from '../domain/types';
import { MAX_HISTORY_SNAPSHOTS } from '../config/limits';

export interface HistoryEntry {
  state: EventState;
  label: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface StoredQuote {
  id: string;
  category: CoreCategory;
  vendorName: string;
  rawText: string;
  extraction: QuoteExtractionOutput;
  normalized: NormalizedQuote;
  timestamp: number;
}

export interface EventStoreState {
  state: EventState;
  plan: Plan | null;
  history: HistoryEntry[];
  chatMessages: ChatMessage[];
  concepts: ConceptIdea[];
  quotes: StoredQuote[];
  isGenerating: boolean;
  error: string | null;

  // Actions
  applyOpsAction: (ops: Op[], label?: string) => void;
  updateField: <K extends keyof EventState>(field: K, value: EventState[K]) => void;
  undo: () => void;
  loadSampleEvent: () => void;
  resetEvent: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  setConcepts: (concepts: ConceptIdea[]) => void;
  addQuote: (quote: StoredQuote) => void;
  removeQuote: (quoteId: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
}

export function getTodayIso(): string {
  return formatISODate(new Date());
}

export const INITIAL_EVENT_STATE: EventState = {
  priorities: {
    venue: 3,
    catering: 3,
    decor: 3,
    photography: 3,
    attire: 3,
    entertainment: 3,
    invitations_misc: 3,
    logistics: 3,
  },
  lockedCategories: [],
  lockedBudgetLines: {},
  constraints: {
    dietary: [],
    accessibility: [],
    cultural: [],
    other: [],
  },
  completedTasks: [],
};

export const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  content:
    'Namaste! Welcome to Utsav Copilot. Tell me about the celebration you are planning — occasion, approximate guest count, budget, or preferred timing.',
  timestamp: Date.now(),
};

export function createSampleEventState(today: string = getTodayIso()): EventState {
  return {
    occasion: 'anniversary',
    totalBudget: 300_000,
    guestCount: 60,
    eventDate: addDays(today, 35), // 5 weeks ahead
    city: 'Pune',
    priorities: {
      venue: 3,
      catering: 5, // Food is most important
      decor: 2,    // Simple decor
      photography: 3,
      attire: 3,
      entertainment: 3,
      invitations_misc: 2,
      logistics: 3,
    },
    lockedCategories: [],
    lockedBudgetLines: {},
    constraints: {
      dietary: ['Pure Vegetarian', 'Jain food for 10 guests'],
      accessibility: ['Ground floor seating for grandparents'],
      cultural: ['Silver jubilee cake cutting ceremony'],
      other: [],
    },
    completedTasks: [],
  };
}

export const SAMPLE_QUOTES: StoredQuote[] = [
  {
    id: 'quote-sample-1',
    category: 'catering',
    vendorName: 'Annapurna Caterers (Pune)',
    rawText:
      'Annapurna Caterers: ₹650 per plate, 60 guests min, includes service staff and setup, GST 5% extra. Excludes live dessert counter.',
    extraction: {
      vendorName: 'Annapurna Caterers (Pune)',
      category: 'catering',
      totalPrice: null,
      unitPrice: 650,
      unitLabel: 'per plate',
      guestsCovered: 60,
      inclusions: ['Service staff', 'Buffet table setup', 'Basic crockery and cutlery'],
      exclusions: ['Live dessert counter', 'Beverages and bottled water'],
      additionalCharges: ['GST 5% extra on final invoice'],
      paymentTerms: '50% advance on booking, 50% after event wrap-up',
      validity: '15 days from quote date',
      missing: ['Live counter price'],
      questionsToAsk: [
        'Is bottled drinking water and ice cubes included in the per-plate rate?',
        'What is your staff-to-guest ratio on the event day?',
        'Do you provide chafing dishes and warmers or should the venue provide them?',
      ],
    },
    normalized: {
      category: 'catering',
      vendorName: 'Annapurna Caterers (Pune)',
      totalPrice: 40950,
      perGuest: 683,
      vsBudgetLine: -106636,
      isOverBudget: false,
      missingFields: [],
      warnings: [],
    },
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'quote-sample-2',
    category: 'catering',
    vendorName: 'Royal Feast Banquet Kitchens',
    rawText:
      'Royal Feast: Fixed package ₹1,65,000 all inclusive, covers up to 60 guests, live chaat and hot jalebi counters, cinematic buffet presentation, 50% advance.',
    extraction: {
      vendorName: 'Royal Feast Banquet Kitchens',
      category: 'catering',
      totalPrice: 165000,
      unitPrice: null,
      unitLabel: null,
      guestsCovered: 60,
      inclusions: [
        'Live chaat counter & hot jalebi counter',
        'Cinematic royal buffet presentation',
        'Uniformed servers and captain',
        'Premium brass & bone-china cutlery',
      ],
      exclusions: ['Extra guests beyond 60 charged at ₹2,500/plate'],
      additionalCharges: ['Taxes not specified in quote'],
      paymentTerms: '50% advance on booking, balance on event morning',
      validity: '10 days from quote date',
      missing: ['Tax rate not stated'],
      questionsToAsk: [
        'Does the ₹1,65,000 fixed price include GST, or will 18% GST be added?',
        'How early does your team need venue access for live counter setup?',
        'What happens if 5-10 unexpected guests arrive?',
      ],
    },
    normalized: {
      category: 'catering',
      vendorName: 'Royal Feast Banquet Kitchens',
      totalPrice: 165000,
      perGuest: 2750,
      vsBudgetLine: 17414,
      isOverBudget: true,
      missingFields: ['taxRate'],
      warnings: [
        {
          code: 'OVER_BUDGET_QUOTE',
          severity: 'warn',
          message:
            'Royal Feast Banquet Kitchens quote (₹1,65,000) exceeds the catering budget allocation by ₹17,414.',
          related: ['catering'],
        },
      ],
    },
    timestamp: Date.now() - 1800000,
  },
];

export const SAMPLE_CONCEPTS: ConceptIdea[] = [
  {
    name: 'Silver Jubilee Royal Feast & Nostalgia Courtyard',
    vibe: 'Warm, golden celebration honoring 25 years with traditional Pune flavors and family storytelling.',
    whereMoneyGoes: 'Largest allocation into multi-course Maharashtrian & North Indian feast with live jalebi counter; elegant marigold floral backdrop.',
    costLevel: 'similar',
    comfortNotes: 'Ground-floor banquet seating with cushioned armchairs for grandparents; separate quiet corner for elder conversations.',
    risks: 'Live counters can create bottlenecks if queue flow is not designated clearly.',
    firstThreeSteps: [
      'Confirm caterer menu tasting session for parents',
      'Reserve ground-floor banquet hall with wheelchair access',
      'Collect 25 vintage family photos for memory gallery wall',
    ],
  },
  {
    name: 'Intimate Candlelit Garden Soirée',
    vibe: 'Cozy evening with ambient fairy lights, acoustic vintage melodies, and plated dessert service.',
    whereMoneyGoes: 'Emphasis on ambient string lighting, open lawn permissions, and cinematic candid photography.',
    costLevel: 'lower',
    comfortNotes: 'Paved walkways ensure smooth walking for elders; mosquito repellent fogging done 2 hours before.',
    risks: 'Outdoor evening events need an immediate indoor monsoon/wind contingency shelter.',
    firstThreeSteps: [
      'Check garden lawn curfew timings and sound permissions',
      'Select 15 couple milestones for a short retrospective video',
      'Book acoustic guitarist or instrumentalist for dinner',
    ],
  },
  {
    name: 'Grand Darbar Heritage Gala',
    vibe: 'Lavish regal setup with royal Rajasthani shamiana, brass flower urli decorations, and live Shehnai / flute welcome.',
    whereMoneyGoes: 'Higher decor share with traditional brass artifacts, heavy marigold floral chandeliers, and live musicians.',
    costLevel: 'higher',
    comfortNotes: 'Wide central aisles for easy navigation; reserved front-row sofa seating for parents and elderly relatives.',
    risks: 'High decor complexity requires at least 8 hours of prior venue setup time.',
    firstThreeSteps: [
      'Shortlist heritage style banquet lawns with early setup access',
      'Review decorator portfolio for authentic brass & fabric work',
      'Coordinate color-coordinated ethnic attire theme for close family',
    ],
  },
];

export const useEventStore = create<EventStoreState>()(
  persist(
    (set, get) => ({
      state: INITIAL_EVENT_STATE,
      plan: null,
      history: [],
      chatMessages: [INITIAL_CHAT_MESSAGE],
      concepts: [],
      quotes: [],
      isGenerating: false,
      error: null,

      applyOpsAction: (ops: Op[], label = 'AI Update') => {
        const { state, history } = get();
        const today = getTodayIso();
        const { state: nextState } = applyOps(state, ops, today);

        const newHistory: HistoryEntry[] = [
          { state, label, timestamp: Date.now() },
          ...history,
        ].slice(0, MAX_HISTORY_SNAPSHOTS);

        const newPlan = buildPlan(nextState, today);
        set({
          state: nextState,
          plan: newPlan,
          history: newHistory,
        });
      },

      updateField: (field, value) => {
        const { state, history } = get();
        const today = getTodayIso();
        const nextState: EventState = {
          ...state,
          [field]: value,
        };

        const newHistory: HistoryEntry[] = [
          { state, label: `Updated ${String(field)}`, timestamp: Date.now() },
          ...history,
        ].slice(0, MAX_HISTORY_SNAPSHOTS);

        const newPlan = buildPlan(nextState, today);
        set({
          state: nextState,
          plan: newPlan,
          history: newHistory,
        });
      },

      undo: () => {
        const { history } = get();
        if (history.length === 0) return;

        const [previous, ...remainingHistory] = history;
        const today = getTodayIso();
        const newPlan = buildPlan(previous.state, today);

        set({
          state: previous.state,
          plan: newPlan,
          history: remainingHistory,
        });
      },

      loadSampleEvent: () => {
        const { state, history } = get();
        const today = getTodayIso();
        const sampleState = createSampleEventState(today);

        const newHistory: HistoryEntry[] = [
          { state, label: 'Loaded Sample Event', timestamp: Date.now() },
          ...history,
        ].slice(0, MAX_HISTORY_SNAPSHOTS);

        const newPlan = buildPlan(sampleState, today);
        set({
          state: sampleState,
          plan: newPlan,
          history: newHistory,
          concepts: SAMPLE_CONCEPTS,
          quotes: SAMPLE_QUOTES,
          chatMessages: [
            INITIAL_CHAT_MESSAGE,
            {
              id: `sample-user-${Date.now()}`,
              role: 'user',
              content:
                "Our parents' 25th anniversary, around 60 people, 3 lakh budget in 5 weeks. Food is most important, simple decor. Some elderly guests.",
              timestamp: Date.now(),
            },
            {
              id: `sample-bot-${Date.now()}`,
              role: 'assistant',
              content:
                "Wonderful milestone! I have structured your ₹3 Lakh anniversary celebration for 60 guests in Pune, prioritizing catering quality (₹2,500/guest) and ground-floor accessibility for elders. Review your plan details on the right.",
              timestamp: Date.now() + 100,
            },
          ],
        });
      },

      resetEvent: () => {
        set({
          state: INITIAL_EVENT_STATE,
          plan: null,
          history: [],
          chatMessages: [INITIAL_CHAT_MESSAGE],
          concepts: [],
          quotes: [],
          error: null,
        });
      },

      addChatMessage: (role, content) => {
        set((prev) => ({
          chatMessages: [
            ...prev.chatMessages,
            { id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, role, content, timestamp: Date.now() },
          ],
        }));
      },

      setConcepts: (concepts) => set({ concepts }),

      addQuote: (quote) =>
        set((prev) => ({
          quotes: [quote, ...prev.quotes.filter((q) => q.id !== quote.id)],
        })),

      removeQuote: (quoteId) =>
        set((prev) => ({
          quotes: prev.quotes.filter((q) => q.id !== quoteId),
        })),

      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'utsav_event_store_v1',
      storage: createJSONStorage(() => localStorage),
      // Safe hydration with Zod parse to prevent crashes on corrupted storage
      onRehydrateStorage: () => (hydratedState) => {
        if (!hydratedState) return;
        const parseResult = EventStateSchema.safeParse(hydratedState.state);
        if (!parseResult.success) {
          hydratedState.state = INITIAL_EVENT_STATE;
          hydratedState.plan = null;
        } else {
          hydratedState.plan = buildPlan(parseResult.data, getTodayIso());
        }
      },
    }
  )
);
