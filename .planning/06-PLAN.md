# Phase 6: Vendors & Ideas — Execution Plan (PLAN.md)

**Phase:** Phase 6 — Vendor Quote Comparison & Personalized Concept Cards  
**Goal:** Build the Personalized Ideas tab (3 concept cards with strictly relative cost levels, elder/kid comfort, action steps, refine bar) and the Vendor Quotes tab (paste quote modal with sample buttons, LLM extraction via `/api/quote`, pure code normalization via `normalizeQuote`, side-by-side comparison table, "Not stated" missing field tags, and questions to ask before booking).  
**Governing Documents:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md) (Sections 4 & 5)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md) (Epics E & F)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 5.7, 6)
- [03_PROMPT_STRATEGY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/03_PROMPT_STRATEGY.md) (Sections 6 & 7)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md)
- [05_ANTIGRAVITY_BUILD_PLAN.md](file:///e:/PROJECTS/Utsav_Copilot/docs/05_ANTIGRAVITY_BUILD_PLAN.md) (Phase 6)
- [06-CONTEXT.md](file:///e:/PROJECTS/Utsav_Copilot/.planning/phases/06-vendors-ideas/06-CONTEXT.md)

---

## Plan Overview & Waves

```
Wave 1: Store Extensions & Ideas Tab
  ├─ Task 1.1: Extend useEventStore with concepts & quotes state, actions, and sample quotes (useEventStore.ts)
  ├─ Task 1.2: IdeasTab with 3 concept cards, relative cost levels (no ₹ prices), and feedback refine bar (IdeasTab.tsx)
  └─ Task 1.3: IdeasTab unit tests (IdeasTab.test.tsx)

Wave 2: Quote Paste Modal & Vendors Tab
  ├─ Task 2.1: QuotePasteModal with sample buttons, /api/quote call, and normalizeQuote (QuotePasteModal.tsx)
  ├─ Task 2.2: VendorsTab with side-by-side comparison, "Not stated" chips, and questions to ask (VendorsTab.tsx)
  └─ Task 2.3: VendorsTab & QuotePasteModal unit tests (VendorsTab.test.tsx)

Wave 3: Page Integration & Verification Gate
  ├─ Task 3.1: Enable Ideas and Vendors tabs in Tabs.tsx and src/app/page.tsx
  ├─ Task 3.2: Update page.test.tsx for all 5 active dashboard tabs
  └─ Task 3.3: Verification Gate: npm run typecheck && npm run lint && npm test
```

---

## Detailed Tasks

### Task 1.1: Event Store Extension
- **Files to update:**
  - `src/lib/store/useEventStore.ts`:
    - Define `StoredQuote` type (id, category, rawText, extraction, normalized, timestamp).
    - Add `concepts: ConceptIdea[]` and `quotes: StoredQuote[]` to `EventStoreState`.
    - Add actions: `setConcepts(concepts)`, `addQuote(quote)`, `removeQuote(quoteId)`.
    - In `loadSampleEvent()`: pre-seed 2 sample caterer quotes (Annapurna Caterers and Royal Feast) with normalized figures for instant 1-click comparison.
    - In `resetEvent()`: clear concepts and quotes.

### Task 1.2: Personalized Ideas Tab Component
- **Files to create:**
  - `src/components/ideas/IdeasTab.tsx`:
    - Auto-generates initial 3 concepts on mount via `POST /api/ideas` if `concepts.length === 0` and `plan` exists.
    - Header with "Generate Concepts" trigger button and loading state.
    - **3 Concept Cards**:
      - Concept Title and Vibe description.
      - Relative Cost Level badge (`lower` in emerald, `similar` in amber, `higher` in purple) — strictly no rupee prices per AGENTS.md rule.
      - "Where the Money Goes" breakdown.
      - "Elder & Kid Comfort" notes.
      - "Risks & Watchouts".
      - "First 3 Action Steps" checklist.
    - **Refinement Bar**:
      - Input field with suggestion chips (e.g. *"More traditional"*, *"Cut decor, maximize food"*, *"Kid-friendly games"*).
      - Submit button with spinner calling `/api/ideas` with feedback.

### Task 1.3: Ideas Tab Unit Tests
- **Files to create:**
  - `src/components/ideas/IdeasTab.test.tsx`:
    - Tests rendering 3 concept cards with title, vibe, where money goes, and comfort notes.
    - Asserts NO rupee amounts (`₹`) appear in concept cards.
    - Tests cost level badges (`lower`, `similar`, `higher`).
    - Tests feedback input and regeneration call to `/api/ideas`.

### Task 2.1: Quote Paste Modal Component
- **Files to create:**
  - `src/components/vendors/QuotePasteModal.tsx`:
    - Modal dialog for adding new quotes (`role="dialog"`, accessible focus trap, Escape to close).
    - Category selector dropdown (catering, venue, decor, photography, etc.).
    - Textarea for pasting raw quote text (capped at 6,000 characters).
    - 2 Quick sample buttons:
      - *Annapurna Caterers*: ₹650/plate, 60 guests, GST 5% extra.
      - *Royal Feast Caterers*: ₹55,000 lump sum all inclusive, covers 60 people.
    - Submit button with loading spinner:
      - Calls `POST /api/quote` to extract structured fields.
      - Passes extraction through domain `normalizeQuote(raw, state, plan)`.
      - Adds `StoredQuote` to store and closes modal.

### Task 2.2: Vendor Quotes Tab Component
- **Files to create:**
  - `src/components/vendors/VendorsTab.tsx`:
    - Header with "Add Vendor Quote" button and category filter pills.
    - **Side-by-Side Comparison Table / Grid**:
      - Vendor Name (with `Vendor quote` provenance badge).
      - Total Amount (INR formatted).
      - Per-Guest Cost (INR).
      - vs Budget Line delta (`-₹X Under budget` or `+₹X Over budget`).
      - Inclusions & Exclusions list.
      - Payment Terms & Validity.
      - Missing Information: explicitly tagged as `"Not stated"` with amber chips.
      - `OVER_BUDGET_QUOTE` warning badge if quote exceeds category budget.
    - **Questions to Ask Checklist**:
      - Expandable list of curated questions to ask each vendor before booking.
    - Delete quote action with confirmation.

### Task 2.3: Vendor Quotes Unit Tests
- **Files to create:**
  - `src/components/vendors/VendorsTab.test.tsx`:
    - Tests side-by-side comparison table rendering of multiple quotes.
    - Verifies "Not stated" tag for missing fields (e.g. tax rate or cutlery).
    - Verifies `OVER_BUDGET_QUOTE` warning badge when quote exceeds budget.
    - Tests Questions to Ask list display.
    - Tests QuotePasteModal opening, sample quote loading, and submission.

### Task 3.1: Page Layout & Tabs Integration
- **Files to update:**
  - `src/components/ui/Tabs.tsx`: Remove `disabled: true` from `ideas` and `vendors` tabs.
  - `src/app/page.tsx`:
    - Mount `IdeasTab` when `activeTab === 'ideas'`.
    - Mount `VendorsTab` when `activeTab === 'vendors'`.
    - Update tab configurations and remove "Phase 6" badges.

### Task 3.2: Page Integration Tests
- **Files to update:**
  - `src/app/page.test.tsx`:
    - Test navigation to all 5 active tabs (`intake`, `budget`, `timeline`, `ideas`, `vendors`).
    - Verify all tabs render their respective views.

### Task 3.3: Verification Gate
- **Commands:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- **Success Criteria:** 0 TypeScript errors, 0 ESLint warnings, all 120+ tests green.

---

## Ready for Execution
Once approved, we will begin executing Wave 1.
