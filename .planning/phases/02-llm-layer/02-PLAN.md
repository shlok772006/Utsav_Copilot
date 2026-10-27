# Phase 2: LLM Layer & API Routes — Execution Plan (PLAN.md)

**Phase:** Phase 2 — LLM Layer and API Routes (No UI)  
**Goal:** Implement the external prompt catalog, Zod-to-JSON schemas, structured LLM wrapper with 1 repair retry and client injection, 5 secure API routes with body caps and rate limiting, and comprehensive unit/golden eval tests.  
**Requirements & Architecture References:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 6 & 7)
- [03_PROMPT_STRATEGY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/03_PROMPT_STRATEGY.md)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2)
- [02-CONTEXT.md](file:///e:/PROJECTS/Utsav_Copilot/.planning/phases/02-llm-layer/02-CONTEXT.md)

---

## Plan Overview & Waves

```
Wave 1: Prompts & Schemas
  ├─ Task 1.1: 5 Prompt template files with shared preamble & changelog (prompts/*.v1.md)
  ├─ Task 1.2: Zod LLM output schemas & JSON Schema conversions (src/lib/llm/schemas.ts)
  └─ Task 1.3: Prompt loader and template fencing interpolation (src/lib/llm/prompts-loader.ts)

Wave 2: LLM Client & Structured Call with Repair Loop
  ├─ Task 2.1: LlmClient abstraction & FakeLlmClient (client.ts, fake-client.ts)
  ├─ Task 2.2: GeminiClient implementing @google/genai (gemini-client.ts)
  ├─ Task 2.3: callStructured with 1 repair retry & tests (call-structured.ts, call-structured.test.ts)

Wave 3: API Middleware & Endpoints
  ├─ Task 3.1: Security helpers: in-memory IP rate limiter & body caps (rate-limit.ts, api-errors.ts)
  ├─ Task 3.2: /api/intake endpoint (src/app/api/intake/route.ts)
  ├─ Task 3.3: /api/change endpoint (src/app/api/change/route.ts)
  ├─ Task 3.4: /api/advise endpoint (src/app/api/advise/route.ts)
  ├─ Task 3.5: /api/ideas endpoint (src/app/api/ideas/route.ts)
  └─ Task 3.6: /api/quote endpoint (src/app/api/quote/route.ts)

Wave 4: Testing & Verification
  ├─ Task 4.1: API route tests: valid flow, 400 validation, 413 body cap, 429 rate limit
  ├─ Task 4.2: Golden eval test set (evals/golden.test.ts covering 15 rubric cases)
  └─ Task 4.3: Full verification suite: npm run typecheck && npm run lint && npm test
```

---

## Detailed Tasks

### Task 1.1: Prompt Template Files
- **Files to create:**
  - `prompts/intake.v1.md`: System preamble + extraction of facts into relative ops, next 1-2 questions, `readyToPlan` flag, `date_hint`.
  - `prompts/change.v1.md`: System preamble + relative operation parsing (`scale_budget`, `shift_date_days`, `lock_category`, etc.) or single `clarification`.
  - `prompts/advise.v1.md`: System preamble + tradeoff narration from computed `diff` and `scenarios`.
  - `prompts/ideas.v1.md`: System preamble + 3 concept cards with relative `costLevel` ("lower" | "similar" | "higher") and comfort/risk notes.
  - `prompts/quote.v1.md`: System preamble + vendor quote field extraction with nulls for missing fields and 5-8 concrete follow-up questions.
  - `prompts/CHANGELOG.md`: Log of prompt versions and purposes.
- **Verification:** Markdown files exist with correct prompt text matching `03_PROMPT_STRATEGY.md`.

### Task 1.2: Output Schemas & JSON Schema Conversion
- **Files to create:**
  - `src/lib/llm/schemas.ts`:
    - `IntakeOutputSchema`, `IntakeOutput`
    - `ChangeOutputSchema`, `ChangeOutput`
    - `AdviseOutputSchema`, `AdviseOutput`
    - `IdeasOutputSchema`, `IdeasOutput`
    - `QuoteExtractionOutputSchema`, `QuoteExtractionOutput`
    - Helper `getJsonSchema(zodSchema)` using `zod-to-json-schema`.
- **Verification:** Unit tests parse valid and invalid payloads.

### Task 1.3: Prompt Loader & Fencer
- **Files to create:**
  - `src/lib/llm/prompts-loader.ts`:
    - Reads prompt file from `prompts/${promptId}.v1.md`.
    - Enforces untrusted input fencing inside `<user_input>` or `<quote_text>` XML tags.
    - Interpolates JSON context (state, diff, scenarios, etc.).
- **Verification:** Unit tests verify correct variable substitution and tag fencing.

### Task 2.1 & 2.2: LLM Client Abstraction & Gemini Integration
- **Files to create:**
  - `src/lib/llm/client.ts`: Interface `LlmClient` with `generateStructured(prompt, schema, options): Promise<string>`.
  - `src/lib/llm/fake-client.ts`: Test implementation of `LlmClient` supporting queued responses and error simulation.
  - `src/lib/llm/gemini-client.ts`: Production implementation using `@google/genai` using `GEMINI_API_KEY` and `GEMINI_MODEL`.
- **Verification:** TypeScript compiles cleanly.

### Task 2.3: `callStructured` with 1 Repair Retry
- **Files to create:**
  - `src/lib/llm/call-structured.ts`:
    - Executes prompt via `client.generateStructured`.
    - Parses JSON and validates against Zod schema.
    - If initial parse/validation fails, performs **ONE repair retry** with validation error feedback.
    - If second attempt fails, throws typed `LlmBadOutputError`.
    - Supports custom client injection for tests.
  - `src/lib/llm/call-structured.test.ts`:
    - Test 1: Valid output succeeds on first try.
    - Test 2: Invalid JSON triggers repair call and succeeds on second try.
    - Test 3: Double failure throws `LlmBadOutputError`.
- **Verification:** `npx vitest run src/lib/llm/call-structured.test.ts`.

### Task 3.1: API Security Middleware
- **Files to create:**
  - `src/lib/api/rate-limit.ts`: In-memory sliding window rate limiter (20 req / 60s per IP).
  - `src/lib/api/api-errors.ts`: Typed error formatting helper (`VALIDATION`, `RATE_LIMITED`, `LLM_UNAVAILABLE`, `LLM_BAD_OUTPUT`).
  - `src/lib/api/body-parser.ts`: Safe request body reader enforcing 20 KB limit with 413 response.
- **Verification:** Unit tests for rate limiter and body size parser.

### Tasks 3.2 - 3.6: The 5 API Routes
- **Files to create:**
  - `src/app/api/intake/route.ts`
  - `src/app/api/change/route.ts`
  - `src/app/api/advise/route.ts`
  - `src/app/api/ideas/route.ts`
  - `src/app/api/quote/route.ts`
  - Each route:
    - Checks IP rate limit (returns 429 if exceeded).
    - Checks body size <= 20 KB (returns 413 if exceeded).
    - Validates request body with Zod schema (returns 400 if invalid).
    - Calls `callStructured` with task-specific temperature and schema.
    - Returns standardized JSON response.

### Task 4.1: API Route Integration Tests
- **Files to create:**
  - `src/app/api/routes.test.ts`:
    - Tests for each endpoint using injected `FakeLlmClient`.
    - Test bad payload shape returns 400 with `VALIDATION`.
    - Test oversized payload returns 413 with `PAYLOAD_TOO_LARGE`.
    - Test rate limit threshold returns 429 with `RATE_LIMITED`.

### Task 4.2: Golden Eval Test Suite
- **Files to create:**
  - `src/test/evals/golden.test.ts`:
    - 15 test cases from `03_PROMPT_STRATEGY.md` testing parsing and operation extraction behavior.

### Task 4.3: Full Suite Verification
- **Commands:**
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- **Success Criteria:** 0 TypeScript errors, 0 ESLint warnings, 100% passing tests.

---

## Ready for Execution
Once this plan is approved, we will begin executing starting with Wave 1.
