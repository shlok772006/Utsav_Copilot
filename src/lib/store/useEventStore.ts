import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { addDays, formatISODate } from '../domain/timeline';
import { applyOps } from '../domain/ops';
import { buildPlan } from '../domain/plan';
import { EventState, EventStateSchema, Op, Plan } from '../domain/types';
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

export interface EventStoreState {
  state: EventState;
  plan: Plan | null;
  history: HistoryEntry[];
  chatMessages: ChatMessage[];
  isGenerating: boolean;
  error: string | null;

  // Actions
  applyOpsAction: (ops: Op[], label?: string) => void;
  updateField: <K extends keyof EventState>(field: K, value: EventState[K]) => void;
  undo: () => void;
  loadSampleEvent: () => void;
  resetEvent: () => void;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
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

export const useEventStore = create<EventStoreState>()(
  persist(
    (set, get) => ({
      state: INITIAL_EVENT_STATE,
      plan: null,
      history: [],
      chatMessages: [INITIAL_CHAT_MESSAGE],
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
