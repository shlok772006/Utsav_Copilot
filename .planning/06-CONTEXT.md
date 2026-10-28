# Phase 6: Vendors & Ideas — Context & Implementation Decisions

**Phase:** Phase 6 — Vendor Quote Comparison & Personalized Concept Cards  
**Status:** Decisions Locked  
**Governing Documents:**
- [AGENTS.md](file:///e:/PROJECTS/Utsav_Copilot/AGENTS.md)
- [00_WALKTHROUGH.md](file:///e:/PROJECTS/Utsav_Copilot/docs/00_WALKTHROUGH.md) (Sections 4 & 5)
- [01_PRD.md](file:///e:/PROJECTS/Utsav_Copilot/docs/01_PRD.md) (Epics E & F)
- [02_ARCHITECTURE.md](file:///e:/PROJECTS/Utsav_Copilot/docs/02_ARCHITECTURE.md) (Sections 5.7, 6)
- [03_PROMPT_STRATEGY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/03_PROMPT_STRATEGY.md) (Sections 6 & 7)
- [04_QUALITY_TESTING_SECURITY.md](file:///e:/PROJECTS/Utsav_Copilot/docs/04_QUALITY_TESTING_SECURITY.md)
- [05_ANTIGRAVITY_BUILD_PLAN.md](file:///e:/PROJECTS/Utsav_Copilot/docs/05_ANTIGRAVITY_BUILD_PLAN.md) (Phase 6)

---

## 1. Core Principles & Boundaries

1. **Absolute Honesty on Vendor Quotes**:
   - Never invent vendor names, availability, or prices.
   - Any missing field (e.g. tax rate, service cutlery, payment schedule) is explicitly labeled **"Not stated"** in amber chips.
   - Displayed prices carry the `Vendor quote` provenance badge.
2. **Relative Cost Levels on Ideas (No Rupee Prices)**:
   - Concept cards reflect atmosphere, guest mix (kids & elders), accessibility needs, and budget share.
   - Per AGENTS.md and PRD Epic E: Ideas state where the money goes, comfort notes, and a relative cost level (`lower` / `similar` / `higher`), **never a rupee price**.
3. **Pure Code Normalization**:
   - Raw quote extractions pass through `normalizeQuote(raw, state, plan)`.
   - Code calculates total price, per-guest unit cost, delta against category budget line, and flags over-budget warnings (`OVER_BUDGET_QUOTE`).
4. **Empowering the Family**:
   - Generates curated "Questions to Ask Before Booking" for each quote so users don't get caught off-guard by hidden fees or missing logistics on the event day.

---

## 2. Component Specifications

### 2.1 Ideas Tab (`src/components/ideas/IdeasTab.tsx`)
- **Organization**:
  - Full dashboard tab labeled "Personalized Ideas" (icon: 💡).
- **Auto-Generation & Caching**:
  - Automatically triggers `/api/ideas` on first view if not already cached in store.
  - Skeletons / loading state while generating.
- **3 Concept Cards**:
  - Title and Vibe description.
  - Cost Level badge: `lower` (emerald), `similar` (amber), `higher` (purple/rose) — strictly non-rupee.
  - "Where the Money Goes" focus areas.
  - "Elder & Kid Comfort" notes.
  - "Risks & Watchouts".
  - "First 3 Action Steps".
- **Refinement Bar**:
  - Feedback input field with suggestion chips (e.g. *"More traditional"*, *"Cut decor, maximize food"*).
  - "Regenerate Concepts" button calling `/api/ideas` with feedback.

### 2.2 Vendors Tab (`src/components/vendors/VendorsTab.tsx`)
- **Organization**:
  - Full dashboard tab labeled "Vendor Quotes" (icon: 🧾).
- **Paste Quote Modal / Drawer (`QuotePasteModal.tsx`)**:
  - Select category (Catering, Venue, Decor, Photography, etc.).
  - Textarea for pasting raw text (WhatsApp message, email, PDF paste) capped at 6,000 characters.
  - 2 Pre-loaded sample quote buttons for instant demo:
    - *Sample Caterer A (Annapurna)*: ₹650 per plate, 60 guests min, GST 5% extra.
    - *Sample Caterer B (Royal Feast)*: ₹55,000 lump sum all inclusive, covers 60 people.
  - Submit calls `POST /api/quote`, then runs domain `normalizeQuote`, adding to store quotes.
- **Side-by-Side Comparison View**:
  - Filter by category (e.g. Catering).
  - Table/Card columns comparing:
    - Vendor Name
    - Total Amount (INR formatted, Provenance: `Vendor quote`)
    - Per-Guest Cost (INR)
    - vs Budget Line delta (e.g. `-₹2,500 Under budget` or `+₹10,000 Over budget`)
    - Inclusions & Exclusions
    - Payment Terms & Validity
    - Missing Information ("Not stated")
- **Questions to Ask Checklist**:
  - Collapsible list of smart questions to ask each vendor before signing or paying an advance.

### 2.3 Store Extensions (`src/lib/store/useEventStore.ts`)
- Add `concepts: ConceptIdea[]` and `quotes: StoredQuote[]` to `EventStoreState`.
- Provide actions:
  - `setConcepts(concepts: ConceptIdea[])`
  - `addQuote(quote: StoredQuote)`
  - `removeQuote(quoteId: string)`
- In `loadSampleEvent`, pre-populate the 2 sample caterer quotes so the user can immediately experience the comparator on initial demo load.

---

## 3. Testing & Verification

1. **Unit Tests**:
   - `IdeasTab.test.tsx`:
     - Renders 3 concept cards.
     - Confirms NO rupee prices are rendered in concept cards.
     - Tests feedback input and regeneration call.
   - `VendorsTab.test.tsx`:
     - Renders comparison table with side-by-side quotes.
     - Verifies "Not stated" tags for missing fields.
     - Verifies `OVER_BUDGET_QUOTE` warning badge when quote exceeds budget.
     - Tests questions to ask checklist.
   - `QuotePasteModal.test.tsx`:
     - Tests pasting quote text and clicking sample buttons.
     - Submitting calls `/api/quote` and adds normalized quote to store.
2. **Verification Commands**:
   - `npm run typecheck && npm run lint && npm test`.
