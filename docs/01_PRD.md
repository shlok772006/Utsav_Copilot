# 01 — Product Requirements Document: Utsav Copilot

| | |
|---|---|
| Version | 1.0 |
| Context | Prompt Wars Virtual, Challenge 5, Celebration & Event Planner |
| Platform | Responsive web app (web page only, as required by the challenge) |

## 1. Problem

Planning an event is not one problem but a set of connected ones: budget, guests, venue, food, vendors, timeline. A change in one (guest count, budget, date) ripples through the others. Generic AI gives inspiration ("10 wedding ideas") but not execution. It ignores constraints, invents prices, and forces users to start over when anything changes.

## 2. Target user (single persona)

**Meera, 38, Pune.** She is organizing her parents' 25th anniversary for about 60 guests on a fixed budget. She is not a professional planner and is juggling a job. She has never compared catering quotes, doesn't know what to book first, and her budget or date might change because family opinions keep changing.

Secondary: any Indian family planning a 50–250 guest celebration (engagement, small wedding function, birthday, housewarming).

Out of scope: professional event agencies, destination weddings, corporate events.

## 3. Goals and non-goals

**Goals**
1. Turn a vague request into a budget, timeline and concepts that fit the user's real constraints.
2. Keep the plan alive: any change replans without starting over, and shows what changed.
3. Make tradeoffs explicit and let the user choose.
4. Be honest about uncertainty: every figure is labeled by where it came from.
5. Make vendor quotes comparable and tell the user what to ask.

**Non-goals**
- Booking vendors, payments, live availability, or a vendor marketplace
- User accounts and authentication
- Guest management, RSVPs, invitation sending
- Native mobile apps

## 4. User stories and acceptance criteria

### Epic A: Intake
- **A1.** As a user, I describe my event in my own words and the assistant asks only what is missing.
  - AC: the assistant asks at most 2 questions per turn and never re-asks something already answered.
  - AC: required fields (occasion, guests, budget, date) are extracted into the Event Card live.
  - AC: the user can edit any field directly in the card, and edits override AI-extracted values.
- **A2.** As a user, I can say what matters most ("food over decor").
  - AC: this maps to category priorities (1–5) shown as sliders and affects the budget split.

### Epic B: Budget
- **B1.** As a user, I see my budget allocated across categories.
  - AC: category amounts always sum to the total budget exactly (including contingency).
  - AC: higher-priority categories get a larger share, and locked categories don't change when others are adjusted.
  - AC: per-guest figures are shown for guest-driven categories (catering, attire is excluded).
  - AC: every number carries a provenance badge.
- **B2.** As a user, I get a warning when the plan looks infeasible (for example, a very low per-guest catering amount).
  - AC: warnings say "heuristic, verify with vendors". The app does not state market prices as facts.

### Epic C: Timeline
- **C1.** As a user, I see tasks ordered by dependency with deadlines counted back from the event date.
  - AC: a task is "blocked" until its dependencies are done.
  - AC: if available time is shorter than the critical path, show a "compressed schedule" warning and which tasks must run in parallel.
- **C2.** As a user, I mark tasks done and the plan reflects it (newly unblocked tasks highlight).

### Epic D: Replan (hero feature)
- **D1.** As a user, I type a change in natural language ("budget is now 2 lakh, event two weeks earlier") and the plan updates.
  - AC: the change is converted to validated operations. Ambiguous input triggers a clarifying question rather than a guess.
  - AC: a diff shows budget lines (before → after), tasks whose deadlines moved, and new or resolved warnings.
- **D2.** As a user, when the new situation forces tradeoffs, I get 2–3 options with computed impact and pick one.
  - AC: option numbers come from code, not the LLM.
  - AC: picking an option applies its operations deterministically.
- **D3.** As a user, I can undo a change (version history).
- **D4.** Completed tasks and locked categories survive a replan.

### Epic E: Personalized ideas
- **E1.** As a user, I get 3 concept cards that reflect atmosphere, guest mix (kids and elders), accessibility needs, and budget share.
  - AC: each concept states where the money goes, access/comfort notes, and a relative cost level (lower/similar/higher than my decor/food allocation), never a rupee price.
- **E2.** As a user, I refine ("too expensive", "suit kids and elders") and get adapted concepts.

### Epic F: Vendor quote comparison
- **F1.** As a user, I paste raw quote text and get structured fields (price, units covered, inclusions, exclusions, extra charges, payment terms).
  - AC: fields not stated in the quote are marked `missing`, never filled with guesses.
- **F2.** As a user, I see quotes side by side, normalized per guest where possible and compared with my budget line.
- **F3.** As a user, I get a list of questions to ask the vendor before booking.

### Epic G: Platform quality
- **G1.** Keyboard accessible, labeled controls, adequate contrast, responsive down to 360px.
- **G2.** Clear loading, error, and empty states. A failed AI call never loses user data.
- **G3.** State persists across refresh (localStorage).

## 5. Priorities (MVP cut)

| Priority | Features |
|---|---|
| **P0 (must ship)** | A1, A2, B1, C1, C2, D1, D2, D3, F1–F3, G2, G3 |
| **P1 (should)** | B2, E1, E2, G1 polish, export/print |
| **P2 (roadmap, README only)** | Vendor marketplace, invitations, RSVP, multi-event, accounts, Hindi/Marathi UI |

If time runs short, cut E (ideas) before cutting anything in D. Replan is the winning feature.

## 6. Success metrics (for the demo and judges)

- Hero scenario completes in under 60 seconds of demo time.
- 100% of budget lines sum to total across 20+ randomized test inputs.
- 0 hardcoded demo values. A different budget gives a different plan.
- Evaluator report: no secrets flagged, tests present, a11y checks pass.

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| LLM returns malformed JSON | Schema-constrained output, Zod validation, one automatic repair retry, graceful fallback message |
| LLM does arithmetic wrong | LLM never does arithmetic. It emits ops like `scale_budget {factor: 0.5}` and code computes |
| Scope creep | P2 list is frozen. New ideas go to the README roadmap |
| Gemini rate limit or quota | Server-side rate limiting, caching of identical requests, a visible retry button |
| Prompt injection via pasted quotes | Quotes are passed as delimited data and the output schema is constrained |
| Demo-day API failure | Pre-recorded video (required anyway), and an offline "sample event" button that loads a saved state |

## 8. Honesty and trust requirements

1. Every displayed number is tagged: `Your input` · `Derived` · `Heuristic` · `AI estimate` · `Vendor quote`.
2. The app never claims vendor availability, confirmed prices, or bookings.
3. Heuristics (budget share percentages, lead times) are documented in the README and editable config.
4. The user can override any assumption.

## 9. Open questions (decide in Phase 0)

- Currency display: ₹ with Indian grouping (3,00,000) via `Intl.NumberFormat('en-IN')`. Decision: yes.
- Language: English only for the MVP, with the UI structured so strings can be externalized later.
