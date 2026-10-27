# Phase 2: LLM Layer & API Routes — Context & Implementation Decisions

**Phase:** Phase 2 — LLM Layer and API Routes  
**Status:** Decisions Locked  
**Governing Documents:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 6 & 7)
- [03_PROMPT_STRATEGY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/03_PROMPT_STRATEGY.md)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md) (Section 2)
- [05_ANTIGRAVITY_BUILD_PLAN.md](file:///e:/PROJECTS/Utsav_Copilot/docs/05_ANTIGRAVITY_BUILD_PLAN.md) (Phase 2)

---

## 1. Core Principles & Boundaries
1. **Server-Side Exclusivity**: The Gemini API key (`GEMINI_API_KEY`) and `@google/genai` client are used server-side only in `src/lib/llm` and `src/app/api/*`. It is NEVER exposed to the browser.
2. **Code Calculates, LLM Explains**: The LLM emits relative ops (`scale_budget`, `shift_date_days`) or narrative advice. It never computes rupee totals, remaining balances, or calendar date arithmetic.
3. **Structured Outputs Always**: All LLM calls request `application/json` with a JSON schema derived from Zod. All LLM responses are validated at runtime with Zod.
4. **Untrusted Data Fencing**: All user text and pasted quotes are strictly enclosed in XML tags (`<user_input>`, `<quote_text>`) with explicit system instructions prohibiting instruction injection.
5. **Injectable Client**: The Gemini client is abstracted behind an interface so tests run deterministically with a `FakeLlmClient`.

---

## 2. Prompts Catalog (`/prompts/*.v1.md`)
Prompts live as separate markdown files with versions:
1. `prompts/intake.v1.md`: Turns conversational input into `ops[]`, asks next 1-2 questions, flags `readyToPlan`.
2. `prompts/change.v1.md`: Converts natural-language change requests into minimal `ops[]` or asks a single `clarification`.
3. `prompts/advise.v1.md`: Explains tradeoffs using facts from `diffPlans` and scenario candidate outcomes.
4. `prompts/ideas.v1.md`: Proposes 3 distinct concept cards with relative `costLevel` ("lower" | "similar" | "higher"), never rupee prices.
5. `prompts/quote.v1.md`: Extracts vendor quote fields, tags missing items as null, generates 5-8 concrete follow-up questions.
6. `prompts/CHANGELOG.md`: Tracks prompt version history and iterations.

---

## 3. LLM Wrapper Architecture (`src/lib/llm/`)

### 3.1 `LlmClient` Interface & Gemini Implementation
- `LlmClient` interface defines `generateStructured(prompt: string, schema: object, temperature: number): Promise<string>`.
- `GeminiClient` implements `LlmClient` using `@google/genai` with model from `GEMINI_MODEL` (fallback `gemini-2.5-flash`).
- `FakeLlmClient` implements `LlmClient` with scripted responses and queue-based simulation for testing (including repair flow testing).

### 3.2 Repair Loop (`callStructured`)
- Step 1: Render prompt from `prompts/<promptId>.v<N>.md` with fenced variables.
- Step 2: Call `client.generateStructured(prompt, jsonSchema, temperature)`.
- Step 3: Parse JSON and validate via `zodSchema.safeParse`.
- Step 4: On failure, invoke **ONE** repair retry:
  `"Your previous output failed validation: <errors>. Return corrected JSON matching the schema only."`
- Step 5: If repair also fails, throw typed `LlmBadOutputError`.
- Logging: Log `promptId`, latency, attempt count. Never log untrusted user content.

---

## 4. API Routes (`src/app/api/`)

All routes: `POST`, JSON in / JSON out, max body 20 KB, IP-based rate limiting.

### 4.1 Route Endpoints
1. `/api/intake`:
   - Request: `{ state: EventState, messages: Array<{ role: 'user' | 'assistant', content: string }> }`
   - Response: `{ assistantMessage: string, stateUpdates: Op[], readyToPlan: boolean, date_hint: string | null }`
2. `/api/change`:
   - Request: `{ state: EventState, text: string }`
   - Response: `{ ops: Op[], clarification: string | null }`
3. `/api/advise`:
   - Request: `{ state: EventState, diff: PlanDiff, scenarios: Scenario[] }`
   - Response: `{ summary: string, options: Array<{ scenarioId: string, headline: string, why: string, tradeoff: string }>, recommendedScenarioId: string }`
4. `/api/ideas`:
   - Request: `{ state: EventState, budgetLines: BudgetLine[], feedback?: string }`
   - Response: `{ concepts: Array<{ name: string, vibe: string, whereMoneyGoes: string, costLevel: 'lower' | 'similar' | 'higher', comfortNotes: string, risks: string, firstThreeSteps: string[] }> }`
5. `/api/quote`:
   - Request: `{ state: EventState, category: CoreCategory, rawText: string }`
   - Response: `{ extraction: RawQuote, questionsToAsk: string[] }`

### 4.2 Security, Caps & Error Standards
- **Body Size Cap**: 20 KB limit enforced in API handler. Exceeding returns HTTP 413 `PAYLOAD_TOO_LARGE`.
- **Rate Limiting**: Sliding window in-memory limiter (20 requests per minute per IP). Exceeding returns HTTP 429 `RATE_LIMITED`.
- **Error Response Contract**:
  ```json
  {
    "error": {
      "code": "VALIDATION" | "RATE_LIMITED" | "LLM_UNAVAILABLE" | "LLM_BAD_OUTPUT",
      "message": "Human readable explanation",
      "retryable": boolean
    }
  }
  ```

---

## 5. Verification Gate
- Unit tests with `FakeLlmClient`:
  - Valid output parsing
  - 1-retry repair flow success
  - Double failure throwing `LLM_BAD_OUTPUT`
  - Oversized request body handling (413)
  - Rate limiting enforcement (429)
  - Input validation failures (400)
- All gates pass: `npm run typecheck && npm run lint && npm test`.
