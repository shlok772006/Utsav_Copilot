# Phase 5: Replan (Hero Feature ⭐) — Execution Plan (PLAN.md)

**Phase:** Phase 5 — Replan Engine, Change Bar, Diff Modal & Tradeoff Scenarios  
**Goal:** Build the complete replan user flow: an always-accessible Change Bar, natural language disruption parsing via `/api/change`, deterministic before/after diff computation (`diffPlans`), tradeoff scenario generation (`generateScenarios`), advisor narration (`/api/advise` with pure local fallback), and an accessible Before/After Diff Modal with undo capability.  
**Governing Documents:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md) (Sections 4 & 5)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md) (Epic D: Replan)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 5.4, 5.5, 5.6)
- [03_PROMPT_STRATEGY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/03_PROMPT_STRATEGY.md) (Sections 4 & 5)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md)
- [05_ANTIGRAVITY_BUILD_PLAN.md](file:///e:/PROJECTS/Utsav_Copilot/docs/05_ANTIGRAVITY_BUILD_PLAN.md) (Phase 5)
- [05-CONTEXT.md](file:///e:/PROJECTS/Utsav_Copilot/.planning/phases/05-replan/05-CONTEXT.md)

---

## Plan Overview & Waves

```
Wave 1: Change Bar & Disruption Parsing
  ├─ Task 1.1: ChangeBar component with hero quick-chip, loading state, clarification toast (ChangeBar.tsx)
  └─ Task 1.2: ChangeBar unit tests (ChangeBar.test.tsx)

Wave 2: Replan Diff Modal & Tradeoff Scenarios
  ├─ Task 2.1: ReplanDiffModal with budget deltas, schedule shifts, warnings, and scenario picker (ReplanDiffModal.tsx)
  └─ Task 2.2: ReplanDiffModal unit tests (ReplanDiffModal.test.tsx)

Wave 3: Integration, Hero Scenario Test & Verification Gate
  ├─ Task 3.1: Integrate ChangeBar and ReplanDiffModal into src/app/page.tsx
  ├─ Task 3.2: Hero Flow Integration Test (src/test/hero-flow.test.tsx)
  └─ Task 3.3: Verification Gate: npm run typecheck && npm run lint && npm test
```

---

## Detailed Tasks

### Task 1.1: Change Bar Component
- **Files to create:**
  - `src/components/replan/ChangeBar.tsx`:
    - Docked at the bottom of the left column in `page.tsx`, visible across all dashboard tabs (`intake`, `budget`, `timeline`).
    - Input field with placeholder: *"Change anything (e.g. 'Budget is now 2 lakh and event moved 2 weeks earlier')..."*.
    - Hero demo quick-suggestion chip: `"Cut budget to ₹2 Lakh & move date 2 weeks earlier"`.
    - Submit button with spinner state and `aria-busy`.
    - Handles `/api/change` call:
      - If clarification is returned: shows accessible inline clarification message (`aria-live="polite"`).
      - If ops are returned: applies ops to clone of state, runs `buildPlan`, `diffPlans`, `generateScenarios`, and calls `/api/advise`.
      - Provides pure local fallback if `/api/advise` is unavailable or slow so user data is never lost.
      - Dispatches callback with `{ diff, scenarios, advisorAdvice, proposedState, originalState }` to open modal.

### Task 1.2: Change Bar Unit Tests
- **Files to create:**
  - `src/components/replan/ChangeBar.test.tsx`:
    - Tests rendering input, submit button, and hero quick-chip.
    - Tests submitting natural language text calls `/api/change`.
    - Tests handling of `clarification` response without opening modal or modifying plan.
    - Tests error state and retry prompt on network failure.

### Task 2.1: Replan Diff Modal Component
- **Files to create:**
  - `src/components/replan/ReplanDiffModal.tsx`:
    - Modal dialog adhering to WAI-ARIA dialog pattern (`role="dialog"`, focus trap, Escape key closes).
    - **Header**: "Plan Revision & Impact Analysis" with subtitle and provenance badge.
    - **Advisor Summary Banner**: Narrated overview from Gemini (or domain fallback).
    - **Budget Deltas View**:
      - Table or list of budget categories: `Previous Amount` → `New Amount` with delta indicator (`+₹X` in green or `-₹X` in rose/amber).
      - Visual tags for locked categories that remained preserved.
    - **Timeline Shifts View**:
      - Lists tasks with moved deadlines and days shifted (e.g. `14 days earlier`).
      - Compressed timeline notice if `proposedPlan.compressed === true`.
    - **Warnings Delta View**:
      - Newly triggered warnings (`addedWarnings`) with severity badges.
      - Resolved warnings (`resolvedWarnings`) in green.
    - **Tradeoff Scenarios Section**:
      - Radio/card selector displaying 2–3 options:
        - Option A: Direct Change (raw ops as requested).
        - Option B: e.g. Trim Guests (keeps per-guest food/decor quality high).
        - Option C: e.g. Rebalance & Simplify Priorities (cuts low-priority lines).
      - Highlights `recommendedScenarioId` with an "Advisor Recommendation" badge.
    - **Action Footer**:
      - "Apply Selected Plan": calls `applyOpsAction(selectedOps, label)`, pushes to undo stack, closes modal.
      - "Discard & Keep Current Plan": closes modal without altering event store.

### Task 2.2: Replan Diff Modal Unit Tests
- **Files to create:**
  - `src/components/replan/ReplanDiffModal.test.tsx`:
    - Tests rendering advisor summary, budget deltas, shifted deadlines, and warnings.
    - Tests scenario radio selection and recommended badge highlight.
    - Tests clicking "Apply Selected Plan" updates store state and closes modal.
    - Tests clicking "Discard" leaves store state unchanged.

### Task 3.1: Page Layout Integration
- **Files to update:**
  - `src/app/page.tsx`:
    - Embeds `ChangeBar` at the bottom of the tabbed workspace column.
    - Mounts `ReplanDiffModal` controlled by active replan review state.
    - Integrates toast notification when plan is updated, highlighting the Undo button in the header.

### Task 3.2: Hero Flow Integration Test
- **Files to create:**
  - `src/test/hero-flow.test.tsx`:
    - End-to-end integration test simulating the Prompt Wars Challenge 5 winning hero scenario:
      1. Starts with seeded 25th anniversary event (₹3L, 60 guests, 5 weeks ahead).
      2. User inputs: `"Budget is now 2 lakh and the date moved two weeks earlier"`.
      3. Mocked `/api/change` and `/api/advise` fire.
      4. Diff modal appears displaying:
         - Budget dropped from ₹3,00,000 to ₹2,00,000 (-₹1,00,000).
         - Deadlines shifted by 14 days earlier.
         - 2–3 tradeoff scenario options.
      5. User selects Option B (Tradeoff) and clicks "Apply Selected Plan".
      6. Plan updates: budget is ₹2,00,000, date is shifted, locked categories survive.
      7. User clicks "Undo" in the Header: previous ₹3,00,000 plan is cleanly restored.

### Task 3.3: Full Verification Gate
- **Commands:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- **Success Criteria:** 0 TypeScript errors, 0 ESLint warnings, all 100+ tests passing (100% green).

---

## Ready for Execution
Once approved, we will begin executing Wave 1.
