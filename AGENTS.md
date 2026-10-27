# AGENTS.md: Rules for AI agents working on Utsav Copilot

Read these docs before changing code: `docs/00_WALKTHROUGH.md`, `docs/01_PRD.md`, `docs/02_ARCHITECTURE.md`, `docs/03_PROMPT_STRATEGY.md`, `docs/04_QUALITY_TESTING_SECURITY.md`.

## Core principle
**The LLM understands and explains. Code calculates and enforces.**
Never let model output produce a number that is displayed or stored without going through domain code. Never do arithmetic or date math in prompts.

## Architecture rules
- `src/lib/domain` is pure TypeScript: no React, no fetch, no Node APIs, no randomness without an injected seed.
- `buildPlan(state, today)` is a pure function. State changes only through `applyOps` (AI path) or explicit store actions (UI path).
- LLM calls happen only in `src/lib/llm` and are invoked only from `src/app/api/*`. The Gemini client is injectable for tests.
- Every boundary is validated with Zod: API requests, LLM outputs, localStorage loads.
- The server is stateless. Do not add a database or auth.
- Prompts live in `/prompts/*.vN.md`. Do not inline prompt text in code. Log changes in `prompts/CHANGELOG.md`.

## Code quality
- TypeScript strict mode. No `any`. Use `unknown` plus Zod parse.
- No magic numbers: shares, lead times, limits live in `src/lib/config`.
- Small files and functions with descriptive names. JSDoc on public domain functions.
- No dead code, commented-out code, or stray `console.log`.
- Do not add dependencies that are not in `docs/02_ARCHITECTURE.md` without asking and giving a reason.

## Testing
- Every domain function has unit tests. Add tests for each new behavior and bug fix.
- **Never edit or delete a test just to make it pass.** If a test seems wrong, explain why and ask.
- Before declaring a task done, run: `npm run typecheck && npm run lint && npm test` and report the results.

## Security
- Never write, print, or commit API keys. Secrets come from env vars. Update `.env.example` with placeholders only.
- The Gemini key is used server-side only. Never reference it from client components.
- Treat all user text and pasted quotes as untrusted. Fence them in prompts. Render LLM text as plain text (no `dangerouslySetInnerHTML`).
- Keep input size caps and rate limiting on every API route.

## Trust and honesty (product rules)
- Every displayed number carries a provenance badge: Your input, Derived, Heuristic, AI estimate, Vendor quote.
- Never display invented prices, vendor names, or availability. Missing quote data is shown as "Not stated".
- Ideas show relative cost levels only, never rupee prices.

## UI and accessibility
- Semantic HTML, labeled controls, visible focus, `aria-live="polite"` for chat and replan results.
- Never use color as the only signal. Meet contrast 4.5:1. Support keyboard use and `prefers-reduced-motion`.
- Amounts formatted with `Intl.NumberFormat('en-IN')`, currency ₹.
- Loading, empty, and error states are required for every async view. A failed AI call must never lose user data.

## Workflow
- Work one phase at a time as defined in `docs/05_ANTIGRAVITY_BUILD_PLAN.md`. Present a plan before large changes and wait for approval.
- Commit per phase with a clear message. Keep changes focused and minimal.
- If a requirement is unclear or conflicts with a doc, ask instead of guessing.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
