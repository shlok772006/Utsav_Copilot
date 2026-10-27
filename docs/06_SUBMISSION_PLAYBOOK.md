# 06 — Submission Playbook

Required items per the session: **GitHub repo link, deployed link, video of the project, LinkedIn post** (with tool usage, architecture, prompt flow and where GenAI was used). Optional: an Instagram reel for a separate chance at a prize.

## 1. Submission strategy (three attempts, only the last counts)

| Attempt | Purpose | Rule |
|---|---|---|
| **1** | Working core (intake, budget, timeline, replan) deployed, with a basic README | Submit early to get the evaluator report |
| **2** | Fix everything in the report, complete vendors/ideas, polish | Rerun the full QA script before submitting |
| **3** | Only if you are confident it beats attempt 2 | The last attempt counts even if it's worse, so a risky change is not worth it |

Check the dashboard for the exact deadline and re-verify the live link a few hours before the cutoff.

## 2. Demo video (2.5–3.5 min, no voiceover required, but captions help)

The video is evidence that every feature works, since API credits may expire before evaluators test.

| Time | Scene | On-screen caption |
|---|---|---|
| 0:00 | Title card: "Utsav Copilot: a living plan for family celebrations" | Problem in one line |
| 0:10 | Intake chat: parents' 25th anniversary, 60 guests, ₹3 lakh, 5 weeks, food first, elderly guests | "Asks only what's missing" |
| 0:35 | Event Card fills with badges, then Budget tab (catering largest) | "Every number shows where it came from" |
| 0:55 | Move a priority slider, bars rebalance, lock a category | "Your priorities drive the split" |
| 1:10 | Timeline: dependencies, deadlines, mark a task done | "What to do next, in order" |
| 1:30 | **Change bar:** "Budget is now 2 lakh and the event moved two weeks earlier" | "No starting over" |
| 1:45 | Diff modal: budget deltas, moved tasks, compressed-schedule warning | "Shows exactly what changed" |
| 2:05 | Scenario options, pick one, plan updates, then undo | "Tradeoffs, your choice" |
| 2:25 | Vendors: paste two caterer quotes, comparison, missing fields, questions | "Never invents prices" |
| 2:50 | Ideas tab: "too expensive" feedback regenerates concepts | "Personalized, not generic" |
| 3:05 | A different event (₹80k birthday, 30 guests), plan differs | "No hardcoded demo" |
| 3:15 | End card: GitHub, live link, tech stack | |

Tips: record at 1080p, zoom the browser to 110–125%, use a clean browser profile, pre-test the exact inputs, and keep a "Load sample event" fallback.

## 3. README skeleton

```
# Utsav Copilot
One-line pitch + screenshot/GIF of the replan flow.

## Live demo & video
Links.

## The problem and the persona
Short. Meera's story.

## How this maps to the problem statement
Table: requirement → feature (budget, timeline, replan, vendors, personalization, transparency).

## Key design idea
"LLM understands and explains. Code calculates and enforces." + why.

## Architecture
Mermaid diagram, the engines, ops-based replanning, stateless server.

## Where GenAI is used (and where it isn't)
Table of the 5 prompts + what code handles instead.

## Trust & transparency
Provenance badges, no invented prices, heuristics documented and editable.

## Security
Server-side key, validation, rate limit, injection fencing, headers.

## Testing
How to run, what's covered, eval set.

## Accessibility & performance
Brief checklist results.

## Getting started
Install, env vars, run, test, deploy.

## Roadmap (P2)
Marketplace, invitations, RSVP, multi-language, accounts.

## Limitations
Honest list (heuristic shares/durations, no live availability).
```

## 4. LinkedIn post (template, make it yours)

**Hook:** "Most AI party planners give you 10 ideas. Then your budget drops 50% and you start over. I built the one that doesn't."

**Body structure:**
1. **The problem:** planning is many connected decisions, and one change breaks the rest.
2. **What I built:** Utsav Copilot, for an Indian family planning a 50–250 guest celebration (2–3 lines, one screenshot or GIF).
3. **The design call:** LLM understands and explains. Code calculates and enforces. Replanning is *state change → rebuild → diff*.
4. **Tools:** Google Antigravity (how you used planning mode and docs-first prompts), Gemini API (structured output), Next.js, Zod, Vitest, Cloud Run/Firebase. Say *why* you chose each.
5. **Prompt flow & architecture:** diagram image plus 1–2 prompt excerpts and an Antigravity plan screenshot.
6. **How prompts evolved across 3 submissions:** v1 → v2 → v3 (see doc 03 section 10, be truthful).
7. **What GenAI handled vs what I handled:** GenAI = understanding, narration, extraction. Me = budget math, dependency logic, validation, security, testing.
8. **Honest limits and what's next.**
9. Links (live, GitHub, video) and hashtags: #PromptWars #GenAI #BuildWithAI #Gemini.

Keep it to roughly 250 to 350 words with 2 to 4 images. The organizers explicitly want evidence of genuine effort, so concrete details beat adjectives.

## 5. "Make it yours" checklist

The speaker said to make sure there's *you* in the project rather than entirely AI output:

- [ ] Sketch wireframes on paper or Figma before Phase 3 and keep a photo for the LinkedIn post
- [ ] Choose the persona details from your own experience (a family event you've seen)
- [ ] Tune budget shares and task templates yourself from real experience (these are the heuristics you own)
- [ ] Write the copy and error messages in your own voice
- [ ] Name the product and design the visual identity yourself

## 6. Final pre-submission gate

- [ ] Live URL works in incognito on desktop and phone
- [ ] Hero scenario and two other scenarios pass with real Gemini
- [ ] `npm run typecheck && npm run lint && npm test` all green
- [ ] No secrets in repo or history, `.env.example` present
- [ ] README complete, with architecture diagram and the mapping table
- [ ] Repo is public with a clean commit history
- [ ] Video covers every feature and plays without login
- [ ] LinkedIn post published and the link works
- [ ] Evaluator report from earlier attempts addressed
- [ ] You have pressed Submit only after the checklist, because this attempt is the one that counts

## 7. Judge-impressing details (cheap to add)

- A visible "Assumptions" drawer listing every heuristic used, with an edit option.
- "Why this changed" one-liners in the diff (traces each delta to the user's change).
- A "next best action" card on the Timeline (the single most urgent unblocked task).
- Print-friendly checklist export.
- A tiny "AI vs Code" legend in the UI footer showing which parts are model-generated, which fits the transparency theme.
