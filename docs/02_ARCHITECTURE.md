# 02 — Architecture: Utsav Copilot

## 1. Principles

1. **LLM understands and explains. Code calculates and enforces.**
2. **The plan is a pure function of state:** `plan = buildPlan(state, today)`. Replanning is just "change state, rebuild, diff".
3. **The server is stateless.** The client holds `EventState` (localStorage) and sends it with each request. This means no database, no auth, and a smaller attack surface.
4. **Everything crossing a boundary is validated** (Zod): user input, LLM output, API responses.
5. **Secrets stay server-side.** The browser never sees the Gemini key.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | UI plus API routes in one deploy, strict typing |
| Styling | Tailwind CSS | Fast, consistent, easy responsive layout |
| Validation | Zod (+ `zod-to-json-schema`) | One schema serves runtime validation, TS types, and the LLM response schema |
| LLM | Gemini via `@google/genai`, model from `GEMINI_MODEL` env | Fits the Google ecosystem. Check AI Studio for the currently available model name and default to a fast one |
| Tests | Vitest + Testing Library (+ optional Playwright for the hero flow) | Deterministic core is very testable |
| Lint | ESLint + Prettier + `tsc --noEmit` in CI script | Code-quality signal |
| Deploy | Cloud Run (Dockerfile) or Firebase App Hosting | Google ecosystem, and the live link is required |

## 3. System diagram

```
┌────────────────────────── Browser (React) ──────────────────────────┐
│  Intake Chat · Event Card · Budget · Timeline · Ideas · Vendors     │
│  Change Bar · Replan Modal (diff + options) · History/Undo          │
│                                                                     │
│  EventState (localStorage)  ──►  buildPlan() (pure, client-side)    │
└───────────────┬─────────────────────────────────────────────────────┘
                │ fetch (JSON, validated)
┌───────────────▼───────────── Next.js API routes ────────────────────┐
│ /api/intake   /api/change   /api/advise   /api/ideas   /api/quote   │
│  • zod-validate request  • rate limit  • size caps                  │
│  • build prompt (versioned files in /prompts)                       │
│  • call Gemini (structured output)  • zod-validate response         │
│  • repair-retry once  • typed error responses                       │
└───────────────┬─────────────────────────────────────────────────────┘
                │
        ┌───────▼────────┐
        │  Gemini API    │
        └────────────────┘
```

`buildPlan` lives in a shared `lib/domain` package-free folder, so both client (instant UI updates) and server (to compute scenario facts for the advisor) use the same code. No duplicated logic.

## 4. Data model (`lib/domain/types.ts`)

```ts
export type Provenance = 'user' | 'derived' | 'heuristic' | 'ai_estimate' | 'vendor_quote';
export interface Tagged<T> { value: T; source: Provenance; note?: string }

export const CATEGORIES = [
  'venue','catering','decor','photography','attire',
  'entertainment','invitations_misc','logistics','contingency'
] as const;
export type Category = typeof CATEGORIES[number];

export type Occasion =
  'wedding_function'|'engagement'|'anniversary'|'birthday'|
  'baby_shower'|'housewarming'|'community'|'other';

export interface Constraints {
  mustHaves: string[]; avoid: string[]; dietary: string[];
  accessibility: string[]; ageMix: string[];   // e.g. "kids", "elderly"
}

export interface EventState {
  id: string;
  version: number;
  occasion?: Occasion;
  title?: string;
  city?: string;
  eventDate?: Tagged<string>;        // ISO yyyy-mm-dd
  guestCount?: Tagged<number>;
  budgetTotal?: Tagged<number>;      // INR integer
  atmosphere: string[];              // "intimate", "traditional", ...
  priorities: Record<Exclude<Category,'contingency'>, 1|2|3|4|5>; // default 3
  lockedCategories: Category[];
  constraints: Constraints;
  taskProgress: Record<string, 'done' | 'skipped'>;
  quotes: Quote[];
}

export interface BudgetLine {
  category: Category; amount: number; share: number;
  perGuest?: number; source: Provenance; locked: boolean;
}

export interface ScheduledTask {
  id: string; title: string; category: Category | 'general';
  dependsOn: string[]; durationDays: number;
  latestStart: string; deadline: string;       // ISO dates
  status: 'done' | 'skipped' | 'ready' | 'blocked' | 'overdue';
  optional: boolean; durationSource: 'heuristic';
}

export interface Plan {
  budget: BudgetLine[];
  tasks: ScheduledTask[];
  warnings: Warning[];
  daysAvailable: number; criticalPathDays: number; compressed: boolean;
}

export interface Warning {
  code: 'MISSING_REQUIRED'|'LOW_PER_GUEST_CATERING'|'COMPRESSED_SCHEDULE'|
        'OVERDUE_TASK'|'OVER_BUDGET_QUOTE'|'HIGH_PER_HEAD_VENUE';
  severity: 'info'|'warn'|'critical'; message: string; related?: string[];
}
```

