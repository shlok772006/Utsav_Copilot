# Phase 1: Domain Core — Context & Implementation Decisions

**Phase:** Phase 1 — Domain Core (No UI, No LLM)  
**Status:** Decisions Locked  
**Governing Documents:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 4 & 5)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2)
- [05_ANTIGRAVITY_BUILD_PLAN.md](file:///e:/PROJECTS/Utsav_Copilot/docs/05_ANTIGRAVITY_BUILD_PLAN.md) (Phase 1)

---

## 1. Core Principles & Boundaries
1. **Purity**: All code in `src/lib/domain` and `src/lib/config` is 100% pure TypeScript.
   - No React hooks, no DOM, no fetch, no Node-only modules (fs/process), no global mutable state.
   - No unseeded randomness. All date calculations require explicit `today: string` (ISO `YYYY-MM-DD`).
2. **LLM & UI Isolation**: Phase 1 contains zero LLM calls and zero React components.
3. **Zod at Boundaries**: All core entities have runtime Zod schemas and derived TypeScript types.
4. **Exact Precision**: Number calculations must never produce floating-point budget totals that fail to sum up.

---

## 2. Locked Domain Taxonomies & Data Structures

### 2.1 Occasions
- `'wedding'`
- `'reception'`
- `'sangeet'`
- `'anniversary'`
- `'birthday'`
- `'engagement'`
- `'general'`

### 2.2 Expense Categories (8 core + 1 contingency)
- `venue` (guest-driven)
- `catering` (guest-driven)
- `decor` (guest-driven)
- `photography` (fixed)
- `attire` (fixed)
- `entertainment` (fixed)
- `invitations_misc` (fixed)
- `logistics` (guest-driven)
- `contingency` (fixed 8% buffer)

### 2.3 Provenance Badges
- `'user'`: Directly supplied by user input
- `'derived'`: Calculated deterministically by domain logic
- `'heuristic'`: Default rules of thumb from config
- `'ai'`: Estimated by LLM (used in later phases)
- `'vendor'`: Extracted from vendor quotes

---

## 3. Engine Implementation Specifications

### 3.1 Budget Engine (`allocateBudget`)
- **Contingency**: 8% contingency (`CONTINGENCY_PERCENT = 0.08` in `config/limits.ts`) removed upfront from total budget.
- **Base Shares**: Keyed by occasion in `src/lib/config/budget-shares.ts` (percentages sum to 100% of remaining 92%).
- **Priority Multipliers**:
  - Level 1: `0.6`
  - Level 2: `0.8`
  - Level 3: `1.0` (default)
  - Level 4: `1.25`
  - Level 5: `1.5`
- **Weight Calculation**: `weight = baseShare * priorityMultiplier(priority)`. Re-normalize across unlocked categories.
- **Locked Categories**:
  - Categories in `state.lockedCategories` retain their exact previous rupee amount.
  - Remaining pool = `totalBudget - contingency - sum(locked amounts)`.
  - Rebalance remaining pool across unlocked categories according to normalized weights.
- **Rounding (Largest-Remainder / Hare-Niemeyer Method)**:
  - Calculate exact decimal allocations: `decimalShare = total * share`.
  - Initial integer floor: `Math.floor(decimalShare)`.
  - Distribute leftover rupees one by one to categories with largest fractional remainders.
  - Guarantees: $\sum \text{BudgetLine.amount} = \text{totalBudget}$ exact to ₹1 with zero drift.
- **Per-Guest Amounts**:
  - Populated for guest-driven categories (`venue`, `catering`, `decor`, `logistics`): `Math.round(amount / guests)`.

### 3.2 Timeline Engine (`scheduleTasks`)
- **Template Catalog**: `src/lib/config/task-templates.ts` with ~20 canonical milestone tasks.
- **Occasion Filtering**: Each task template has optional `occasions?: Occasion[]` filter (e.g. Sangeet choreography only for wedding/sangeet).
- **Topological Sorting**:
  - Kahn's algorithm (in-degree tracking + queue).
  - Throws descriptive `CycleError` if cyclic dependency is introduced in templates.
- **Backward Pass (Critical Path & Deadlines)**:
  - Working backward from `eventDate` in calendar days.
  - `deadline` = eventDate minus downstream chain length.
  - `latestStart` = `deadline - durationDays`.
  - `criticalPathDays` = longest dependent chain from start to event.
- **Compressed Schedule Detection**:
  - `daysAvailable` = calendar days between `today` and `eventDate`.
  - If `daysAvailable < criticalPathDays`, set `compressed = true` and emit `COMPRESSED_SCHEDULE` warning.
- **Task Status Determination**:
  - `'done'`: Task ID is in `state.completedTasks`.
  - `'blocked'`: Any task in `dependsOn` is not marked `'done'`.
  - `'overdue'`: Not done AND `deadline < today`.
  - `'ready'`: Not done, all dependencies done, and `deadline >= today`.

### 3.3 Plan Builder (`buildPlan`)
- Pure function: `buildPlan(state: EventState, today: string): Plan`
- Validates required inputs (`occasion`, `totalBudget`, `guestCount`, `eventDate`).
- If inputs missing, produces partial plan with `'MISSING_REQUIRED'` warning without crashing.
- Evaluates domain warnings:
  - `'MISSING_REQUIRED'`: missing budget, guest count, or date.
  - `'LOW_PER_GUEST_CATERING'`: catering per-guest < ₹400.
  - `'HIGH_PER_HEAD_VENUE'`: venue per-guest > 45% of total budget per guest.
  - `'COMPRESSED_SCHEDULE'`: daysAvailable < criticalPathDays.
  - `'OVERDUE_TASK'`: any task with status `'overdue'`.

### 3.4 Operations Engine (`applyOps`)
- Pure function: `applyOps(state: EventState, ops: Op[]): { state: EventState; rejected: RejectedOp[] }`
- Supported `Op` types:
  1. `set_budget`: `value > 0`, `value <= 100_000_000`
  2. `scale_budget`: `factor > 0`, `factor <= 10`
  3. `set_guest_count`: `1 <= value <= 2000`
  4. `scale_guest_count`: `factor > 0`
  5. `set_date`: valid ISO string `YYYY-MM-DD`
  6. `shift_date_days`: integer days
  7. `set_priority`: category valid, level in `[1, 2, 3, 4, 5]`
  8. `lock_category`: category valid, adds to `lockedCategories`
  9. `unlock_category`: category valid, removes from `lockedCategories`
  10. `add_constraint`: kind in `['dietary', 'accessibility', 'cultural', 'other']`, value non-empty
  11. `remove_constraint`: kind, value
  12. `complete_task`: taskId must exist in known template IDs
- Invalid ops are rejected with descriptive reason; valid ops still apply sequentially.

### 3.5 Diff Engine (`diffPlans`)
- Pure function: `diffPlans(before: Plan, after: Plan): PlanDiff`
- Calculates:
  - Budget deltas per category (`deltaAmount`, `deltaPercent`).
  - Shifted tasks with days moved.
  - Task status changes.
  - Warnings added vs resolved.

### 3.6 Scenario Generator (`generateScenarios`)
- Produces 2–3 deterministic mitigation scenarios:
  1. *Trim Guest Count*: Scale guests by 0.85 / 0.90 to lower per-guest load.
  2. *Rebalance Priorities*: Boost highest priorities and economize low-priority categories.
  3. *Simplify Non-Essentials*: Set low-priority categories to level 1.
  4. *Extend Timeline*: Shift event date forward when compressed.
  5. *Fast-track Tasks*: Mark optional or parallel tasks complete.
- Ranks scenarios by warning resolution and least disruption to locked user preferences.

### 3.7 Quote Normalizer (`normalizeQuote`)
- Normalizes vendor quote input against category budget line.
- Computes total price, unit price (per guest), delta against allocated category budget.
- Flags `OVER_BUDGET_QUOTE` if quote exceeds allocated budget line.

---

## 4. Verification & Quality Gates
- **Typecheck**: `npm run typecheck` passes with zero errors.
- **Lint**: `npm run lint` passes cleanly.
- **Vitest Unit Tests**:
  - `allocateBudget`: 50 randomized iterations verifying sum-equals-total, priority scaling, locked retention.
  - `scheduleTasks`: Kahn topological order, cycle error, backward pass deadlines, compressed warning.
  - `applyOps`: Valid, boundary, and rejected cases for all op variants.
  - `diffPlans`: Identity diff, delta calculations, added/resolved warnings.
  - `normalizeQuote`: Per-guest calculations, over-budget detection, missing field handling.
