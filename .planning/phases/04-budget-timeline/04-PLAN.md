# Phase 4: Budget & Timeline Tabs — Execution Plan (PLAN.md)

**Phase:** Phase 4 — Budget and Timeline Tabs  
**Goal:** Build the interactive Budget Breakdown and Timeline Schedule tabs, featuring live category progress bars, accessible table view, debounced priority sliders, lock toggles, compressed schedule warnings, and interactive mark-done controls that unblock downstream dependencies with 100% local calculation.  
**Requirements & Architecture References:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md) (Section 4)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md) (Epics B & C)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 5.1 & 5.2)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2 & 4)
- [04-CONTEXT.md](file:///e:/PROJECTS/Utsav_Copilot/.planning/phases/04-budget-timeline/04-CONTEXT.md)

---

## Plan Overview & Waves

```
Wave 1: Tabs Navigation & Budget Tab
  ├─ Task 1.1: Accessible Tabs navigation component (Tabs.tsx)
  ├─ Task 1.2: BudgetTab with bars, INR format, badges, priority sliders, lock toggles, table alternative (BudgetTab.tsx)
  └─ Task 1.3: BudgetTab unit tests (BudgetTab.test.tsx)

Wave 2: Timeline Tab & Dependency Interaction
  ├─ Task 2.1: TimelineTab with critical path, compressed banner, status chips, mark-done unblocking (TimelineTab.tsx)
  └─ Task 2.2: TimelineTab unit tests (TimelineTab.test.tsx)

Wave 3: Page Integration & Verification Gate
  ├─ Task 3.1: Integrate tabs into src/app/page.tsx
  └─ Task 3.2: Full suite verification: npm run typecheck && npm run lint && npm test
```

---

## Detailed Tasks

### Task 1.1: Tabs Navigation Component
- **Files to create:**
  - `src/components/ui/Tabs.tsx`:
    - Tab bar supporting active tabs: `intake` ("Chat & Intake"), `budget` ("Budget Breakdown"), `timeline` ("Timeline & Tasks"), with upcoming tabs disabled/tagged (`ideas`, `vendors`).
    - Visual warning indicator (badge count) on tabs when active warnings are present.
    - Keyboard navigation (Arrow keys, Home, End, Enter) adhering to WAI-ARIA tab pattern.

### Task 1.2: Budget Tab Component
- **Files to create:**
  - `src/components/budget/BudgetTab.tsx`:
    - Header displaying Total Budget with `Your input` badge, 8% Contingency with `Derived` badge, and view switcher (Bars vs Table).
    - **Visual Bar Breakdown**:
      - Category bars with percentage widths.
      - Formatted INR amount (`formatINR`).
      - Per-guest figures for guest-driven lines (`venue`, `catering`, `decor`, `logistics`).
      - `ProvenanceBadge` next to every number.
      - Interactive priority buttons/sliders (1 to 5).
      - Category lock toggle: freezes category amount in `lockedCategories` & `lockedBudgetLines`.
    - **Accessible Table Alternative**:
      - Semantic `<table>` with columns: Category, Share %, Amount (INR), Per Guest, Priority, Lock, Provenance.
    - **Warnings Panel**:
      - Displays active warnings (`LOW_PER_GUEST_CATERING`, `HIGH_PER_HEAD_VENUE`) with severity badge and recommended action.

### Task 1.3: Budget Tab Unit Tests
- **Files to create:**
  - `src/components/budget/BudgetTab.test.tsx`:
    - Tests rendering all 9 budget lines with INR formatting and badges.
    - Tests toggling between Bar view and Table view.
    - Tests adjusting priority and toggling category lock.
    - Tests displaying low-catering warning when catering per-guest < ₹400.

### Task 2.1: Timeline Tab Component
- **Files to create:**
  - `src/components/timeline/TimelineTab.tsx`:
    - Header displaying countdown days available vs critical path duration.
    - **Compressed Schedule Banner**:
      - Prominently rendered when `plan.compressed === true`.
      - Details available days vs critical path days and highlights bottlenecks.
    - **Filter Chips**:
      - Status filters: `All`, `Ready`, `Blocked`, `Done`, `Overdue`.
    - **Task List (Topological Order)**:
      - Title, category icon, duration, and formatted deadline (`formatDateDisplay`).
      - Status badge: `ready` (emerald), `blocked` (amber with pending dependency names), `done` (gray/strikethrough), `overdue` (rose).
      - Interactive Mark-Done checkbox:
        - Toggling updates `state.completedTasks` via store.
        - Pushes undo snapshot to history.
        - Dependent tasks immediately update to `ready`.

### Task 2.2: Timeline Tab Unit Tests
- **Files to create:**
  - `src/components/timeline/TimelineTab.test.tsx`:
    - Tests rendering task list in dependency order with status chips.
    - Tests compressed schedule banner rendering when days available < critical path.
    - Tests clicking mark-done unblocks downstream tasks.
    - Tests filtering tasks by status.

### Task 3.1: Main Page Integration
- **Files to update:**
  - `src/app/page.tsx`:
    - Incorporates `Tabs` navigation in the workspace layout.
    - Allows seamless switching between `IntakeChat`, `BudgetTab`, and `TimelineTab`.
    - Maintains live `EventCard` on the right for immediate visibility.

### Task 3.2: Full Verification Gate
- **Commands:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- **Success Criteria:** 0 TypeScript errors, 0 ESLint warnings, all unit and component tests passing (100% green).

---

## Ready for Execution
Once this plan is approved, we will begin executing starting with Wave 1.
