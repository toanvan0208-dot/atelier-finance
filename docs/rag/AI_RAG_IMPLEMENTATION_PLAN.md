# AI_RAG_IMPLEMENTATION_PLAN.md

## 1. Purpose

This document defines the practical implementation plan for turning the current Atelier Finance AI/RAG documentation and prototype UI into a real runtime system.

It is based on:

```text
docs/rag/AI_RAG_IMPLEMENTATION_AUDIT.md
docs/rag/AI_RAG_RUNTIME_CONTRACT.md
docs/rag/RAG_RETRIEVAL_RULES.md
docs/rag/AI_RAG_TEST_CASES.md
docs/rag/AI_HALLUCINATION_CHECKLIST.md
docs/ai/AI_GUARDRAILS.md
docs/ai/AI_SYSTEM_PROMPT.md
docs/ai/AI_MODULE_PROMPTS.md
docs/ai/AI_RESPONSE_STYLE.md
```

This is a plan only. It does not create endpoints, prompt builders, retrieval code, LLM integration, or test runners.

## 2. Current baseline

The current baseline from the audit is:

- The right-side AI assistant UI exists, but the answer in `AITutorAskTab` is a prototype with hardcoded/local response behavior.
- There is no assistant or RAG API route.
- There is no runtime prompt builder.
- There is no retrieval layer, chunking pipeline, vector index, BM25 index, or context packing runtime.
- There is no LLM provider integration.
- There is no output guardrail validator.
- There is no test runner for `docs/rag/AI_RAG_TEST_CASES.md`.
- `docs/rag/*` and `docs/ai/*` are currently design/knowledge documents, not runtime inputs used by code.
- Deterministic financial logic exists in `src/lib/financial-logic/**`, but it is not an AI/RAG implementation.
- Several module datasets are mock/sample data and must not be presented as verified live data by the assistant.

Current classification:

```text
Docs/design: yes
UI prototype: yes
Runtime AI/RAG implementation: no
```

## 3. Implementation goals

The first implementation should be an MVP that is safe, typed, testable, and small enough to ship in phases.

Goals:

- Replace the hardcoded assistant response with a real assistant runtime behind an API.
- Build prompts from explicit system rules, module context, data quality, retrieved RAG chunks, and guardrails.
- Ingest approved RAG/AI docs as chunked, labeled knowledge.
- Retrieve only eligible chunks for the user's intent and current module.
- Exclude negative examples, forbidden outputs, and test cases from normal answer context.
- Exclude `RAG_DOCUMENT_TEMPLATE.md` and `RAG_METADATA_STANDARD.md` from end-user financial answers.
- Return source attribution, missing data, warnings, refusal state, and guardrail checks.
- Add output validation before any answer reaches the UI.
- Add regression tests based on `AI_RAG_TEST_CASES.md`.

## 4. Non-goals

Do not start with a complex architecture.

Non-goals for the MVP:

- No autonomous investment advice.
- No buy/sell/hold recommendation.
- No price prediction.
- No automatic target price or fair value generation from incomplete context.
- No browsing or external data fetching unless a later product decision explicitly adds it.
- No fine-tuning.
- No multi-agent architecture.
- No real-time vector infrastructure as the first step if a file-based lexical index can validate the flow first.
- No use of maintainer docs for user-facing financial answers.
- No treating mock data as production market or financial data.

## 5. Phase 1: Prompt builder

Immediate objective: create a deterministic prompt builder before connecting any LLM.

The prompt builder should accept the contract types from `AI_RAG_RUNTIME_CONTRACT.md` and produce a structured prompt package:

- system rules
- active module rules
- user question
- module context
- data quality summary
- retrieved safe chunks
- missing data summary
- warnings
- forbidden behavior summary

MVP behavior:

- Build prompts as plain strings plus structured metadata.
- Do not call an LLM yet.
- Add unit tests that snapshot the important prompt sections.
- Make missing data and mock data visible in the prompt.
- Ensure advice, prediction, fake data, PVT signal, risk overreach, and checklist overreach risks are explicitly represented.

Expected files/folders during implementation:

