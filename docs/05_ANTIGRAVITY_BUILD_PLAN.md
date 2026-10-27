# 05 — Antigravity Build Plan

How to drive Antigravity so it builds to *your* design instead of generating a random app.

## 0. Working agreement with the agent

1. Create the repo folder, add `/docs/*.md` and `AGENTS.md` (root) **before** the first prompt. Open the folder as your workspace.
2. If your Antigravity version reads rules from a specific folder (for example, a `.agent/` rules directory), copy `AGENTS.md` there as well. Check the Antigravity docs for your version.
3. Use the agent's **planning-style mode** for scaffolding and architecture phases, and a faster mode for small fixes. Review the agent's plan before approving each phase.
4. **One phase per task.** Don't ask for the whole app at once. Review the diff, run tests, then commit.
5. After each phase: `npm run typecheck && npm run lint && npm test`. Ask the agent to fix failures before moving on.
6. Keep screenshots of the agent's plans and results for the LinkedIn post. They are "prompt flow" evidence.
7. Never paste your Gemini key into a prompt. Put it in `.env.local` yourself.

## 1. Prerequisites you do manually

- Get a Gemini API key from Google AI Studio. Put it in `.env.local` as `GEMINI_API_KEY=...`.
- Pick a model name from AI Studio and set `GEMINI_MODEL`.
- Node 20+, and a GitHub repo created (public, as the challenge needs the link).
- Decide your deploy target (Cloud Run or Firebase) and set up the project early, so deploy isn't a last-day surprise.

## 2. Phase prompts (paste in order)

### Phase 0: Scaffold
```
Read AGENTS.md and docs/00_WALKTHROUGH.md, docs/02_ARCHITECTURE.md.
Scaffold the project exactly as the architecture folder structure describes:
Next.js App Router + TypeScript (strict) + Tailwind + Vitest + Testing Library + ESLint + Prettier.
Add npm scripts: dev, build, start, lint, typecheck, test.
Add .env.example (GEMINI_API_KEY, GEMINI_MODEL), .gitignore covering .env*, and a minimal README stub.
Do not implement features yet. Show me the plan first, then wait for approval.
```

### Phase 1: Domain core (no UI, no LLM)
```
Implement the domain layer in src/lib/domain and src/lib/config per docs/02_ARCHITECTURE.md sections 4 and 5:
types + Zod schemas, allocateBudget (largest-remainder rounding, priorities, locks, contingency),
scheduleTasks (Kahn topological sort, backward deadlines, compressed detection),
buildPlan, applyOps (with bounds checks and rejected reasons), diffPlans, generateScenarios, normalizeQuote.
Config goes in budget-shares.ts, task-templates.ts, limits.ts. Pure functions only, no React or network.
Then write thorough Vitest unit tests per docs/04_QUALITY_TESTING_SECURITY.md section 2
(include randomized sum-equals-total tests). Run them and fix until green.
```

### Phase 2: LLM layer and API routes
```
Implement src/lib/llm per docs/02_ARCHITECTURE.md section 7 and docs/03_PROMPT_STRATEGY.md:
- prompts/*.v1.md files using the exact prompt text from the doc (shared preamble + task)
- Zod schemas for each prompt's output, converted to JSON schema for Gemini structured output
- callStructured with one repair retry and typed errors
- Injectable client so tests use a fake
Implement API routes intake, change, advise, ideas, quote with Zod request/response validation, body size caps,
and an in-memory rate limiter. Never expose the API key to the client.
Write tests with the fake LLM for: valid output, repair path, double failure, oversized body, rate limit.
Do not build UI yet.
```

### Phase 3: UI shell, intake and Event Card
```
Build the UI per docs/00_WALKTHROUGH.md section 4 and docs/01_PRD.md epics A and G.
Layout: chat (left) + Event Card (right) on desktop, stacked on mobile.
Create useEventStore with localStorage persistence (Zod-parsed on load), history (cap 20) and undo.
Event Card fields are editable and show ProvenanceBadge components (text + color, never color alone).
Wire the chat to /api/intake: apply returned ops through applyOps, resolve date_hint with a deterministic parser,
and show loading, error and retry states. Add a "Load sample event" button.
Follow the accessibility checklist in docs/04. Use the frontend-design approach: a warm, celebratory but clean look,
not a default template.
```

