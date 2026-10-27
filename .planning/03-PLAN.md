# Phase 3: UI Shell, Intake Chat & Event Card — Execution Plan (PLAN.md)

**Phase:** Phase 3 — UI Shell, Intake Chat and Event Card  
**Goal:** Build the interactive web UI shell featuring Zustand store with undo and localStorage persistence, the live ProvenanceBadge component, the intake chat connected to `/api/intake` with deterministic date parsing, the live Event Card with inline editing, and the celebratory responsive layout.  
**Requirements & Architecture References:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md) (Section 4)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md) (Epics A & G)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Section 9)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2 & 4)
- [03-CONTEXT.md](file:///e:/PROJECTS/Utsav_Copilot/.planning/phases/03-ui-shell/03-CONTEXT.md)

---

## Plan Overview & Waves

```
Wave 1: Store & Core UI Utilities
  ├─ Task 1.1: Currency formatting & deterministic date hint parser (format.ts, date-hint.ts)
  ├─ Task 1.2: useEventStore with history (cap 20), undo, Zod localStorage & tests
  └─ Task 1.3: ProvenanceBadge component with accessible text & contrast (ProvenanceBadge.tsx)

Wave 2: Interactive Components (Chat & Event Card)
  ├─ Task 2.1: IntakeChat component with chips, loading, retry, aria-live (IntakeChat.tsx)
  └─ Task 2.2: EventCard component with provenance badges & inline edits (EventCard.tsx)

Wave 3: Layout & App Shell Assembly
  ├─ Task 3.1: Header component with Load Sample Event, Undo, Reset (Header.tsx)
  └─ Task 3.2: Assemble responsive 2-column desktop / stacked mobile layout (src/app/page.tsx)

Wave 4: Testing & Verification
  ├─ Task 4.1: Component and store tests (store, ProvenanceBadge, EventCard)
  └─ Task 4.2: Full verification suite: npm run typecheck && npm run lint && npm test
```

---

## Detailed Tasks

### Task 1.1: Formatting & Date Hint Utilities
- **Files to create:**
  - `src/lib/ui/format.ts`:
    - `formatINR(amount: number): string` using `Intl.NumberFormat('en-IN')` with ₹ symbol.
    - `formatNumber(num: number): string` for guest counts.
    - `formatDateDisplay(isoDate: string): string` for clean human-readable date.
  - `src/lib/ui/date-hint.ts`:
    - `resolveDateHint(hint: string, today: string): string | null`
    - Deterministically parses expressions like "in 5 weeks" (+35 days), "in 2 months" (+60 days), "in 10 days" (+10 days), "15 Dec 2026", or standard date strings. Never lets LLM compute calendar math.
- **Verification:** Unit tests for formatting and date parsing.

### Task 1.2: State Store (`useEventStore`)
- **Files to create:**
  - `src/lib/store/useEventStore.ts`:
    - Zustand store with `persist` middleware in `localStorage` under `utsav_event_store_v1`.
    - Zod validation on hydration using `EventStateSchema`. Safely resets to initial state if localStorage is corrupted.
    - History snapshots stack capped at `MAX_HISTORY_SNAPSHOTS = 20`.
    - `applyOpsAction(ops: Op[], label?: string)`: runs domain `applyOps`, pushes previous state to history, recomputes plan via `buildPlan(state, today)`.
    - `updateField(key, value)`: direct state edit with history push.
    - `undo()`: pops previous state from history stack.
    - `loadSampleEvent()`: pre-seeds canonical 25th Anniversary hero state (₹3 Lakh, 60 guests, food priority 5).
    - `resetEvent()`: resets to blank initial state.
  - `src/lib/store/useEventStore.test.ts`:
    - Tests for ops application, history capping at 20, undo restoration, and corrupted data recovery.

### Task 1.3: Provenance Badge Component
- **Files to create:**
  - `src/components/ui/ProvenanceBadge.tsx`:
    - Renders badges: `Your input` (purple), `Derived` (blue), `Heuristic` (amber), `AI estimate` (teal), `Vendor quote` (green).
    - Always renders visible text alongside subtle color/icon so color is never the only signal (WCAG AA 4.5:1).

### Task 2.1: Intake Chat Component
- **Files to create:**
  - `src/components/chat/IntakeChat.tsx`:
    - Displays conversation history with `aria-live="polite"` for screen readers.
    - Quick-start chips:
      - "Parents' 25th Anniversary (₹3L, 60 guests)"
      - "Engagement Ceremony (₹8L, 120 guests)"
      - "50th Birthday Party (₹1.5L, 40 guests)"
    - Form with textarea/input, send button, active typing/generating indicator.
    - Error state with visible "Retry" button. Never loses user input on failure.
    - Submits to `/api/intake`, resolves returned `date_hint`, applies returned `ops` to `useEventStore`.

### Task 2.2: Event Card Component
- **Files to create:**
  - `src/components/eventcard/EventCard.tsx`:
    - Displays live event details: Occasion, Budget, Guests, Event Date, City, Top Priorities.
    - Shows `ProvenanceBadge` next to each figure.
    - Inline edit mode allowing the user to directly adjust any field with instant feedback.
    - Plan Readiness checklist (Occasion, Budget, Guests, Date).

### Task 3.1 & 3.2: Header & Main Shell Assembly
- **Files to create/update:**
  - `src/components/ui/Header.tsx`:
    - Brand logo and celebration emblem ("Utsav Copilot — उत्सव").
    - Action buttons: "Load sample event", "Undo" (with history count badge), "Reset".
  - `src/app/page.tsx`:
    - Replaces boilerplate with the full responsive layout:
      - Left column: `IntakeChat`
      - Right column: `EventCard`
      - Responsive down to 360px (stacks on mobile).
  - `src/app/globals.css`:
    - Warm celebratory Indian styling: deep saffron, gold accents, smooth focus rings, and high contrast.

### Task 4.1 & 4.2: Testing & Verification
- **Files to create:**
  - `src/components/ui/ProvenanceBadge.test.tsx`
  - `src/components/eventcard/EventCard.test.tsx`
  - `src/components/chat/IntakeChat.test.tsx`
- **Verification Commands:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- **Success Criteria:** 0 TypeScript errors, 0 ESLint warnings, all unit and component tests passing.

---

## Ready for Execution
Once this plan is approved, we will begin executing starting with Wave 1.