```text
src/features/ai-rag/types.ts
src/features/ai-rag/prompt/build-assistant-prompt.ts
src/features/ai-rag/prompt/system-rules.ts
src/features/ai-rag/prompt/module-rules.ts
src/features/ai-rag/prompt/format-module-context.ts
src/features/ai-rag/prompt/format-rag-context.ts
src/features/ai-rag/prompt/__tests__/build-assistant-prompt.test.ts
```

## 6. Phase 2: RAG document ingestion

Immediate objective: load Markdown documents from `docs/rag` and `docs/ai`, split them into chunks, and label each chunk safely.

MVP approach:

- Use local filesystem ingestion at build/test time or server startup.
- Split Markdown by headings.
- Generate stable chunk IDs from file path and heading path.
- Classify sections as `definition`, `concept_explanation`, `guardrail`, `hallucination_rule`, `test_case`, `negative_example`, `forbidden_output`, `maintainer_template`, or `metadata_standard`.
- Store chunk metadata in a local in-memory index first.
- Add tests for section classification.

Important ingestion rules:

- Negative examples, forbidden outputs, and test cases must not be used as normal answer content.
- `RAG_DOCUMENT_TEMPLATE.md` must be labeled as maintainer template content.
- `RAG_METADATA_STANDARD.md` must be labeled as metadata/governance content.
- End-user financial questions must not retrieve maintainer docs.
- Guardrail docs may be retrieved for safety context, but forbidden phrases inside them must be labeled as forbidden examples.

Expected files/folders during implementation:

```text
src/features/ai-rag/ingestion/rag-document-registry.ts
src/features/ai-rag/ingestion/load-rag-documents.ts
src/features/ai-rag/ingestion/chunk-markdown.ts
src/features/ai-rag/ingestion/classify-section.ts
src/features/ai-rag/ingestion/build-rag-index.ts
src/features/ai-rag/ingestion/__tests__/chunk-markdown.test.ts
src/features/ai-rag/ingestion/__tests__/classify-section.test.ts
```

Later:

```text
src/features/ai-rag/ingestion/generated/rag-index.json
```

## 7. Phase 3: Retrieval layer

Immediate objective: implement safe, deterministic retrieval before adding embeddings.

MVP retrieval:

- Detect intent using keyword/rule-based routing from `RAG_RETRIEVAL_RULES.md`.
- Detect metrics and safety risks.
- Select required files for PVT, financial statements, valuation, risk, checklist, and maintainer intents.
- Rank chunks with lexical scoring first.
- Pack at most 3-4 chunks or about 1500 tokens.
- Return required docs present/missing, excluded docs, and warnings.

Do now:

- Use a simple lexical/BM25-like scorer.
- Add explicit required-file rules.
- Add maintainer-doc exclusion.
- Add negative-section exclusion.
- Add retrieval tests for the major test-case groups.

Do later:

- Add embeddings.
- Add vector database.
- Add hybrid vector + BM25 ranking.
- Add offline index refresh.

Expected files/folders during implementation:

```text
src/features/ai-rag/retrieval/detect-intent.ts
src/features/ai-rag/retrieval/detect-safety-risks.ts
src/features/ai-rag/retrieval/detect-metrics.ts
src/features/ai-rag/retrieval/build-rag-search-request.ts
src/features/ai-rag/retrieval/search-rag-chunks.ts
src/features/ai-rag/retrieval/rank-rag-chunks.ts
src/features/ai-rag/retrieval/filter-retrieved-chunks.ts
src/features/ai-rag/retrieval/pack-rag-context.ts
src/features/ai-rag/retrieval/__tests__/retrieval-routing.test.ts
```

## 8. Phase 4: Assistant API endpoint

Immediate objective: create a single assistant endpoint that follows `AssistantRequest` and `AssistantResponse`.

MVP endpoint:

- Validate request shape.
- Normalize module context and data quality.
- Detect intent and safety risks.
- Retrieve RAG chunks.
- Build prompt.
- Call an answer provider.
- Validate output.
- Return structured response.

Recommended first endpoint:

```text
POST /api/assistant
```

`POST /api/rag/search` can be added for development/debugging after the internal retrieval function exists. It should not be required by the UI for the first MVP.

