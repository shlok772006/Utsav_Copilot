# Phase 1: Domain Core — Execution Plan (PLAN.md)

**Phase:** Phase 1 — Domain Core (No UI, No LLM)  
**Goal:** Implement the complete pure domain calculation engines, schemas, configuration tables, and comprehensive Vitest test suite with 100% green tests.  
**Requirements & Architecture References:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 4 & 5)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2)
- [01-CONTEXT.md](file:///e:/PROJECTS/Utsav_Copilot/.planning/phases/01-domain-core/01-CONTEXT.md)

---

## Plan Overview & Waves

```
Wave 1: Foundation (Config & Types)
  ├─ Task 1.1: Config tables & limits (limits.ts, budget-shares.ts, task-templates.ts)
  └─ Task 1.2: Zod schemas & TypeScript types (types.ts)

Wave 2: Core Engines & Unit Tests
  ├─ Task 2.1: Budget Engine with Hare-Niemeyer rounding (budget.ts + budget.test.ts)
  ├─ Task 2.2: Timeline Engine with Kahn topological sort (timeline.ts + timeline.test.ts)
  └─ Task 2.3: Plan Builder & warning rules (plan.ts + plan.test.ts)

Wave 3: Operations & Analysis Engines
  ├─ Task 3.1: Operations Engine with bounds checks (ops.ts + ops.test.ts)
  ├─ Task 3.2: Plan Diff Engine (diff.ts + diff.test.ts)
  ├─ Task 3.3: Scenario Generator (scenarios.ts + scenarios.test.ts)
  └─ Task 3.4: Quote Normalizer (quote.ts + quote.test.ts)

Wave 4: Verification & Integration
  ├─ Task 4.1: Clean barrel exports (domain/index.ts, config/index.ts)
  └─ Task 4.2: Full verification suite (typecheck, lint, test)
```

---

## Detailed Tasks

### Task 1.1: Configuration Tables & Constants
- **Files to create:**
  - `src/lib/config/limits.ts`:
    - `CONTINGENCY_PERCENT = 0.08`
    - `PRIORITY_MULTIPLIERS = { 1: 0.6, 2: 0.8, 3: 1.0, 4: 1.25, 5: 1.5 }`
    - `BUDGET_LIMITS = { min: 1000, max: 100_000_000 }`
    - `GUEST_LIMITS = { min: 1, max: 2000 }`
    - `GUEST_DRIVEN_CATEGORIES = ['venue', 'catering', 'decor', 'logistics']`
    - Thresholds: `LOW_CATERING_PER_GUEST = 400`, `HIGH_VENUE_SHARE = 0.45`, `MAX_HISTORY = 20`
  - `src/lib/config/budget-shares.ts`:
    - Base shares keyed by occasion (`wedding`, `reception`, `sangeet`, `anniversary`, `birthday`, `engagement`, `general`).
    - Normalized so 8 core categories sum to 1.0.
  - `src/lib/config/task-templates.ts`:
    - ~20 task definitions with `id`, `title`, `category`, `dependsOn`, `durationDays`, `optional`, `occasions`.
- **Verification:** Unit tests or imports compile cleanly.

### Task 1.2: Zod Schemas & TypeScript Types
- **Files to create:**
  - `src/lib/domain/types.ts`:
    - Schemas & inferred types:
      - `Occasion`, `Category`, `Provenance`, `PriorityLevel` (1..5)
      - `EventConstraints`, `EventState`
      - `BudgetLine`
      - `ScheduledTask`, `TaskStatus`
      - `Warning`, `WarningCode`, `WarningSeverity`
      - `Plan`
      - `Op` (discriminated union for 12 op kinds)
      - `PlanDiff`, `CategoryDiff`, `TaskDiff`
      - `Scenario`
      - `RawQuote`, `NormalizedQuote`
- **Verification:** `npm run typecheck`.

### Task 2.1: Budget Engine (`allocateBudget`)
- **Files to create:**
  - `src/lib/domain/budget.ts`:
    - Pure function `allocateBudget(state: EventState): BudgetLine[]`.
    - Contingency (8%) deducted first.
    - Priority weighting applied: `baseShare * priorityMultiplier`.
    - Locked category preservation: locked lines maintain exact amounts; remaining budget split across unlocked.
    - Largest-remainder (Hare-Niemeyer) rounding: guarantees exact sum equality to ₹1 with zero float drift.
    - Per-guest calculations for guest-driven categories (`venue`, `catering`, `decor`, `logistics`).
  - `src/lib/domain/budget.test.ts`:
    - 50-run randomized property test verifying $\sum \text{amounts} = \text{totalBudget}$.
    - Priority monotonicity: priority 5 gets higher allocation than priority 1.
    - Locked category immutability when other priorities change.
    - Boundary test: tiny budgets, large guest counts without `NaN` or negative values.

### Task 2.2: Timeline Engine (`scheduleTasks`)
- **Files to create:**
  - `src/lib/domain/timeline.ts`:
    - Pure function `scheduleTasks(state: EventState, today: string): { tasks: ScheduledTask[]; daysAvailable: number; criticalPathDays: number; compressed: boolean }`.
    - Occasion filtering: filter templates where `occasions` includes `state.occasion` (or undefined).
    - Kahn's algorithm for topological sorting; detects cycles and throws `CycleError`.
    - Backward pass from `eventDate`: calculates `deadline` (`eventDate - downstreamChainLength`) and `latestStart`.
    - Critical path length computation.
    - Compressed timeline detection (`daysAvailable < criticalPathDays`).
    - Status computation: `'done'`, `'blocked'`, `'overdue'`, `'ready'`.
  - `src/lib/domain/timeline.test.ts`:
    - Dependency order adherence test.
    - Cycle error throwing with cycle fixture.
    - Backward pass deadline shifting when date changes.
    - `compressed` flag validation when days available < critical path.
    - Status transitions (`blocked` → `ready` → `done`, and `overdue`).

### Task 2.3: Plan Builder (`buildPlan`)
- **Files to create:**
  - `src/lib/domain/plan.ts`:
    - Pure function `buildPlan(state: EventState, today: string): Plan`.
    - Coordinates `allocateBudget` and `scheduleTasks`.
    - Evaluates warning conditions:
      - `MISSING_REQUIRED`: if budget, guests, date, or occasion is missing.
      - `LOW_PER_GUEST_CATERING`: catering per-guest < ₹400.
      - `HIGH_PER_HEAD_VENUE`: venue per-guest > 45% of total budget per guest.
      - `COMPRESSED_SCHEDULE`: if compressed schedule detected.
      - `OVERDUE_TASK`: if any task is overdue.
    - Produces a graceful partial plan without throwing on missing required fields.
  - `src/lib/domain/plan.test.ts`:
    - Full plan building from valid state.
    - Missing required fields generates `MISSING_REQUIRED` warning.
    - Low catering per-guest warning trigger test.
    - Compressed schedule warning trigger test.

### Task 3.1: Operations Engine (`applyOps`)
- **Files to create:**
  - `src/lib/domain/ops.ts`:
    - Pure function `applyOps(state: EventState, ops: Op[]): { state: EventState; rejected: RejectedOp[] }`.
    - Validates bounds for all 12 op types:
      - `set_budget`: positive integer <= 100M.
      - `scale_budget`: factor > 0 and <= 10.
      - `set_guest_count`: 1 <= guests <= 2000.
      - `scale_guest_count`: factor > 0.
      - `set_date`: valid ISO date string `YYYY-MM-DD` not in the past relative to reference.
      - `shift_date_days`: integer days.
      - `set_priority`: valid category, priority 1..5.
      - `lock_category` / `unlock_category`: valid category.
      - `add_constraint` / `remove_constraint`: kind in constraints keys, non-empty value.
      - `complete_task`: taskId must exist in known template IDs.
    - Unrecognized or out-of-bounds ops are rejected with reason; valid ops are applied immutably.
  - `src/lib/domain/ops.test.ts`:
    - Valid application of each op.
    - Out-of-bounds rejected cases (e.g., negative budget, 5000 guests, past dates).
    - Mixed valid and invalid ops: valid ops apply, invalid are recorded in `rejected`.
    - Unknown task ID rejection.

### Task 3.2: Plan Diff Engine (`diffPlans`)
- **Files to create:**
  - `src/lib/domain/diff.ts`:
    - Pure function `diffPlans(before: Plan, after: Plan): PlanDiff`.
    - Calculates budget deltas (rupee amount and percentage shift).
    - Identifies tasks with moved deadlines (including days shifted).
    - Identifies task status transitions.
    - Identifies warnings added and warnings resolved.
  - `src/lib/domain/diff.test.ts`:
    - Identical plans produce empty diff.
    - Budget scale produces expected line deltas.
    - Date shift reflects in task deadline shifts.
    - Warning resolution/addition tracking.

### Task 3.3: Scenario Generator (`generateScenarios`)
- **Files to create:**
  - `src/lib/domain/scenarios.ts`:
    - Pure function `generateScenarios(state: EventState, plan: Plan): Scenario[]`.
    - Generates 5 deterministic levers:
      1. Trim guests (10% or 20% scale).
      2. Rebalance toward priorities (boost high priorities, economize low).
      3. Simplify non-essential categories (set lowest-priority unlocked categories to 1).
      4. Shift date later (only when `compressed` is true).
      5. Fast-track optional tasks (mark optional tasks done/skipped).
    - Selects top 2–3 scenarios that best resolve active warnings with minimal user-priority friction.
  - `src/lib/domain/scenarios.test.ts`:
    - Each generated scenario contains valid ops.
    - Applying scenario ops to state reproduces the predicted outcome.
    - Scenarios properly target active warnings.

### Task 3.4: Quote Normalizer (`normalizeQuote`)
- **Files to create:**
  - `src/lib/domain/quote.ts`:
    - Pure function `normalizeQuote(raw: RawQuote, state: EventState, plan: Plan): NormalizedQuote`.
    - Computes total price, unit price per guest, and delta against category budget line (`vsBudgetLine`).
    - Flags `OVER_BUDGET_QUOTE` if quote exceeds allocated budget.
    - Flags missing units or ambiguities.
  - `src/lib/domain/quote.test.ts`:
    - Per-plate catering quote calculation.
    - Lump-sum venue quote calculation.
    - Missing units flagging.
    - Over-budget quote detection.

### Task 4.1: Module Exports & Clean-up
- **Files to create/update:**
  - `src/lib/domain/index.ts`: Re-export all domain functions and types.
  - `src/lib/config/index.ts`: Re-export all configurations.
  - Remove temporary `scaffold.test.ts`.

### Task 4.2: Full Verification Suite
- **Commands:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- **Success Criteria:** 0 TypeScript errors, 0 ESLint warnings, all unit tests passing (100% green).

---

## Ready for Execution
Once this plan is approved, we will begin executing starting with Wave 1.
