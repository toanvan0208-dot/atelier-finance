# Phase 160C - Industry PDF RAG Assistant Context Dry Run

## Goal

Verify that Industry PDF RAG chunks can be converted into Assistant prompt context safely.

This phase does not change the production Assistant route. It only proves the context shape and guardrails with a smoke script and mock provider.

## Scope

- Assistant context dry run only.
- No DB read.
- No DB write.
- No schema change.
- No provider fetch.
- Mock provider only.
- No production Assistant route change.
- No production Assistant prompt change.
- No UI change.
- No vector DB.
- No DB index write.
- No PDF source files committed.
- No raw PDF text committed.
- No `IndustryMetric` write.
- No benchmark, ranking, scoring, stock attractiveness, buy/sell/hold, target price, fair value, upside, or downside output introduced.

## Files Changed

- `src/features/industry/lib/industry-pdf-rag.ts`
- `scripts/smoke-industry-pdf-rag-assistant-context.ts`

## Runtime Helper Added

Added `toIndustryPdfRagPromptChunks`.

It converts retrieved Industry PDF RAG chunks into the existing Assistant prompt chunk shape:

- `chunkId`
- `documentId`
- `filePath`
- `title`
- `sectionPath`
- `sectionType`
- `score`
- `text`

The generated text includes:

- Source label.
- Report date.
- Page number.
- Snippet.

## Assistant Context Guardrail

The smoke injects this guardrail into module context:

```text
Industry PDF RAG chunks are research-only, local PDF derived, needsReview=true, and productionApproved=false. Use retrieved chunks only to explain industry context and next checks. Cite source label and page when using them. Do not turn PDF snippets into buy/sell/hold guidance, target price, fair value, upside/downside, ranking, scoring, benchmark, or stock attractiveness claims.
```

## Smoke Result

The smoke checks three cases:

| Industry | Ticker | Retrieved chunks | Prompt chunks | Result |
| --- | --- | ---: | ---: | --- |
| `STEEL_MATERIALS` | `HPG` | 3 | 3 | Passed |
| `RETAIL` | `MWG` | 3 | 3 | Passed |
| `CONSUMER_STAPLES_DAIRY` | `VNM` | 3 | 3 | Passed |

Each prompt case passed:

- `hasRagContext=true`
- source label present
- page metadata present
- `productionApproved=false` present
- PDF RAG guardrail present

## Guardrail Smoke

Safe mock answer:

- completed
- valid

Unsafe mock answer:

- blocked
- violation codes:
  - `BUY_SELL_HOLD_RECOMMENDATION`
  - `FAKE_FAIR_VALUE_OR_TARGET_PRICE`
  - `VALUATION_ACTION_LANGUAGE`
  - `VALUATION_CONCLUSION`

## Validation

```bash
npx eslint src/features/industry/lib/industry-pdf-rag.ts scripts/smoke-industry-pdf-rag-assistant-context.ts
npx tsx scripts/smoke-industry-pdf-rag-assistant-context.ts
npm run typecheck
```

All validation commands passed.

## Result Summary

```json
{
  "phase": "160C",
  "mode": "industry_pdf_rag_assistant_context_dry_run",
  "promptCasesPassed": true,
  "safeMockCompleted": true,
  "safeMockValid": true,
  "unsafeMockBlocked": true,
  "readyForAssistantRuntimeIntegration": true,
  "smokePassed": true
}
```

## Conclusion

Industry PDF RAG chunks are now compatible with Assistant prompt context in a dry run.

This is still not production Assistant integration. The Assistant route has not been changed yet.

## Recommended Next Phase

Phase 160D - Industry PDF RAG Assistant Runtime Integration.

Recommended scope:

- Integrate PDF RAG retrieval into Assistant runtime only for active module `industry`.
- Keep output guarded by the existing validation pipeline.
- Return source labels and page numbers in runtime/debug context.
- Use mock/smoke tests first.
- Do not change UI yet.
- Do not write DB.