LLM integration should be behind a provider interface. This allows deterministic tests with a mock provider and production calls with a real provider later.

Expected files/folders during implementation:

```text
src/app/api/assistant/route.ts
src/features/ai-rag/runtime/answer-assistant-request.ts
src/features/ai-rag/runtime/validate-assistant-request.ts
src/features/ai-rag/runtime/build-assistant-response.ts
src/features/ai-rag/llm/assistant-answer-provider.ts
src/features/ai-rag/llm/mock-answer-provider.ts
src/features/ai-rag/llm/openai-answer-provider.ts
src/features/ai-rag/runtime/__tests__/answer-assistant-request.test.ts
```

Later development/debug endpoint:

```text
src/app/api/rag/search/route.ts
```

## 9. Phase 5: Output guardrail validator

Immediate objective: block unsafe or unsupported answers before they reach the UI.

The validator should inspect the final answer and structured response fields.

Required checks:

- No buy/sell/hold recommendation.
- No price prediction.
- No fake fair value or target price.
- No fabricated metric outside context.
- No missing data treated as 0.
- No division by 0.
- EPS less than or equal to 0 means P/E must not be interpreted as cheap.
- Equity less than or equal to 0 means ROE/P/B must not be interpreted normally.
- PVT must not be called a trading signal.
- Risk score must not be a final safe/bad stock conclusion.
- Checklist must not be an investment recommendation.
- Mock data must be labeled when used.
- Missing source/timestamp must lower confidence or add a warning.

Validator outcomes:

- `pass`: return answer.
- `repair_required`: regenerate or rewrite with a safe fallback.
- `blocked`: return refusal/redirection.

Expected files/folders during implementation:

```text
src/features/ai-rag/guardrails/validate-assistant-output.ts
src/features/ai-rag/guardrails/forbidden-phrases.ts
src/features/ai-rag/guardrails/validate-missing-data.ts
src/features/ai-rag/guardrails/validate-financial-ratio-rules.ts
src/features/ai-rag/guardrails/validate-pvt-risk-checklist.ts
src/features/ai-rag/guardrails/build-safe-fallback-response.ts
src/features/ai-rag/guardrails/__tests__/validate-assistant-output.test.ts
```

## 10. Phase 6: UI integration

Immediate objective: replace the hardcoded assistant answer in the UI with a typed API call.

MVP UI behavior:

- Keep the existing assistant panel structure.
- Submit `AssistantRequest` to `POST /api/assistant`.
- Show loading, error, answer, warnings, missing data, and source attribution.
- Show a clear label when context is mock/sample data.
- Preserve the active module context.
- Do not expose raw debug traces to normal users.

UI work should happen only after the endpoint, validator, and response schema are working.

Expected files/folders during implementation:

```text
src/features/ai-rag/client/assistant-api-client.ts
src/features/ai-rag/client/use-assistant-answer.ts
src/features/ai-rag/components/AssistantAnswer.tsx
src/features/ai-rag/components/AssistantWarnings.tsx
src/features/ai-rag/components/AssistantSources.tsx
```

Expected code to modify later:

```text
src/components/layout/RightAssistantPanel.tsx
src/components/layout/AppShell.tsx
```

## 11. Phase 7: AI/RAG test runner

Immediate objective: turn `AI_RAG_TEST_CASES.md` into runnable regression coverage.

MVP test runner:

- Start with hand-curated fixtures derived from the Markdown test cases.
- Run retrieval expectations.
- Run prompt-builder expectations.
- Run guardrail validator expectations.
- Run endpoint tests with a mock LLM provider.
- Do not depend on nondeterministic real LLM output for CI.

Test categories:

- PVT questions that ask for signals or entry/exit behavior.
- Financial statement questions with missing CFO, EPS, equity, or invalid denominators.
- Valuation questions with EPS <= 0.
- Risk score overreach.
- Checklist overreach.
- Maintainer intent versus end-user financial intent.
- Negative examples excluded from normal answer context.

Expected files/folders during implementation:

