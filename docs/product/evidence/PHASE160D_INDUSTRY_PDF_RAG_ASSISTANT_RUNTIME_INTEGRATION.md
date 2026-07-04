# Phase 160D - Industry PDF RAG Assistant Runtime Integration

## Goal

Integrate the Industry PDF RAG read path into the Assistant runtime for the Industry module.

This phase allows the Assistant prompt to receive source-backed PDF snippets with source label, report date, and page number.

## Scope

- Assistant runtime integration only.
- Active module limited to `industry`.
- DB read allowed because the Assistant route already reads ticker/industry context.
- No DB write.
- No schema change.
- No provider fetch.
- Mock provider smoke only.
- No UI change.
- No vector DB.
- No DB index write.
- No PDF source files committed.
- No raw PDF text committed.
- No `IndustryMetric` write.
- No benchmark, ranking, scoring, stock attractiveness, buy/sell/hold, target price, fair value, upside, or downside output introduced.

## Files Changed

- `src/lib/ai-rag/runtime/types.ts`
- `src/lib/ai-rag/runtime/build-assistant-runtime.ts`
- `src/app/api/assistant/route.ts`
- `scripts/smoke-industry-pdf-rag-assistant-runtime.ts`

## Runtime Change

Added `supplementalRetrievedChunks` to the Assistant runtime input.

The runtime now keeps the existing markdown RAG retrieval unchanged and appends supplemental chunks only when provided.

This is used for Industry PDF RAG chunks:

```text
Industry PDF RAG retrieval
-> toIndustryPdfRagPromptChunks
-> supplementalRetrievedChunks
-> buildAssistantPrompt
```

The existing markdown RAG pipeline remains intact.

## Assistant Route Change

The Assistant route now adds Industry PDF RAG chunks only when:

- `activeModule` is `industry`
- ticker has an eligible mapped industry code
- industry code is one of:
  - `STEEL_MATERIALS`
  - `RETAIL`
  - `CONSUMER_STAPLES_DAIRY`

The route adds:

- `industryPdfRagContext`
- `industryPdfRagAssistantGuardrail`
- supplemental prompt chunks with source label and page number

If PDF extraction or retrieval fails, the route keeps running and records an unavailable/warning context instead of breaking the Assistant request.

## Guardrail Added

```text
Industry PDF RAG chunks may be present as research-only, local PDF derived, needsReview=true, productionApproved=false context. Use retrieved PDF chunks only to explain industry context and next checks, and cite source label/page when using them. Do not turn PDF snippets into buy/sell/hold guidance, target price, fair value, upside/downside, ranking, scoring, benchmark, or stock attractiveness claims.
```

## Smoke Result

Smoke script:

- `scripts/smoke-industry-pdf-rag-assistant-runtime.ts`

Result summary:

```json
{
  "phase": "160D",
  "mode": "industry_pdf_rag_assistant_runtime_integration",
  "dbReadAttempted": true,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "mockProviderOnly": true,
  "safeStatus": "completed",
  "safeSupplementalChunkCount": 3,
  "safePromptHasRagContext": true,
  "safePromptIncludesPdfRagGuardrail": true,
  "safePromptIncludesSourceLabel": true,
  "safePromptIncludesPageMetadata": true,
  "safePromptIncludesProductionApprovedFalse": true,
  "unsafeStatus": "blocked_by_guardrails",
  "unsafeAnswerBlocked": true,
  "smokePassed": true
}
```

Unsafe mock answer was blocked with:

- `BUY_SELL_HOLD_RECOMMENDATION`
- `FAKE_FAIR_VALUE_OR_TARGET_PRICE`
- `VALUATION_ACTION_LANGUAGE`

## Validation

```bash
npx eslint src/app/api/assistant/route.ts src/lib/ai-rag/runtime/build-assistant-runtime.ts src/lib/ai-rag/runtime/types.ts src/features/industry/lib/industry-pdf-rag.ts scripts/smoke-industry-pdf-rag-assistant-runtime.ts
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/atelier_finance?schema=public'; npx tsx scripts/smoke-industry-pdf-rag-assistant-runtime.ts
npm run typecheck
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/atelier_finance?schema=public'; npx vitest run src/app/api/assistant/__tests__/route.test.ts src/lib/ai-rag/runtime/__tests__/build-assistant-runtime.test.ts
```

All validation commands passed.

## Conclusion

Industry PDF RAG is now integrated into the Assistant runtime for the Industry module.

The Assistant can now receive PDF-backed industry snippets in its prompt with source and page metadata.

This still does not change UI and does not create persistent PDF/vector storage.

## Recommended Next Phase

Phase 160E - Industry PDF RAG UI Source Disclosure.

Recommended scope:

- Show the source/page metadata somewhere visible when Industry PDF RAG context is active.
- Keep the display read-only.
- Do not expose raw PDF text as a large dump.
- Do not add scoring, ranking, or investment conclusion language.
