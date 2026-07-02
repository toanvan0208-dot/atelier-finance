# Phase 151T - HPG Manual Reviewed Screening Source Package Dry Run

## Goal

Create a dry-run-only manual reviewed Screening source package for HPG, so HPG can later become eligible for a bounded `ScreeningCandidate` confirm-write.

HPG is handled first because it is the reviewed Industry lane ticker for `STEEL_MATERIALS` and the natural anchor for the steel Screening flow that already contains HSG/NKG.

## Scope

- HPG only.
- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch.
- No UI change.
- No Assistant change.
- No Supabase write.
- No ranking, scoring, benchmark, or `IndustryMetric`.
- No buy/sell/hold, target price, fair value, upside, or downside.
- No static UI/runtime copy as real data.
- No test fixture as real data.
- No evidence text alone as real data.
- No total-liabilities substitution for total debt.
- No zero-fill.

## Files Changed

- `scripts/dry-run-screening-hpg-manual-reviewed-source-package.ts`
- `docs/product/evidence/PHASE151T_HPG_MANUAL_REVIEWED_SCREENING_SOURCE_PACKAGE_DRY_RUN.md`

## Sources Inspected

- `docs/product/evidence/PHASE151S_CORE_TICKER_SCREENING_SOURCE_GAP_CLOSURE_DRY_RUN.md`
- `docs/product/evidence/PHASE151C_INDUSTRY_FINAL_BOUNDARY_HANDOFF.md`
- `docs/product/evidence/PHASE151B_INDUSTRY_TIER4_FULL_QUALITATIVE_CONTEXT_MILESTONE.md`
- `docs/product/evidence/PHASE151A_INDUSTRY_QUALITATIVE_CONTEXT_CONFIRM_WRITE_READ_PATH.md`
- `scripts/smoke-staging-reviewed-preview-read-path.ts`
- `scripts/smoke-staging-market-price-read-path.ts`
- `scripts/smoke-steel-peer-group-read-path.ts`
- `scripts/smoke-product-readiness-six-ticker.ts`
- `src/features/watchlist/data/watchlist.data.ts`

These files confirm that HPG has strong historical/reviewed milestone context, especially for the Industry lane. However, in the current local PostgreSQL environment, the package script did not find write-ready source rows for HPG in `Company`, `CompanyIndustry`, `FinancialStatement`, or `MarketPrice`.

## HPG Candidate Package Summary

| Field | Status |
| --- | --- |
| Ticker | HPG |
| Candidate prepared | true |
| Coverage level | `missing_safe` |
| Screening eligible | false |
| Analysis eligible | false |
| Metrics prepared | 8 |
| Provenance rows prepared | 0 |
| Ready for confirm-write | false |

The script prepared the HPG package shell but blocked every field because there is no eligible local PostgreSQL source row yet.

## HPG Metric Availability

| Field | Value | Eligible | Blocker |
| --- | --- | --- | --- |
| companyName | null | false | HPG `Company` row is missing from local PostgreSQL. |
| industryCode | null | false | HPG `CompanyIndustry` row for `STEEL_MATERIALS` is missing from local PostgreSQL. |
| P/E | null | false | Close price or denominator is missing/non-positive. |
| P/B | null | false | Close price or denominator is missing/non-positive. |
| CFO | null | false | CFO is missing from eligible HPG `FinancialStatement` rows. |
| LIQUIDITY | null | false | Liquidity is missing from eligible HPG `MarketPrice` rows. |
| CLOSE_PRICE | null | false | Close price is missing from eligible HPG `MarketPrice` rows. |
| EPS | null | false | EPS is missing from eligible HPG `FinancialStatement` rows. |
| SHARES_OUTSTANDING | null | false | Shares outstanding is missing from eligible HPG `FinancialStatement` rows. |
| TOTAL_DEBT | null | false | Total debt is missing from eligible HPG `FinancialStatement` rows. |

Missing values remain null/N/A/needs_review. No field was zero-filled.

## Eligible vs Blocked Fields

Eligible fields:

- None.

Blocked fields:

- `companyName`
- `industryCode`
- `PE`
- `PB`
- `CFO`
- `LIQUIDITY`
- `CLOSE_PRICE`
- `EPS`
- `SHARES_OUTSTANDING`
- `TOTAL_DEBT`

## Provenance Summary

Prior evidence identifies HPG as the reviewed `STEEL_MATERIALS` lane ticker, and prior smoke scripts reference reviewed-preview financial and market-price read-paths. Those references are not enough for a ScreeningCandidate confirm-write in this phase because they are not present as eligible local PostgreSQL source rows in the current environment.

The correct next step is to import or create a dedicated reviewed HPG source package with:

- company metadata provenance
- `STEEL_MATERIALS` taxonomy provenance
- accounting metrics provenance
- market snapshot provenance
- explicit `research_only`, `needsReview=true`, `productionApproved=false` caveats

## Dry-Run Summary

```json
{
  "phase": "151T",
  "mode": "dry_run",
  "ticker": "HPG",
  "candidatePrepared": true,
  "coverageLevel": "missing_safe",
  "screeningEligible": false,
  "analysisEligible": false,
  "metricsPreparedCount": 8,
  "provenanceRowsPreparedCount": 0,
  "missingFields": [
    "companyName",
    "industryCode",
    "PE",
    "PB",
    "CFO",
    "LIQUIDITY",
    "CLOSE_PRICE",
    "EPS",
    "SHARES_OUTSTANDING",
    "TOTAL_DEBT"
  ],
  "eligibleFields": [],
  "readyForConfirmWrite": false,
  "dbWriteAttempted": false,
  "providerFetchAttempted": false,
  "schemaChanged": false,
  "uiChanged": false,
  "assistantChanged": false,
  "productionApprovedTrueCount": 0,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "forbiddenAdviceDetected": false,
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
- Forbidden advice wording introduced: false.
- `productionApprovedTrueCount=0`.
- Missing data remains null/N/A/needs_review.

## Validation

Passed:

```bash
npx eslint scripts/dry-run-screening-hpg-manual-reviewed-source-package.ts
npx tsx scripts/dry-run-screening-hpg-manual-reviewed-source-package.ts
npx prisma validate
npx prisma generate
npm run typecheck
```

## Next Recommended Phase

`readyForConfirmWrite=false`.

Close HPG missing source gaps first. Recommended next phase: create or import a dedicated HPG reviewed Screening source package into local PostgreSQL, then rerun this dry-run before any confirm-write.