## 5. Domain engines (all pure, all unit-tested)

### 5.1 Budget engine: `allocateBudget(state): BudgetLine[]`
1. Base shares come from `config/budget-shares.ts`, keyed by occasion (percentages only, not prices). Example for `anniversary`: venue 20, catering 38, decor 12, photography 8, attire 6, entertainment 6, invitations_misc 3, logistics 4 (before contingency).
2. Contingency is fixed at 8% (config) and removed first.
3. Remaining 92% is split with weight = `baseShare × priorityMultiplier(priority)`. Multipliers: 1→0.6, 2→0.8, 3→1.0, 4→1.25, 5→1.5. Normalize so shares sum to 1.
4. Locked categories keep their previous amount and the rest rebalance around them.
5. Round to whole rupees using the **largest-remainder method** so the sum equals the total exactly.
6. `perGuest = amount / guests` for venue, catering, logistics, and decor (guest-driven).
7. Provenance: totals are `user`, shares are `heuristic`, amounts are `derived`.

### 5.2 Timeline engine: `scheduleTasks(state, today): ScheduledTask[]`
1. Task templates live in `config/task-templates.ts`: `{id, title, category, dependsOn, durationDays, optionalFor?}`. Around 20 tasks, filtered by occasion (e.g., "sangeet choreography" only for wedding function).
2. Topological sort (Kahn's algorithm). A cycle throws, covered by a test.
3. Backward pass from `eventDate` computes `deadline` and `latestStart` per task, using the longest downstream chain.
4. `criticalPathDays` = longest chain. `daysAvailable = eventDate - today`. If available < critical, `compressed = true` and a `COMPRESSED_SCHEDULE` warning lists tasks to run in parallel or fast-track.
5. Status: `done/skipped` from progress, `blocked` if any dependency isn't done or skipped, `overdue` if the deadline is before today and the task isn't complete, otherwise `ready`.
6. Durations are heuristic and tagged as such.

Sample template shape:

```ts
{ id:'venue-book', title:'Book venue', category:'venue',
  dependsOn:['budget-lock','guest-list-v1','date-fix'], durationDays:7 }
{ id:'caterer-quotes', title:'Collect 3 caterer quotes', category:'catering',
  dependsOn:['guest-list-v1','venue-shortlist'], durationDays:7 }
{ id:'invites-send', title:'Send invitations', category:'invitations_misc',
  dependsOn:['venue-book','date-fix','guest-list-v1'], durationDays:3 }
```

### 5.3 Plan builder: `buildPlan(state, today): Plan`
Combines budget, timeline, and warning rules. If required fields are missing, it returns a partial plan with a `MISSING_REQUIRED` warning (no throwing).

### 5.4 Operations: `applyOps(state, ops): {state, rejected}`
The only way state changes through the AI path. Operations are a discriminated union:

```ts
export type Op =
 | { op:'set_budget'; value:number }
 | { op:'scale_budget'; factor:number }              // "dropped 50%" → 0.5
 | { op:'set_guest_count'; value:number }
 | { op:'scale_guest_count'; factor:number }
 | { op:'set_date'; value:string }
 | { op:'shift_date_days'; days:number }             // "two weeks earlier" → -14
 | { op:'set_priority'; category:Category; level:1|2|3|4|5 }
 | { op:'lock_category'; category:Category }
 | { op:'unlock_category'; category:Category }
 | { op:'add_constraint'; kind:keyof Constraints; value:string }
 | { op:'remove_constraint'; kind:keyof Constraints; value:string }
 | { op:'complete_task'; taskId:string };
```

Each op is bounds-checked (budget > 0, guests 1–2000, date not in the past, known task IDs). Invalid ops go to `rejected` with reasons, and valid ones still apply.

### 5.5 Diff: `diffPlans(before, after): PlanDiff`
Returns budget line deltas, tasks whose deadlines moved (with days shifted), status changes, and warnings added or resolved. The UI renders this directly, and the advisor prompt receives it as facts.

### 5.6 Scenario generator: `generateScenarios(state, plan): Scenario[]`
Deterministic levers, each producing `ops[]` and a computed outcome:

| Lever | Ops | Computed result |
|---|---|---|
| Trim guests 10% / 20% | `scale_guest_count` | per-guest amounts, savings in guest-driven lines |
| Rebalance toward priorities | `set_priority` on lowest-priority categories | new shares |
| Simplify low-priority category | `set_priority` to 1 | savings versus current |
| Move date later (only when compressed) | `shift_date_days` | new critical-path slack |
| Drop optional tasks | `complete_task`/skip | time saved |

Keep the 2–3 scenarios that best resolve the active warnings. Ranking is by code (fewest user-priority violations).

### 5.7 Quote normalizer: `normalizeQuote(raw, state): NormalizedQuote`
Takes LLM-extracted fields and computes `totalPrice`, `perGuest` (if units are stated), `vsBudgetLine` (delta against the plan's category amount), and flags `OVER_BUDGET_QUOTE` or missing-unit ambiguity.

## 6. API design

All routes: `POST`, JSON in/out, Zod-validated both ways, max body 20 KB, rate-limited per IP (e.g., 20 requests/min).

| Route | Input | LLM job | Output |
|---|---|---|---|
| `/api/intake` | `{state, messages[]}` | Extract fields from the latest message and choose the next 1–2 questions | `{assistantMessage, stateUpdates: Op[], missing: string[]}` |
| `/api/change` | `{state, text}` | Convert a natural-language change to ops | `{ops: Op[], clarification?: string}` |
| `/api/advise` | `{state, diff, scenarios}` | Narrate tradeoffs, rank scenarios by the user's priorities | `{summary, options:[{scenarioId, headline, why, tradeoff}]}` |
| `/api/ideas` | `{state, feedback?}` | Generate 3 concept cards | `{concepts: Concept[]}` |
| `/api/quote` | `{state, category, rawText}` | Extract quote fields, generate questions to ask | `{extraction, questions[]}` |

Error shape: `{error: {code, message, retryable}}`. Codes: `VALIDATION`, `RATE_LIMITED`, `LLM_UNAVAILABLE`, `LLM_BAD_OUTPUT`.

## 7. LLM wrapper (`lib/llm/gemini.ts`)

```
callStructured<T>(promptId, input, zodSchema, {temperature}):
  1. render prompt from /prompts/<promptId>.v<N>.md (system + task)
  2. generate with responseMimeType=application/json and the JSON schema
  3. parse + zod.safeParse
  4. on failure: ONE repair call ("your output failed validation: <errors>; return corrected JSON only")
  5. on second failure: throw LLM_BAD_OUTPUT (the UI shows a retry, state untouched)
  6. log promptId, version, latency, token counts (never log user content)
```

The Gemini client is injected, so tests substitute a fake.

## 8. Folder structure

```
utsav-copilot/
├─ AGENTS.md
├─ README.md
├─ .env.example
├─ Dockerfile
├─ docs/                      (these files)
├─ prompts/
│  ├─ intake.v1.md  change.v1.md  advise.v1.md  ideas.v1.md  quote.v1.md
├─ src/
│  ├─ app/
│  │  ├─ page.tsx  layout.tsx
│  │  └─ api/{intake,change,advise,ideas,quote}/route.ts
│  ├─ components/
│  │  ├─ chat/  eventcard/  budget/  timeline/  ideas/  vendors/
│  │  ├─ replan/ (ChangeBar, DiffView, ScenarioCards)
│  │  └─ ui/ (Badge, Button, Tabs, ProvenanceBadge ...)
│  ├─ lib/
│  │  ├─ domain/ (types, budget, timeline, plan, ops, diff, scenarios, quote)
│  │  ├─ config/ (budget-shares, task-templates, limits)
│  │  ├─ llm/ (gemini, schemas, prompts-loader)
│  │  ├─ api/ (client helpers, error mapping, rate-limit)
│  │  └─ store/ (useEventStore, persistence, history)
│  └─ test/ (fixtures, fake-llm)
├─ vitest.config.ts  tailwind.config.ts  tsconfig.json
```

## 9. State, history, undo

- `useEventStore` (Zustand or React context + reducer) holds `state` and `history: {state, label, at}[]` (cap 20).
- Every accepted change pushes a snapshot. Undo pops one.
- Persist to localStorage with a schema version and a Zod parse on load. Corrupt data means reset to empty, never a crash.
- A "Load sample event" button seeds a known good state (also used for tests and for demo safety).

## 10. Security architecture

- `GEMINI_API_KEY` is only in server env (`.env.local`, Cloud Run secret). `.env.example` has placeholders and `.gitignore` covers `.env*`.
- Input caps: chat messages ≤ 1,000 chars, pasted quotes ≤ 6,000 chars.
- Rate limiting: in-memory token bucket per IP (note in README that production would use Redis or an edge limiter).
- Prompt-injection posture: user text and pasted quotes are wrapped in delimiters and labeled as untrusted data. Outputs are schema-constrained, so injected instructions cannot call tools or change state outside the `Op` union, and ops are bounds-checked.
- Security headers via `next.config`: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.
- No PII in logs.

## 11. Performance

- `buildPlan` is O(n) on about 20 tasks, so recompute on every state change.
- Debounce slider changes. Run the LLM only on explicit user messages.
- Cache identical `/api/ideas` requests by state hash (short TTL).
- Stream is not required. Show skeleton loaders.

## 12. Accessibility

Semantic HTML, labeled inputs, visible focus, `aria-live="polite"` for chat and replan results, color is never the only signal (badges have text), contrast ≥ 4.5:1, tabs follow the ARIA tabs pattern, charts have text equivalents (table view).

## 13. Deployment

- `Dockerfile` (multi-stage, `next build` standalone) → Cloud Run, with the API key as a secret env var.
- Alternative: Firebase App Hosting.
- Health route `/api/health` for a quick liveness check.
- After deploy: confirm the live link works from an incognito window with no local env.

## 14. Key decisions log (put a trimmed version in the README)

| Decision | Alternative | Why |
|---|---|---|
| Stateless server, client-held state | Database | No auth and no PII stored, simpler, safer, faster to build |
| Ops (deltas) from the LLM | LLM returns full new state | Smaller output, bounds-checkable, no arithmetic by the LLM, easy undo and diff |
| Shares not prices | LLM or table of market prices | Avoids invented numbers and matches the organizers' warning |
| Pure `buildPlan` | Incremental mutation | Replan correctness comes for free, trivial to test |
| Scenarios computed by code | LLM proposes options | The numbers are trustworthy and options are one-tap applicable |
