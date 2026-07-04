# Phase 160A - Industry PDF RAG Dry Run

## Goal

Test whether the three local industry PDF reports can be used as a safe retrieval source for future Industry RAG work.

This phase does not connect RAG to the Assistant, UI, database, or metric import path.

## Scope

- Dry run only.
- Local PDF read only.
- No DB read.
- No DB write.
- No schema change.
- No provider fetch.
- No Assistant prompt change.
- No UI change.
- No vector DB introduced.
- No PDF source files committed.
- No raw PDF text committed.
- No IndustryMetric write.
- No benchmark, ranking, scoring, stock attractiveness, buy/sell/hold, target price, fair value, upside, or downside output introduced.

## Sources Checked

| Industry | Example ticker | Local PDF | Report date | Status |
| --- | --- | --- | --- | --- |
| `STEEL_MATERIALS` | `HPG` | `D:\bao-cao-thi-truong-thep-quy-i-2026-20260505095914229.pdf` | 2026-05-05 | Found |
| `RETAIL` | `MWG` | `D:\nganh_ban_le.pdf` | 2026-04-30 | Found |
| `CONSUMER_STAPLES_DAIRY` | `VNM` | `D:\bao-cao-nganh-hang-tieu-dung-trien-vong-dau-tu-2026_20251208132429.pdf` | 2025-12-08 | Found |

## What The Script Does

Added:

- `scripts/dry-run-industry-pdf-rag.ts`

The script:

1. Checks the three local PDF paths.
2. Extracts page text using local Python + `pdfplumber`.
3. Builds temporary in-memory chunks.
4. Runs three sample retrieval questions, one per target industry.
5. Excludes chunks with high-risk answer language such as target price, fair value, upside/downside, trading signal, or buy/sell style language.
6. Prints JSON evidence.

## Extraction Result

| PDF | Pages | Extracted chars |
| --- | ---: | ---: |
| Steel market Q1 2026 | 29 | 43,057 |
| Retail sector | 20 | 28,030 |
| Consumer staples outlook 2026 | 30 | 52,886 |

## Chunk Result

| Industry | Chunks |
| --- | ---: |
| `STEEL_MATERIALS` | 76 |
| `RETAIL` | 46 |
| `CONSUMER_STAPLES_DAIRY` | 89 |

Total chunks built: 211.

Risky chunks excluded from retrieval: 8.

## Retrieval Result

All three sample retrieval cases passed. Each case returned at least two non-risky chunks.

| Industry | Query intent | Retrieved chunks |
| --- | --- | ---: |
| `STEEL_MATERIALS` | production, consumption, steel price, input cost, inventory | 3 |
| `RETAIL` | purchasing power, revenue, online channel, inventory | 3 |
| `CONSUMER_STAPLES_DAIRY` | purchasing power, income, sales channel, input cost | 3 |

Example retrieved pages:

- Steel: pages 18, 6, 17.
- Retail: pages 10, 12, 2.
- Consumer staples / dairy context: pages 6, 5, 13.

## Safety Boundary

This phase only proves retrieval feasibility.

It does not allow:

- AI investment conclusions.
- Buy/sell/hold recommendation.
- Target price, fair value, upside, or downside.
- Stock attractiveness language.
- Benchmark/ranking/scoring.
- Automatic metric extraction into `IndustryMetric`.
- Production-approved context.

Any future Assistant integration must keep answer generation source-bound and must cite retrieved PDF page metadata.

## Validation

```bash
npx eslint scripts/dry-run-industry-pdf-rag.ts
npx tsx scripts/dry-run-industry-pdf-rag.ts
npm run typecheck
```

Dry-run result:

```json
{
  "phase": "160A",
  "mode": "industry_pdf_rag_dry_run_only",
  "sourceFilesMissing": [],
  "totalChunksBuilt": 211,
  "chunkCountsByIndustry": {
    "STEEL_MATERIALS": 76,
    "RETAIL": 46,
    "CONSUMER_STAPLES_DAIRY": 89
  },
  "riskyChunksExcludedFromRetrieval": 8,
  "retrievalCasesPassed": true,
  "readyForRagPrototype": true,
  "dryRunPassed": true
}
```

## Conclusion

The local PDFs are usable for a safe Industry PDF RAG prototype.

The current phase should be treated as retrieval feasibility only. It is not yet runtime RAG, not Assistant RAG, and not a data import.

## Recommended Next Phase

Phase 160B - Industry PDF RAG Prototype Read Path.

Recommended scope:

- Add a small runtime retrieval module.
- Keep PDF chunks in memory or local cache first.
- Return retrieved chunks with source label and page number.
- Add a smoke script that asks industry questions and verifies the answer context remains source-bound.
- Do not write DB, do not import metrics, and do not change UI yet.
