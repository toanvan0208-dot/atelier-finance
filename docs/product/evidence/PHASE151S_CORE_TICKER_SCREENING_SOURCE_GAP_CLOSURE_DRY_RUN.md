# Phase 151S - Core Ticker Screening Source Gap Closure Dry Run

## Goal

Find and explain the source/read-path gaps that caused Phase 151R to keep the core ticker universe as `missing_safe`.

Core tickers:

- FPT
- HPG
- VNM
- MSN
- MWG
- VCB

This phase is dry-run only. It does not write database rows, fetch providers, change schema, change UI, or alter Assistant behavior.

## Scope

- Inspect local PostgreSQL read-paths.
- Inspect existing runtime/static/source references in the repo.
- Report source availability, eligibility, read-path mismatches, and blockers.
- Keep missing data as null/N/A/needs_review.
- Keep `productionApproved=true` at 0.
- Do not create ranking, scoring, benchmark, or `IndustryMetric`.

## Files Changed

- `scripts/dry-run-screening-core-ticker-source-gap-closure.ts`
- `docs/product/evidence/PHASE151S_CORE_TICKER_SCREENING_SOURCE_GAP_CLOSURE_DRY_RUN.md`

## Source Inventory By Ticker

The script found ticker references in static/runtime/test/evidence files for all six core tickers, but found no eligible local PostgreSQL source rows for the required ScreeningCandidate fields.

| Ticker | Company source | Industry source | Financial metrics | Market metrics | Eligible for ScreeningCandidate |
| --- | --- | --- | --- | --- | --- |
| FPT | static/runtime reference only | static/runtime reference only | static/runtime reference only | static/runtime reference only | no |
| HPG | static/runtime reference only | static/runtime reference only | static/runtime reference only | static/runtime reference only | no |
| VNM | static/runtime reference only | static/runtime reference only | static/runtime reference only | static/runtime reference only | no |
| MSN | static/runtime reference only | static/runtime reference only | static/runtime reference only | static/runtime reference only | no |
| MWG | static/runtime reference only | static/runtime reference only | static/runtime reference only | static/runtime reference only | no |
| VCB | static/runtime reference only | static/runtime reference only | static/runtime reference only | static/runtime reference only | no |

Static/runtime references are useful for inventory, but they are not treated as real ScreeningCandidate data and must not be backfilled as production rows.

## Metric Availability By Ticker

All fields below were found only as static/runtime references and are not eligible for ScreeningCandidate confirm-write.

| Ticker | Company | IndustryCode | P/E | P/B | CFO | Liquidity | ClosePrice | EPS | SharesOutstanding | TotalDebt |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FPT | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible |
| HPG | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible |
| VNM | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible |
| MSN | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible |
| MWG | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible |
| VCB | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible | ineligible |

## Read-Path Mismatch Findings

Phase 151R returned `missing_safe` because it only accepted eligible local/runtime data from:

- `prisma.company`
- `prisma.companyIndustry`
- `prisma.financialStatement`
- `prisma.marketPrice`
- reviewed local runtime read-paths built on those sources

For all six tickers, Phase 151S found:

- Company-like references exist in static/runtime files, but no eligible Prisma `Company` row was found.
- Financial-like references exist in static/runtime/test files, but no eligible local PostgreSQL `FinancialStatement` row was found.
- Ticker references exist in runtime files, but no eligible local PostgreSQL `MarketPrice` row was found.
- Ticker references exist in runtime/industry evidence, but no eligible local PostgreSQL `CompanyIndustry` row was found.

This means the gap is not a UI problem. The Screening UI is reading the dedicated ScreeningCandidate path correctly; the core ticker data has not yet been converted into eligible local PostgreSQL source rows or dedicated reviewed source packages.

## Eligible vs Ineligible Sources

Eligible for future ScreeningCandidate backfill:

- Local PostgreSQL `Company` rows with `dataMode=research_only`.
- Local PostgreSQL `CompanyIndustry` rows with `dataMode=research_only`, `needsReview=true`, `productionApproved=false`.
- Local PostgreSQL `FinancialStatement` rows with source metadata, non-null metric fields, and no fallback/sample usage.
- Local PostgreSQL `MarketPrice` rows with source metadata and market snapshot caveats.
- Manual reviewed source packages with provenance and caveats.

Ineligible in this phase:

- Static UI/runtime copy.
- Test fixtures.
- Evidence text.
- Sample fallback data.
- Hardcoded UI rows.
- Provider/network fetch results not already reviewed and stored.

## Remaining Blockers

For every core ticker:

- Static/runtime references are inventory evidence only.
- They must not be backfilled as real ScreeningCandidate data.
- Missing fields remain null/N/A/needs_review.
- Confirm-write is blocked until reviewed local PostgreSQL rows or manual reviewed source packages exist.

## Recommendation

Current recommendation for all six tickers:

- `create_manual_reviewed_source_package`

Alternative acceptable paths:

- Import reviewed data into local PostgreSQL if the source package and provenance already exist.
- Adjust Screening read-path only if an existing reviewed runtime source is identified and carries enough provenance.
- Leave ticker `missing_safe` if reviewed data is not available.

Do not use stale static runtime references as real ScreeningCandidate data.

## Dry-Run Summary

```json
{
  "phase": "151S",
  "mode": "dry_run",
  "candidateTickers": "FPT,HPG,VNM,MSN,MWG,VCB",
  "sourceKindSummary": {
    "FPT": "static_runtime_code only",
    "HPG": "static_runtime_code only",
    "VNM": "static_runtime_code only",
    "MSN": "static_runtime_code only",
    "MWG": "static_runtime_code only",
    "VCB": "static_runtime_code only"
  },
  "readyForConfirmWrite": false,
  "dbWriteAttempted": false,
  "providerFetchAttempted": false,
  "schemaChanged": false,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "productionApprovedTrueCount": 0,
  "forbiddenAdviceDetected": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "smokePassed": true
}
```

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- UI change: no.
- Assistant change: no.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- Ranking/scoring created: false.
- Benchmark created: false.
- `IndustryMetric` created: false.
- Forbidden advice wording detected: false.
- `productionApprovedTrueCount=0`.
- Missing values remain null/N/A/needs_review.

## Validation

Passed:

```bash
npx eslint scripts/dry-run-screening-core-ticker-source-gap-closure.ts
npx tsx scripts/dry-run-screening-core-ticker-source-gap-closure.ts
npx prisma validate
npx prisma generate
npm run typecheck
```

## Next Recommended Phase

Phase 151T - create reviewed/manual Screening source packages for the core tickers, starting with the tickers that already have the strongest reviewed business/financial/industry provenance in prior phases. Keep confirm-write blocked until at least one ticker has eligible company, industry, financial, and market source metadata.
