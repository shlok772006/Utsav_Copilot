# Utsav Copilot (उत्सव)

> **A Living Event Plan for Indian Family Celebrations**  
> _Prompt Wars Virtual — Challenge 5: Celebration & Event Planner_

[![Tests](https://img.shields.io/badge/Tests-126%20Passed-emerald)](https://github.com/shlok772006/Utsav_Copilot)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.4-black)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-3.5%20Flash-orange)](https://aistudio.google.com/)
[![License](https://img.shields.io/badge/License-MIT-purple)](LICENSE)

🔗 **Live Deployment**: [https://utsav-copilot.vercel.app](https://utsav-copilot.vercel.app)  
💻 **GitHub Repository**: [https://github.com/shlok772006/Utsav_Copilot](https://github.com/shlok772006/Utsav_Copilot)  
🎥 **Demo Video**: [Link to Video Walkthrough](#)

---

## 1. Chosen Vertical & Problem Alignment

_Evaluation Category: Problem Statement Alignment (High Impact)_

Indian family celebrations (weddings, milestone 25th/50th anniversaries, roka ceremonies, and sangeets for 50–250 guests) are multi-stakeholder, emotionally charged, and financially significant events.

### The Real Problem: Disruption Fragility

Existing event planning tools are either static spreadsheets or generic LLM wrappers that output 10 generic ideas. However, when real-world disruptions strike:

- The total budget drops by 30% after family discussions.
- The date moves 2 weeks earlier due to astrologer/muhurat timing.
- Key categories (like catering) must be protected, while others must bear the cut.

In standard tools, the user has to start over from scratch. **Utsav Copilot** solves this by delivering a **deterministic, living celebration plan** that recalculates budgets, task dependencies, and tradeoff options continuously without data loss.

---

## 2. Core Philosophy, Approach & Logic

_Evaluation Category: Approach and Logic (High Impact)_

### 🧠 The Core Architectural Law

> **"The LLM understands and explains. Code calculates and enforces."**

Never let a language model perform arithmetic, timeline date offsets, or financial splits. Language models hallucinate calculations, drift on totals, and fail basic constraint validation.

```
[ User Input / Disruption ]
           │
           ▼
[ Gemini 3.5 Flash (LLM) ]  ─── Emits atomic ops (e.g. scale_budget 0.67, shift_date -14d)
           │
           ▼
[ Pure TypeScript Domain Engine ] ─── Mathematically computes shares, per-plate costs & DAG
           │
           ▼
[ Living Diff Engine ] ────── Produces itemized deltas, schedule shifts & warnings
           │
           ▼
[ Gemini Advisor (Narration) ] ── Explains trade-offs using ONLY computed domain facts
```

### Ops-Based State Architecture

State mutates exclusively through atomic operations (`Op[]`):

- `set_budget`, `scale_budget`, `shift_date_days`, `lock_category`, `set_priority`, `add_constraint`.
- This guarantees pure, deterministic state transitions: `State A + Ops = State B`.
- Allows instant **1-click reversible undo history** and transparent mathematical diffing.

---

## 3. How the Solution Works (System Walkthrough)

_Evaluation Category: Architecture & Functionality (High Impact)_

The application comprises five specialized, decoupled service modules:

### 1. Conversational Intake Studio (`/api/intake`)

- Users describe their celebration vision in conversational English or Hindi (_"Our parents' 25th anniversary, around 60 people, 3 lakh budget in 5 weeks, good food, some elderly guests"_).
- The LLM extracts parameters into structured state, identifies missing required fields, and asks intelligent follow-up questions without overwhelming the family.

### 2. Deterministic Budget Engine (`src/lib/domain/budget.ts`)

- Dynamically allocates funds across 8 core celebration categories: **Venue, Catering, Decor, Photography, Attire, Entertainment, Logistics, and Invitations**.
- Features an untouchable **8% Contingency Safety Buffer** (fixed reserve for unforeseen advances).
- Computes real-time per-plate/per-guest rates (e.g., ₹2,260/head).
- Supports **Category Priority Weighting (1–5)** and **Amount Locking** (e.g., locking venue deposit while letting catering rebalance).

### 3. Critical-Path Timeline & Task DAG (`src/lib/domain/timeline.ts`)

- Manages 19 milestone tasks modeled as a true directed acyclic dependency graph.
- Calculates lead times backwards from the event date.
- Tasks dynamically transition from `Blocked` to `Ready to start` as upstream dependencies are checked off.
- Automatically flags **⚡ Compressed Timeline Warnings** if days available < critical path lead time.

### 4. Living Replan & Disruption Engine (`/api/change` & `/api/advise`)

- When disruptions occur (_"Cut budget to ₹2 Lakh & move date 2 weeks earlier"_), the engine computes an itemized diff:
  - **Budget Deltas**: Exact category-by-category cuts in INR.
  - **Schedule Shifts**: Exact deadline accelerations.
  - **Tradeoff Scenarios**: Option A (Direct cut across the board) vs Option B (Trim headcount to 51 to preserve per-plate food quality).

### 5. Vendor Quote Comparator & Extraction (`/api/quote`)

- Ingests messy WhatsApp messages or pasted PDF quotes from caterers/decorators.
- Extracts itemized line items, flags missing GST or hidden overtime charges as `"Not stated"`, and generates **3 targeted negotiation questions** for the family.

---

## 4. Key Assumptions Made

_Evaluation Category: Assumptions & Heuristics (Medium Impact)_

1. **Cultural Budget Share Benchmarks**: Base heuristic shares reflect realistic Indian urban family celebrations (Catering: ~40%, Venue: ~18%, Decor: ~10%, Photography: ~8%, Contingency: 8%).
2. **Fixed Safety Contingency**: 8% of the total budget is hard-locked as an emergency reserve and cannot be manually zeroed out by the AI.
3. **Vendor Lead Times**: Task milestones assume typical vendor booking lead times in tier-1/tier-2 Indian cities (e.g., catering bookings require at least 21 days lead time).
4. **Honest Relative Ideas**: Celebration concept recommendations use relative cost tiers (`Similar`, `Modest`, `Splurge`) rather than hallucinating exact rupee prices for vendors without quotes.

---

## 5. Evaluation Focus Areas

### 🛡️ Security & Privacy

- **Zero Client-Side Secrets**: Gemini API keys are accessed strictly on server-side Next.js route handlers. Never exposed to the browser.
- **Untrusted Input Fencing**: All user inputs and pasted vendor quotes are fenced inside `<user_input>` and `<quote_text>` tags with explicit system prompts to ignore injected instructions.
- **Strict Boundary Validation**: Every API payload and LLM generation is parsed through strict Zod schemas before being accepted.
- **Safe Rendering**: Zero use of `dangerouslySetInnerHTML`. All LLM text renders as sanitized plain text.

### ⚡ Code Quality & Maintainability

- **TypeScript Strict Mode**: Zero `any` types throughout the codebase.
- **Pure Domain Isolation**: `src/lib/domain` contains 100% pure TypeScript logic with no React, fetch, or Node dependencies, making it universally testable.
- **No Magic Numbers**: All shares, limits, and defaults reside in dedicated configuration files (`src/lib/config`).

### 🧪 Testing & Validation

- **126 Unit & Integration Tests across 24 test suites** (100% passing in Vitest).
- **Hero Flow Integration Test**: Fully verifies the end-to-end disruption lifecycle: _disruption trigger → diff modal calculation → tradeoff scenario selection → state application → undo verification_.
- **Golden Eval Suite**: 15 test cases verifying prompt extraction, negative numbers, budget scaling, and prompt injection resilience.

### ♿ Accessibility & Performance

- **WCAG 2.1 AA Compliant**: All text and badges maintain a contrast ratio >= 4.5:1.
- **Screen Reader Support**: Live updates use `aria-live="polite"` and semantic HTML (`<main>`, `<nav>`, `<aside>`, `<section>`).
- **Data Provenance**: Every displayed number carries a transparent provenance badge: `Your input`, `Derived`, `Heuristic`, or `Vendor quote`.
- **Localization**: Currency formatted using Indian numbering system (`Intl.NumberFormat('en-IN')`, ₹ Lakhs/Crores).

---

## 6. Project Structure

```
├── docs/                        # Complete architecture, PRD & prompt strategy
├── prompts/                     # Versioned system prompts (*.v1.md)
├── src/
│   ├── app/                     # Next.js App Router & serverless API routes
│   │   ├── api/                 # /intake, /change, /advise, /ideas, /quote
│   │   └── page.tsx             # Interactive planner workspace
│   ├── components/
│   │   ├── budget/              # Budget breakdown bars & tables
│   │   ├── chat/                # Intake conversational studio
│   │   ├── eventcard/           # Live Event Snapshot & parameters
│   │   ├── ideas/               # Curated celebration concepts
│   │   ├── landing/             # Cultural festive landing page
│   │   ├── replan/              # Living Replan Copilot & Diff Modal
│   │   ├── timeline/            # Critical-path task DAG & milestone cards
│   │   ├── ui/                  # Status ribbon, tabs, badges
│   │   └── vendors/             # Vendor quote comparison & parsing
│   ├── lib/
│   │   ├── config/              # Limits, shares, and lead times
│   │   ├── domain/              # Pure domain logic (budget, timeline, diff, ops)
│   │   ├── llm/                 # Gemini client, schemas & repair loops
│   │   └── store/               # Zustand event store with undo history
│   └── test/                    # Hero flow integration & golden eval suite
```

---

## 7. Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- Google Gemini API Key ([Get one at Google AI Studio](https://aistudio.google.com/))

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/shlok772006/Utsav_Copilot.git
cd Utsav_Copilot

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# 4. Start development server
npm run dev
# Open http://localhost:3000

# 5. Run full test suite & linter
npm run typecheck
npm run lint
npm test
```

---

## 8. License

Distributed under the MIT License. Built with pride for **Prompt Wars Virtual 2026**.