```text
src/features/ai-rag/testing/fixtures/ai-rag-cases.ts
src/features/ai-rag/testing/run-ai-rag-case.ts
src/features/ai-rag/testing/assert-ai-rag-case.ts
src/features/ai-rag/testing/__tests__/ai-rag-regression.test.ts
```

Optional later script:

```text
scripts/ai-rag/run-ai-rag-tests.ts
```

## 12. Proposed file structure

Practical MVP structure:

```text
src/features/ai-rag/
  types.ts
  prompt/
    build-assistant-prompt.ts
    system-rules.ts
    module-rules.ts
    format-module-context.ts
    format-rag-context.ts
  ingestion/
    rag-document-registry.ts
    load-rag-documents.ts
    chunk-markdown.ts
    classify-section.ts
    build-rag-index.ts
  retrieval/
    detect-intent.ts
    detect-safety-risks.ts
    detect-metrics.ts
    build-rag-search-request.ts
    search-rag-chunks.ts
    rank-rag-chunks.ts
    filter-retrieved-chunks.ts
    pack-rag-context.ts
  guardrails/
    validate-assistant-output.ts
    forbidden-phrases.ts
    validate-missing-data.ts
    validate-financial-ratio-rules.ts
    validate-pvt-risk-checklist.ts
    build-safe-fallback-response.ts
  runtime/
    validate-assistant-request.ts
    answer-assistant-request.ts
    build-assistant-response.ts
  llm/
    assistant-answer-provider.ts
    mock-answer-provider.ts
    openai-answer-provider.ts
  client/
    assistant-api-client.ts
    use-assistant-answer.ts
  components/
    AssistantAnswer.tsx
    AssistantWarnings.tsx
    AssistantSources.tsx
  testing/
    fixtures/ai-rag-cases.ts
    run-ai-rag-case.ts
    assert-ai-rag-case.ts

src/app/api/assistant/route.ts
src/app/api/rag/search/route.ts
```

For MVP, `src/app/api/rag/search/route.ts` can be delayed until internal retrieval is stable.

## 13. Runtime flow

MVP runtime flow:

```text
1. UI sends AssistantRequest to POST /api/assistant.
2. API validates required fields and data quality shape.
3. Runtime detects intent, metrics, and safety risks.
4. Runtime builds RAGSearchRequest.
5. Retrieval loads/searches eligible Markdown chunks.
6. Retrieval filters negative/test/forbidden sections from normal answer context.
7. Retrieval excludes maintainer docs unless intent is maintainer_rag_document.
8. Prompt builder creates the prompt package.
9. Answer provider generates draft answer.
10. Output validator checks forbidden behavior and missing-data rules.
11. Runtime repairs, refuses, or returns the answer.
12. UI renders answer, warnings, missing data, and sources.
```

Later runtime upgrades:

- Persist a generated RAG index.
- Add BM25 library if local scoring becomes weak.
- Add embeddings and vector search.
- Add hybrid reranking.
- Add observability for retrieval misses and guardrail failures.

## 14. Safety requirements

These requirements are release blockers:

- The assistant must not recommend buy/sell/hold.
- The assistant must not predict price direction.
- The assistant must not invent data outside context.
- Missing data must be `null`, `not_available`, or `insufficient_data`; never fill with 0.
- The assistant must not divide by 0.
- EPS <= 0 means P/E must not be interpreted as cheap.
- Equity <= 0 means ROE/P/B must not be interpreted normally.
- PVT is market observation, not a trading signal.
- Risk score is a warning/summary, not a final safe/bad stock conclusion.
- Checklist is a thinking aid, not an investment recommendation.
- Mock/sample data must be clearly labeled.
- Negative examples must not become answer content.
- `RAG_DOCUMENT_TEMPLATE.md` and `RAG_METADATA_STANDARD.md` are maintainer-intent only.

## 15. Testing strategy

Testing should be layered.

Unit tests:

- Prompt builder includes required rules and excludes unsafe context.
- Markdown chunker preserves file path and heading path.
- Section classifier labels negative examples, forbidden outputs, test cases, maintainer templates, and metadata standards.
- Intent detector routes PVT, financial statements, valuation, risk, checklist, and maintainer questions.
- Guardrail validator blocks forbidden outputs.

