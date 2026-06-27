# Phase 144H: Assistant Quality Hardening (Static RAG)

## Starting State
- **Phase 144G** completed the Assistant RAG readiness audit.
- Assistant was classified as "Partial RAG with static retrieval / Context-grounded Assistant".
- Assistant was protected by `validateAssistantOutput` preventing forbidden keywords but needed stricter instruction within the prompt to encourage beginner-friendly language, explicitly enforce the non-predictive nature of tools (Simulation, Checklist, Screening), and address edge cases (VCB/bank data, research data vs. production data).

## Files Changed
- `src/lib/ai-rag/prompts/build-assistant-prompt.ts`
- `scripts/smoke-assistant-quality-static-rag.ts`

## Assistant Classification Before/After
- **Before:** Partial RAG with static retrieval / Context-grounded Assistant
- **After:** Partial RAG with static retrieval / Context-grounded Assistant (No change in architecture, but higher instruction discipline in the system prompt).
- **Live LLM calls:** No
- **Provider mode:** "none" (default) / "mock" used in test.

## Prompt/Context Improvements
Added explicit system constraints to `GLOBAL_GUARDRAIL_REMINDERS`:
1. "Answer in Vietnamese by default and explain concepts very simply and briefly for beginner investors. Do not use overly academic jargon."
2. "Missing data must be represented as null/not_available/insufficient_data; never replace missing data with zero. Do not make up facts to fill the gap."
3. "Checklist is a tool to help you think critically and verify evidence, it is not an investment recommendation or a signal to buy."
4. "Screening is a readiness table to help find candidates, it does not rank stocks as 'worth buying'."
5. "Simulation is an educational illustration of a scenario, it does not predict future profit."
6. "When asking about VCB or bank data, explicitly state that banks have unique accounting (e.g., they don't use totalDebt like normal corporations)."
7. "When productionApproved is false or the source is local/research/manual, explicitly state: 'This is research/staging data, not production-approved official data.'"

## Quality Test Set & Mock/API Smoke Result
Created `scripts/smoke-assistant-quality-static-rag.ts` testing 14 scenarios spanning Financials, Valuation, Risk, VCB mapping, Checklist, Screening, Simulation, and Unsafe Prompts (e.g. target price extraction).
- **Test Result:** Pass. All 14 test cases successfully included the proper prompt wording and matched intents.
- **Mock Provider API Smoke:** Pass. Successfully bypassed LLM and returned safe fallback using mock mode.

## Guardrail Observations
- All modules now inherit strict warnings.
- The assistant is structurally banned from replacing missing values with zero or fabricating unprovided metrics.
- Simulation is now safely classified as an educational tool, reducing risk of the LLM treating user-inputted scenarios as a real projection.

## Data Quality & Validation
- **DB Write:** No
- **Data Seed/Import:** No
- **Schema Migration:** No
- **Rollback:** No
- **Production Deploy/Import:** No
- **Validation Result:** Validated (Typecheck, lint, build, test pass).

## Known Limitations
- The system remains reliant on static RAG `document-map.ts`. Without a vector database, it retrieves entire markdown documents for a topic.
- Prompt has become slightly larger, consuming more tokens.

## Recommended Next Phase
Phase 145 - Proceed with Postgres transition plan / staging dry run checks as the application layer (including Assistant) is fully locked down and verified.

### readyForNextPhase
**Yes.**
