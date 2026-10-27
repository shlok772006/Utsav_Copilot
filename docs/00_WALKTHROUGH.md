# 00 — Walkthrough: What We Are Building

**Product:** Utsav Copilot, a living event plan for Indian families.
**Challenge:** Prompt Wars Virtual, Challenge 5 (Celebration & Event Planner)

## 1. The one-paragraph pitch

Utsav Copilot helps a family planning a 50–250 guest celebration (wedding function, engagement, anniversary, birthday) go from "we have an event coming up" to "I know what to do next". It interviews them, builds a budget and a dependency-aware timeline from their real numbers, and keeps that plan alive: when the budget drops 50% or the date moves two weeks earlier, it revises the plan, shows exactly what changed, and offers tradeoff options instead of blind cuts. It also turns messy vendor quotes into side-by-side comparisons with the questions to ask before booking.

## 2. Why this design wins against the transcript

| What the organizers said | What we built |
|---|---|
| "Budget dropped 50%, event 2 weeks earlier. Does the user start from scratch?" | Replan engine with a diff view. This is our hero demo. |
| "Don't let AI invent prices" | Provenance badges on every number. We allocate the user's money and never invent market prices. |
| "Help users understand tradeoffs, not impose the AI's idea" | Scenario options computed by code, narrated by the LLM, applied in one tap. |
| "Pick one persona" | An Indian family, fixed budget, 50–250 guests. |
| "Vendor coordination, not magic booking" | Quote comparator plus clarifying-question generator. Nothing is claimed as available or confirmed. |
| "Use real inputs, not dummy data" | Everything flows from user input. 8 lakh gives an 8 lakh plan. |
| Code quality and problem-statement alignment weigh most | Pure functions, Zod schemas, tests, clean structure, README mapped to the problem statement. |

## 3. Core principle

> **The LLM understands and explains. Code calculates and enforces.**

- LLM does: parse natural language into structured data, ask smart follow-ups, extract quotes, narrate tradeoffs, write concept ideas.
- Code does: all arithmetic, budget allocation, dependency ordering, date math, validation, diffing.
- The LLM never outputs a final number that the UI displays without code having produced or verified it.

## 4. User journey (the screens)

1. **Landing / Start.** One sentence: "Tell me about your celebration." Quick-start chips (Anniversary, Engagement, Birthday).
2. **Intake chat (left) + live Event Card (right).** The assistant asks 1–2 questions at a time. As the user answers, fields fill in on the Event Card with `Your input` badges. Required fields: occasion, guests, budget, date.
3. **Plan dashboard (tabs):**
   - **Budget:** allocation bars by category, per-guest figures, priority sliders (1–5), contingency line, badges per number.
   - **Timeline:** tasks ordered by dependency with deadlines, blocked/ready/done states, and a "compressed schedule" warning if the date is too close.
   - **Ideas:** 3 concept cards personalized to atmosphere, guests and budget share. Refine with chat.
   - **Vendors:** paste quotes, get a comparison table, gaps, and questions to ask.
4. **Change bar (always visible):** type "Budget is now 4 lakh and the event moved two weeks earlier".
5. **Replan modal:** shows the diff (budget lines before and after, tasks that moved, new warnings) and 2–3 tradeoff options. The user picks one, the plan updates, and a version is saved in history (undo supported).
6. **Export:** print-friendly plan and a copyable checklist.

## 5. The hero demo scenario

1. Intake: "Our parents' 25th anniversary, 60 guests, ₹3 lakh, in 5 weeks. Food matters most, simple decor. Several elderly guests."
2. Budget, timeline, and concepts appear. Catering gets the largest share, with accessibility notes (seating, ground floor).
3. Bomb: "Budget is now ₹2 lakh and the date moved up two weeks."
4. Diff plus warnings: "Schedule compressed: the venue must be booked in 3 days." Options: (A) trim guests to 45, (B) keep guests and cut decor and photography, (C) buffet instead of plated service. The user picks B and the plan updates.
5. Paste two caterer quotes and get a comparison with questions.

## 6. Build phases (what happens in what order)

| Phase | Output | Done when |
|---|---|---|
| 0. Setup | Repo, Next.js, Tailwind, Vitest, env handling, docs in `/docs`, `AGENTS.md` | `npm run dev` and `npm test` both work |
| 1. Domain core | Types, Zod schemas, budget engine, timeline engine, diff, applyOps (all pure, tested) | Unit tests green, no UI yet |
| 2. LLM layer | Gemini client wrapper, 4 prompts, structured output, repair loop | Mocked tests pass and a manual smoke test works |
| 3. UI | Intake chat, Event Card, dashboard tabs | Full flow works with real Gemini |
| 4. Replan | Change bar, scenarios, diff modal, history/undo | Hero demo works end to end |
| 5. Vendors | Quote comparator | Two sample quotes compare correctly |
| 6. Hardening | Security, a11y, errors, loading states, rate limit | Checklist in doc 04 passes |
| 7. Ship | Deploy, README, video, LinkedIn, submission | Submission 1 in, report reviewed |

Details and paste-ready Antigravity prompts are in `05_ANTIGRAVITY_BUILD_PLAN.md`.

## 7. Document map

- `01_PRD.md`: what and why
- `02_ARCHITECTURE.md`: how, including data model, engines, API, structure
- `03_PROMPT_STRATEGY.md`: the prompts and the techniques behind them
- `04_QUALITY_TESTING_SECURITY.md`: how we score on the rubric
- `05_ANTIGRAVITY_BUILD_PLAN.md`: step-by-step agent prompts
- `06_SUBMISSION_PLAYBOOK.md`: video script, LinkedIn post, README skeleton, final checklist
- `AGENTS.md`: put at the repo root so the agent follows your rules
