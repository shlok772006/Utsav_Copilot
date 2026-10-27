# Phase 3: UI Shell, Intake Chat & Event Card — Context & Implementation Decisions

**Phase:** Phase 3 — UI Shell, Intake Chat and Event Card  
**Status:** Decisions Locked  
**Governing Documents:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md) (Section 4)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md) (Epics A & G)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Section 9)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2 & 4)
- [05_ANTIGRAVITY_BUILD_PLAN.md](file:///e:/PROJECTS/Utsav_Copilot/docs/05_ANTIGRAVITY_BUILD_PLAN.md) (Phase 3)

---

## 1. Core Principles & Boundaries
1. **Code Calculates, UI Renders**: All numbers displayed originate from deterministic code allocations (`allocateBudget`, `buildPlan`). No numbers are generated arbitrarily in React components.
2. **Provenance Transparency**: Every displayed figure displays a `ProvenanceBadge` (`Your input`, `Derived`, `Heuristic`, `AI estimate`, `Vendor quote`) with text and accessible styling (never color alone, meeting 4.5:1 contrast).
3. **Resilience & Zero Data Loss**: Failed AI requests show a clear retry prompt and never mutate or erase existing event state or user chat input. Corrupted `localStorage` data resets gracefully without crashing.
4. **Hero Demo Readiness**: Pre-seeds a "Load sample event" button with the 25th Anniversary benchmark (₹3 Lakh, 60 guests, food priority 5).

---

## 2. State Management & Persistence (`useEventStore`)

### 2.1 Zustand Store Architecture
- Store holds:
  - `state: EventState`
  - `plan: Plan | null` (automatically recomputed via `buildPlan(state, today)`)
  - `history: Array<{ state: EventState; label: string; timestamp: number }>` (capped at 20 snapshots)
  - `chatMessages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>`
  - `isGenerating: boolean`
  - `error: string | null`
- Actions:
  - `applyOpsAction(ops: Op[], label?: string)`: executes `applyOps`, pushes previous state to history, re-derives `plan`.
  - `updateField<K extends keyof EventState>(field: K, value: EventState[K])`: direct edit with history push.
  - `undo()`: pops previous state from history stack and re-derives plan.
  - `loadSampleEvent()`: loads 25th Anniversary hero state.
  - `resetEvent()`: resets to blank initial state and clears history.
- Persistence:
  - Persisted to `localStorage` under key `utsav_event_store_v1`.
  - Validated with Zod on hydration. Corrupted or invalid payload resets to clean state safely.

---

## 3. UI Components & Visual Design

### 3.1 Design Aesthetic
- Celebratory Indian event aesthetic: warm marigold, saffron, gold, and deep rose accents with clean modern typography.
- Currency formatted with `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`.
- Responsive design down to 360px viewport width.
- WCAG AA accessibility: high contrast, keyboard navigable, visible focus outlines, `aria-live="polite"` for incoming messages.

### 3.2 Component Catalog
1. `ProvenanceBadge`:
   - Visual badge displaying origin: `Your input` (purple), `Derived` (blue), `Heuristic` (amber), `AI estimate` (teal), `Vendor quote` (green).
   - Text is always visible for screen readers and high contrast.
2. `IntakeChat`:
   - Left side on desktop, top on mobile.
   - Message timeline with conversational bubbles.
   - Quick start chips:
     - "Parents' 25th Anniversary (₹3L, 60 guests)"
     - "Engagement Ceremony (₹8L, 120 guests)"
     - "50th Birthday Party (₹1.5L, 40 guests)"
   - Interactive prompt input, send button, live loading skeleton, error message with "Retry" action.
   - Date hint resolution: client-side deterministic helper resolving relative dates ("in 5 weeks" -> ISO date).
3. `EventCard`:
   - Right side on desktop, bottom on mobile.
   - Live overview of all active parameters (Occasion, Budget, Guests, Event Date, City).
   - Direct inline edit modal / inputs for quick adjustments.
   - Readiness status badge: checks if all required fields (`occasion`, `totalBudget`, `guestCount`, `eventDate`) are satisfied.
4. `Header`:
   - App title ("Utsav Copilot — उत्सव"), "Load sample event" CTA, "Undo" button (with history counter), "Reset" button.

---

## 4. Verification Gate
- Unit tests for `useEventStore`:
  - Applying ops pushes history and updates plan.
  - Undo restores previous state.
  - History cap (max 20) is enforced.
  - Corrupt localStorage load resets gracefully.
- Component tests:
  - Provenance badges render correct text and meet contrast.
  - Event Card displays live values.
  - Chat renders messages and triggers `/api/intake`.
- Full verification suite passes: `npm run typecheck && npm run lint && npm test`.
