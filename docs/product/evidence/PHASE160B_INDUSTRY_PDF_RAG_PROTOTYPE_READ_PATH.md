# Phase 160B - Industry PDF RAG Prototype Read Path

## Goal

Turn the Phase 160A dry-run into a reusable Industry PDF RAG read path.

This phase creates a runtime retrieval module that can:

- Read the approved local PDF sources.
- Build temporary chunks in memory.
- Retrieve relevant chunks by industry and question.
- Return source metadata and page numbers.
- Exclude high-risk chunks by default.

It still does not connect RAG to the Assistant or UI.

## Scope

- Prototype read path only.
- No DB read.
- No DB write.
- No schema change.
- No provider fetch.
- No Assistant prompt change.
- No Assistant runtime integration.
- No Assistant answer generation.
- No UI change.
- No vector DB.
- No DB index write.
- No PDF source files committed.
- No raw PDF text committed.
- No `IndustryMetric` write.
- No benchmark, ranking, scoring, stock attractiveness, buy/sell/hold, target price, fair value, upside, or downside output introduced.

## Files Added

- `src/features/industry/lib/industry-pdf-rag.ts`
- `scripts/smoke-industry-pdf-rag-read-path.ts`

## Runtime Module

Added `src/features/industry/lib/industry-pdf-rag.ts`.

Main exports:

- `getIndustryPdfRagSources`
- `buildIndustryPdfRagIndex`
- `retrieveIndustryPdfRagChunks`
- `chunkIndustryPdfRagText`
- `hasRiskyIndustryPdfRagAnswerPattern`

The module uses local Python + `pdfplumber` to extract PDF page text.

Returned retrieved chunks include:

- `chunkId`
- `industryCode`
- `sourceKey`
- `sourceLabel`
- `reportDate`
- `pageNumber`
- `score`
- `snippet`
- `riskyForEndUserAnswer`

## Sources

| Industry | Example ticker | Source key | Local PDF | Report date |
| --- | --- | --- | --- | --- |
| `STEEL_MATERIALS` | `HPG` | `local_pdf_steel_q1_2026` | `D:\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf` | 2026-05-05 |
| `RETAIL` | `MWG` | `local_pdf_retail_2026` | `D:\nganh_ban_le.pdf` | 2026-04-30 |
| `CONSUMER_STAPLES_DAIRY` | `VNM` | `local_pdf_consumer_staples_2026` | `D:\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf` | 2025-12-08 |

## Smoke Result

The smoke script builds the read path and runs one retrieval case per industry.

Result summary:

```json
{
  "phase": "160B",
  "mode": "industry_pdf_rag_prototype_read_path",
  "sourceFilesMissing": [],
  "totalChunksBuilt": 211,
  "chunkCountsByIndustry": {
    "STEEL_MATERIALS": 76,
    "RETAIL": 46,
    "CONSUMER_STAPLES_DAIRY": 89
  },
  "riskyChunksExcludedByDefault": 8,
  "retrievalReadPathExists": true,
  "retrievalCasesPassed": true,
  "readyForAssistantContextDryRun": true,
  "smokePassed": true
}
```

Each industry returned 3 chunks with source label and page number:

- Steel: 3 chunks.
- Retail: 3 chunks.
- Consumer staples / dairy context: 3 chunks.

No risky chunks were returned by default.

## Guardrail Result

The smoke verifies:

- `dbReadAttempted=false`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `providerFetchAttempted=false`
- `assistantPromptChanged=false`
- `assistantRuntimeIntegrated=false`
- `assistantAnswerGenerated=false`
- `uiChanged=false`
- `sourcePdfCommitted=false`
- `rawPdfTextCommitted=false`
- `vectorDbIntroduced=false`
- `dbIndexWriteAttempted=false`
- `industryMetricWriteAttempted=false`
- `benchmarkRankingScoringIntroduced=false`
- `buySellHoldIntroduced=false`
- `targetPriceFairValueUpsideDownsideIntroduced=false`
- `stockAttractivenessIntroduced=false`

## Validation

```bash
npx eslint src/features/industry/lib/industry-pdf-rag.ts scripts/smoke-industry-pdf-rag-read-path.ts
npx tsx scripts/smoke-industry-pdf-rag-read-path.ts
npm run typecheck
```

All validation commands passed.

## Conclusion

Industry PDF RAG now has a prototype read path.

This is not yet Assistant RAG. It only retrieves source-backed PDF snippets with page metadata.

## Recommended Next Phase

Phase 160C - Industry PDF RAG Assistant Context Dry Run.

Recommended scope:

- Build an Assistant context packet from retrieved PDF chunks.
- Use a mock provider only.
- Verify the prompt contains source labels and page numbers.
- Verify unsafe answers remain blocked.
- Do not change UI.
- Do not write DB.
- Do not generate production-approved context.
