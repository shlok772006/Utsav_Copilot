# Phase 4: Budget & Timeline Tabs — Context & Implementation Decisions

**Phase:** Phase 4 — Budget and Timeline Tabs  
**Status:** Decisions Locked  
**Governing Documents:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md) (Section 4)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md) (Epics B & C)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 5.1 & 5.2)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2 & 4)
- [05_ANTIGRAVITY_BUILD_PLAN.md](file:///e:/PROJECTS/Utsav_Copilot/docs/05_ANTIGRAVITY_BUILD_PLAN.md) (Phase 4)

---

## 1. Core Principles & Boundaries
1. **Zero LLM Latency & Cost**: All recomputations on the Budget and Timeline tabs occur 100% locally in pure domain code (`allocateBudget`, `scheduleTasks`, `buildPlan`). No LLM calls or network requests are triggered.
2. **Provenance on Every Number**: Every rupee amount, percentage, and per-guest figure carries a `ProvenanceBadge` (`Your input`, `Derived`, `Heuristic`).
3. **Instant Interactive Feedback**:
   - Adjusting priority sliders or toggling locks immediately reallocates the budget pool with largest-remainder precision.
   - Checking a task as complete immediately evaluates topological dependencies, unblocking downstream tasks with visual cues and pushing an undo snapshot to the history stack.
4. **Accessibility First (WCAG AA)**: Semantic table alternative toggle for visual budget bars, visible focus indicators, color + icon badges, and keyboard-operable controls.

---

## 2. Component Specifications

### 2.1 Tab Navigation (`src/components/ui/Tabs.tsx`)
- Tab switcher allowing users to toggle views:
  - `Chat & Intake`
  - `Budget Breakdown`
  - `Timeline & Tasks`
  - *(Placeholders for Phase 5 & 6: `Ideas` and `Vendors`)*
- Shows visual indicators when warnings are present in Budget or Timeline.

### 2.2 Budget Tab (`src/components/budget/BudgetTab.tsx`)
- **Total Budget & Contingency Header**:
  - Displays total budget with `Your input` badge.
  - Displays 8% contingency buffer with `Derived` badge.
  - View switcher: Toggle between **Visual Bar Chart** and **Accessible Data Table**.
- **Visual Bar Breakdown**:
  - Progress bar per category with proportional percentage width.
  - Formatted INR amount (`Intl.NumberFormat('en-IN')`).
  - Per-guest figures for guest-driven categories (`venue`, `catering`, `decor`, `logistics`).
  - `ProvenanceBadge` next to each figure.
  - Priority sliders (1 to 5) per unlocked category with debounced state updates.
  - Lock toggle button:
    - 🔒 Locked: category retains its exact rupee amount while other categories rebalance around it.
    - 🔓 Unlocked: category participates in dynamic priority-weighted rebalancing.
- **Accessible Table Alternative**:
  - Full semantic `<table>` listing Category, Share %, Total Amount, Per-Guest Amount, Priority, Lock State, and Provenance.
- **Warnings Panel**:
  - Highlights active budget warnings (`LOW_PER_GUEST_CATERING`, `HIGH_PER_HEAD_VENUE`) with severity badge and recommended action.

### 2.3 Timeline Tab (`src/components/timeline/TimelineTab.tsx`)
- **Timeline Overview Header**:
  - `Days Available` countdown vs `Critical Path Days`.
  - Compressed Schedule Banner (if `plan.compressed === true`):
    - Prominently warns that days available < critical path length.
    - Highlights the longest dependent chain and tasks that must run in parallel or receive expedited bookings.
- **Filter Controls**:
  - Filter tasks by status: `All`, `Ready`, `Blocked`, `Done`, `Overdue`.
  - Filter by Category.
- **Task List (Ordered by Kahn Topological Sort)**:
  - Each task card displays:
    - Title and category icon.
    - Status chip:
      - `ready`: emerald badge
      - `blocked`: amber badge with list of unfinished dependencies
      - `done`: gray/purple badge with strikethrough title
      - `overdue`: rose/red badge
    - Duration and computed deadline (`formatDateDisplay`).
    - Interactive Mark-Done checkbox / button:
      - Checking triggers `applyOpsAction([{ op: 'complete_task', taskId }])`.
      - Pushes an undoable snapshot to history.
      - Dependent tasks immediately transition from `blocked` to `ready`.

---

## 3. Verification Gate
- Unit & Component Tests:
  - BudgetTab renders all 9 categories with INR formatting and badges.
  - Priority slider updates reallocate unlocked categories and preserve locked amounts.
  - Table alternative toggle displays all table rows with correct data.
  - TimelineTab displays compressed banner when timeline is tight.
  - Marking a task done unblocks downstream dependent tasks.
- Verification commands pass: `npm run typecheck && npm run lint && npm test`.
