# 04 — Quality, Testing & Security

The evaluator scores code quality, security, efficiency, testing, accessibility, and problem-statement alignment. Code quality and alignment weigh most. Only your **final submission** counts, so treat this doc as your pre-submit gate.

## 1. Rubric → evidence map

| Criterion | What we do | Where a judge sees it |
|---|---|---|
| **Problem-statement alignment** | Budget, timeline, replanning, vendors, personalization, with a transparent-assumptions design | README section "How this maps to the problem statement" |
| **Code quality** | Pure domain layer, strict TS, small files, no `any`, consistent naming, clear folder structure, config separated from logic | `src/lib/domain`, `src/lib/config` |
| **Security** | Server-side key, `.env.example`, input caps, rate limit, Zod at every boundary, security headers, injection fencing | `next.config`, `lib/api`, README "Security" |
| **Testing** | Unit tests for engines, schema tests, mocked API route tests, optional e2e | `src/**/*.test.ts`, `npm test` |
| **Accessibility** | Semantic HTML, labels, focus, aria-live, contrast, keyboard use | Lighthouse and axe results in README |
| **Efficiency** | Pure O(n) planning, debounced inputs, cached ideas, no unnecessary LLM calls | Short README note |

**Biggest known score killers** (from the session): hardcoded API keys or passwords, no tests, features that don't match the problem statement. Avoid all three.

## 2. Test plan

### Unit tests (Vitest), highest value
**Budget engine**
- Sum of all lines equals total, across 50 randomized inputs (property-style loop).
- Higher priority yields a larger share than lower priority, all else equal.
- Locked category amount is unchanged after adjusting another priority.
- Contingency is always present and fixed at the configured percentage.
- Rounding: totals like 100,001 still sum exactly (largest-remainder).
- Tiny budgets and large guest counts don't produce NaN or negative values.

**Timeline engine**
- Topological order respects all dependencies.
- A cycle in templates throws (test with a fixture).
- Deadlines move earlier when the event date moves earlier.
- `compressed` is true when days available < critical path.
- A task is `blocked` until its dependencies are done and `overdue` when its deadline has passed.
- Occasion filtering includes or excludes the correct tasks.

**Ops**
- Each op: valid case, boundary case, invalid case (rejected with reason).
- `scale_budget 0.5` halves the budget, and a date shifted into the past is rejected.
- Mixed valid and invalid ops: valid ones apply, invalid ones are reported.
- Unknown task ID is rejected.

**Diff and scenarios**
- Diff of identical plans is empty.
- After `scale_budget 0.5`, every budget line delta is negative or zero and warnings are added.
- Scenarios always contain valid ops, and applying a scenario's ops reproduces its stated outcome.

**Quote normalizer**
- Per-plate quote with guests covered gives a correct total and per-guest value.
- Missing unit info gives no computed total and a missing flag.
- Over-budget quote raises `OVER_BUDGET_QUOTE`.

### LLM layer tests (fake client)
- Valid JSON passes.
- Invalid JSON triggers exactly one repair call and then succeeds.
- Two failures throw `LLM_BAD_OUTPUT` (route returns 502 with the typed error).
- Prompt rendering includes the fenced untrusted text and the schema.

### API route tests
- Oversized body returns 413/400. Bad shape returns `VALIDATION`.
- Rate limit returns 429 after the threshold.
- Success paths with the fake LLM.

### Component tests (Testing Library)
- Event Card shows provenance badges.
- Replan modal renders the diff and applies the chosen scenario.
- Undo restores the previous state.

### E2E (optional, Playwright), hero flow
Load sample event → submit change text (LLM stubbed) → diff visible → pick option → budget updated → undo.

## 3. Manual QA script (run before each submission)

1. Fresh incognito window, live URL (not localhost).
2. Run the hero scenario with real Gemini.
3. Run 2 *different* scenarios (₹80k birthday for 30 guests; ₹12 lakh engagement for 200) to prove no hardcoding.
4. Break things: empty messages, 5,000-character message, gibberish, "ignore instructions…", offline mode, API key missing (clear error, no crash).
5. Refresh mid-flow: state persists.
6. Mobile width 360px and 768px.
7. Keyboard-only walkthrough (Tab, Enter, Esc closes modal).
8. Screen reader spot-check of chat and replan announcements.

## 4. Accessibility checklist

- [ ] All inputs have visible `<label>` (or `aria-label` for icon-only controls)
- [ ] Focus ring visible, logical tab order, modals trap and restore focus
- [ ] Chat log and replan results use `aria-live="polite"`
- [ ] Tabs follow the WAI-ARIA tabs pattern
- [ ] Color contrast ≥ 4.5:1 (check badge colors especially)
- [ ] Information is never conveyed by color alone (badges have text)
- [ ] Budget chart has a table alternative
- [ ] `lang="en"`, page title, single `<h1>`, heading hierarchy
- [ ] Respect `prefers-reduced-motion`
- [ ] Lighthouse accessibility ≥ 95 and axe finds no critical issues

## 5. Security checklist

- [ ] `grep -r "AIza"` and `grep -ri "api_key"` show no secrets in the repo or git history
- [ ] `.env.local` is gitignored, and `.env.example` has placeholders only
- [ ] Key is read only in server routes and never referenced in client code
- [ ] All request bodies Zod-validated with length limits
- [ ] LLM output Zod-validated before use
- [ ] Ops bounds-checked, with unknown fields stripped
- [ ] Rate limiting active
- [ ] Security headers set (CSP, nosniff, referrer policy, frame options)
- [ ] No `dangerouslySetInnerHTML`, and LLM text rendered as plain text
- [ ] Logs contain no user content or keys
- [ ] Dependencies audited (`npm audit`), with no unnecessary packages
- [ ] Error messages are friendly and don't leak stack traces

## 6. Code-quality checklist

- [ ] `tsc --noEmit`, ESLint, and Prettier pass with zero warnings
- [ ] No `any`. Use `unknown` plus Zod parse at boundaries
- [ ] Domain code has no React or network imports
- [ ] Config values (percentages, lead times, limits) are in `/config`, not magic numbers
- [ ] Functions are short, with descriptive names and JSDoc on public domain functions
- [ ] No dead code, commented-out blocks, or stray `console.log`
- [ ] Consistent error handling with typed results
- [ ] Components are small, with props typed
- [ ] `package.json` scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`
- [ ] Meaningful commit history (Antigravity can commit per phase)

## 7. Using the evaluator report

After submission 1, read the code-quality report in detail. It lists where the code lacked. Fix those items, then resubmit. Remember that **the last submission counts, not the best**. Never submit a final attempt with an untested change.

## 8. Efficiency notes (brief, put in README)

- Planning is a pure O(n) computation on about 20 tasks, so no server round trip is needed to recompute.
- LLM is called only on explicit user actions. Sliders recompute locally.
- Identical idea requests are cached for a short TTL.
- Prompts are small and structured. Only relevant state slices are sent.