### Phase 4: Budget and Timeline tabs
```
Build the Budget and Timeline tabs from buildPlan output.
Budget: bars per category, amounts in INR using Intl.NumberFormat('en-IN'), per-guest figures, provenance badges,
priority sliders (1-5, debounced), lock toggle, warnings panel, and a table alternative for the chart.
Timeline: tasks ordered by dependency, status chips (ready/blocked/done/overdue), deadlines, a compressed-schedule banner,
and mark-done controls that update state. Everything recomputes locally with no LLM call.
```

### Phase 5: Replan (hero feature)
```
Build the replan flow per docs/01_PRD.md epic D.
Add a persistent ChangeBar. On submit: call /api/change, apply ops to a COPY of the state, build before/after plans,
compute diffPlans and generateScenarios, then call /api/advise.
Show a modal with: the diff (budget lines before->after, tasks that moved, warnings added/resolved),
the advisor summary, and 2-3 scenario cards. Choosing a scenario applies its ops and pushes a history entry.
If /api/change returns a clarification, show it as a question and keep the plan unchanged.
Completed tasks and locked categories must survive. Add component tests and one Playwright (or RTL) hero-flow test with stubbed LLM.
```

### Phase 6: Vendors and Ideas
```
Build the Vendors tab: paste quote text -> /api/quote -> structured card with 'Not stated' for missing fields,
normalizeQuote results (per-guest, delta versus budget line), side-by-side comparison of 2-3 quotes, and questions to ask.
Then build the Ideas tab: 3 concept cards from /api/ideas, a feedback input ("too expensive", "suit kids and elders") that regenerates,
showing costLevel as a label (never rupee prices).
```

### Phase 7: Hardening
```
Go through docs/04_QUALITY_TESTING_SECURITY.md sections 4, 5 and 6 and make every checkbox true.
Add security headers in next.config, error boundaries, empty/loading/error states, and prefers-reduced-motion support.
Run lint, typecheck, tests, npm audit, and a secrets grep. Report anything you could not satisfy.
```

### Phase 8: Deploy and docs
```
Add a multi-stage Dockerfile (Next standalone) and /api/health. Write deployment steps for Cloud Run in the README.
Complete the README using docs/06_SUBMISSION_PLAYBOOK.md section 3 as the skeleton.
Do not include any secrets. Generate an architecture diagram in Mermaid inside the README.
```

## 3. Agent hygiene tips

- **Ask for a plan, then approve.** Reviewing the plan is where you catch scope creep.
- **Pin versions in prompts:** "Don't add libraries not listed in architecture without asking."
- **Browser testing:** let Antigravity's browser agent run the hero flow and capture screenshots for your video and LinkedIn post. Verify results yourself rather than trusting a pass message.
- **When the agent drifts:** point to the doc section ("Re-read docs/02 section 5.1 and fix the rounding").
- **Commit per phase** with clear messages.
- **Don't let it rewrite the engines casually.** Tests must stay green. Add "do not modify domain tests to make them pass" to your rules.

## 4. Suggested schedule

Adjust to your real deadline (check the dashboard for the exact cutoff). Roughly:

| Day | Focus |
|---|---|
| 1 | Phases 0–1 (scaffold and domain core with tests) |
| 2 | Phase 2 (LLM layer and routes) |
| 3 | Phases 3–4 (intake UI, budget, timeline) |
| 4 | Phase 5 (replan, the main event) |
| 5 | Phases 6–7 (vendors, ideas, hardening) |
| 6 | Phase 8: deploy, README, **submit attempt 1**, read the report |
| 7+ | Fix report items, record video, LinkedIn post, final submission only after the full QA script passes |

If you run behind: drop Ideas (E), keep Replan and Vendors. Never drop tests or the README.

## 5. If something breaks

| Symptom | First thing to check |
|---|---|
| Gemini returns non-JSON | Schema passed in config? Temperature too high? Repair path working? |
| Budget sum off by a few rupees | Largest-remainder rounding, and integer math only |
| Replan loses completed tasks | `taskProgress` carried through `applyOps` and `buildPlan` |
| Works locally, fails deployed | Env var set on the server? Region/network egress? Check `/api/health` |
| Evaluator can't test the app | Verify your video shows all features, and your live link works without login |