Integration tests:

- Assistant runtime returns safe structured responses with a mock answer provider.
- Retrieval returns required docs for each intent.
- End-user financial questions exclude maintainer docs.
- Advice requests return refusal/redirection.
- Missing data produces missing-data warnings and no fabricated numbers.

UI tests later:

- Assistant panel calls the endpoint.
- Loading/error states work.
- Warnings and sources display.
- Mock data labels display.
- No raw debug trace appears for normal users.

LLM tests:

- Keep CI deterministic with mock LLM output.
- Run real provider smoke tests only manually or behind an explicit environment flag.
- Store failure cases as new fixtures when guardrails catch a regression.

## 16. Rollout order

Recommended order:

1. Add `src/features/ai-rag/types.ts` from the runtime contract.
2. Implement prompt builder with snapshot/unit tests.
3. Implement Markdown ingestion and section classification.
4. Implement lexical retrieval and context packing.
5. Implement output guardrail validator.
6. Implement assistant runtime using a mock answer provider.
7. Add `POST /api/assistant` behind a safe provider interface.
8. Add UI integration behind a feature flag or development switch.
9. Add real LLM provider integration.
10. Add AI/RAG regression test fixtures and runner.
11. Add optional `/api/rag/search` debug endpoint.
12. Add embeddings/vector search only after the lexical MVP is correct.

Do immediately:

- Types.
- Prompt builder.
- Ingestion labels.
- Lexical retrieval.
- Guardrail validator.
- Mock-provider endpoint tests.

Do after MVP:

- Real LLM provider.
- UI feature flag rollout.
- Vector search.
- Debug endpoint.
- More observability and analytics.

## 17. Implementation risks

Key risks:

- Negative examples may be copied into prompts as if they were valid answer content.
- Maintainer docs may be retrieved for end-user financial questions.
- Mock data may be presented as real data.
- PVT wording may drift into signal language.
- Risk score may be overinterpreted as a safe/bad stock conclusion.
- Checklist completion may be overinterpreted as an investment decision.
- Missing data may be silently converted to 0 by a formatter or helper.
- Denominator checks may be missed for EPS, equity, book value, or cash-flow ratios.
- Source attribution may be incomplete, making answers look more certain than they are.
- Token limits may push out the most important guardrails.
- Real LLM output may pass schema validation but still contain unsafe wording.
- Vietnamese forbidden phrases may appear in slightly different wording and bypass a naive phrase list.
- Adding vector search too early may make retrieval harder to debug.

Mitigations:

- Keep retrieval deterministic first.
- Label chunk types aggressively.
- Validate output after LLM generation.
- Keep structured warnings separate from natural-language answer.
- Use fixtures from known failure modes.
- Treat any buy/sell/hold, price prediction, fake number, or missing-data-as-zero failure as release blocking.

## 18. Definition of done

The first real AI/RAG implementation is done when:

- `AssistantRequest`, `AssistantResponse`, `RAGSearchRequest`, `RAGSearchResponse`, and related schemas are implemented as types.
- Prompt builder is deterministic and tested.
- RAG docs are ingested into labeled chunks.
- Retrieval returns the correct documents for PVT, financial statements, valuation, risk, checklist, and maintainer intents.
- Negative examples, forbidden outputs, and test cases are excluded from normal answer context.
- `RAG_DOCUMENT_TEMPLATE.md` and `RAG_METADATA_STANDARD.md` are excluded from end-user financial answers.
- The assistant endpoint returns structured warnings, missing data, source attribution, refusal state, and guardrail checks.
- Output validator blocks unsafe answers before UI rendering.
- UI no longer relies on hardcoded `setAnswer(...)` for assistant answers.
- Mock data is labeled in assistant responses.
- AI/RAG regression cases cover the major rules in `AI_RAG_TEST_CASES.md`.
- No release path can recommend buy/sell/hold, predict price, fabricate data, fill missing data with 0, treat PVT as a signal, treat risk score as a final conclusion, or treat checklist as investment advice.

Final target classification after this plan is implemented:

```text
Docs/design + UI prototype -> typed MVP runtime -> safe RAG assistant implementation
```
