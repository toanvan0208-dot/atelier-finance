# Phase 151U - Core Ticker Reviewed Screening Source Import Dry Run

## Goal

Prepare dry-run-only reviewed source import packages for upstream local PostgreSQL source tables needed by Screening:

- `Company`
- `CompanyIndustry`
- `FinancialStatement`
- `MarketPrice`

Target tickers:

- `FPT`
- `HPG`
- `VNM`
- `MSN`
- `MWG`
- `VCB`

This phase does not write upstream source rows and does not write `ScreeningCandidate` rows.

## Scope

- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch.
- No UI change.
- No Assistant change.
- No Supabase write.
- No `ScreeningCandidate` write.
- No ranking, scoring, benchmark, stock attractiveness score, or `IndustryMetric`.
- No static UI/runtime copy as real source data.
- No test fixtures as real source data.
- No evidence text alone as real source data unless it points to an actual reviewed source package/provenance artifact.
- Missing values remain null/N/A/needs_review.
- `productionApproved=true` remains zero.
- HSG/NKG untouched.
- TVN absent.

## Files Changed

- `scripts/dry-run-core-ticker-reviewed-screening-source-import.ts`
- `docs/product/evidence/PHASE151U_CORE_TICKER_REVIEWED_SCREENING_SOURCE_IMPORT_DRY_RUN.md`

## Sources Inspected

- `scripts/industry-taxonomy-reviewed-sources.ts`
- `docs/product/evidence/PHASE139I_FPT_PDF_2025_PREVIEW.json`
- `docs/product/evidence/PHASE139B_HPG_PDF_2025_PREVIEW.json`
- `docs/product/evidence/PHASE139F_VNM_PDF_2025_PREVIEW.json`
- `docs/product/evidence/PHASE139K_MSN_PDF_2025_DRY_RUN.json`
- `docs/product/evidence/PHASE140F_MWG_REFRESHED_ANNUAL_REPORT_MANUAL_PREVIEW_RESULT.json`
- Existing import validators/scripts for FPT, HPG, VNM, MSN, and MWG PDF-reviewed preview packages.
- Existing market-price/provider scripts were considered out of scope because Phase 151U does not fetch providers and does not treat staging/provider fallback as reviewed source rows.

## Dry-Run Summary

```json
{
  "phase": "151U",
  "mode": "dry_run",
  "candidateTickers": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "companyCandidatesPrepared": 6,
  "companyIndustryCandidatesPrepared": 6,
  "financialStatementCandidatesPrepared": 6,
  "marketPriceCandidatesPrepared": 6,
  "eligibleSourceRowsPrepared": 8,
  "blockedSourceRows": 16,
  "missingSourceRows": 16,
  "tickersReadyForSourceConfirmWrite": [],
  "tickersBlocked": ["FPT", "HPG", "VNM", "MSN", "MWG", "VCB"],
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "uiChanged": false,
  "assistantChanged": false,
  "screeningCandidateWriteAttempted": false,
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

## Source Candidates By Ticker

| Ticker | Company | CompanyIndustry | FinancialStatement | MarketPrice | Ready for source confirm-write |
| --- | --- | --- | --- | --- | --- |
| FPT | Blocked | Blocked | Eligible | Blocked | No |
| HPG | Blocked | Eligible | Eligible | Blocked | No |
| VNM | Blocked | Eligible | Eligible | Blocked | No |
| MSN | Blocked | Blocked | Eligible | Blocked | No |
| MWG | Blocked | Eligible | Eligible | Blocked | No |
| VCB | Blocked | Blocked | Blocked | Blocked | No |

## Eligible Source Rows

Eligible rows prepared for future bounded source import consideration:

- `FPT` `FinancialStatement`: EPS, shares outstanding, and total debt from `annual_report_2025_pdf_reviewed_preview`.
- `HPG` `CompanyIndustry`: `STEEL_MATERIALS` mapping from reviewed provider taxonomy package.
- `HPG` `FinancialStatement`: EPS, shares outstanding, and total debt from `annual_report_2025_pdf_reviewed_preview`.
- `VNM` `CompanyIndustry`: `CONSUMER_STAPLES_DAIRY` mapping from reviewed provider taxonomy package.
- `VNM` `FinancialStatement`: EPS, shares outstanding, and total debt from `annual_report_2025_pdf_reviewed_preview`.
- `MSN` `FinancialStatement`: EPS, shares outstanding, and total debt from MSN reviewed annual-report dry-run artifact.
- `MWG` `CompanyIndustry`: `RETAIL` mapping from reviewed provider taxonomy package.
- `MWG` `FinancialStatement`: EPS, shares outstanding, and total debt from MWG refreshed annual-report manual preview artifact.

All eligible rows remain `research_only`, `needsReview=true`, and `productionApproved=false`.

## Blocked Source Rows

Blocked rows remain blocked because Phase 151U found no eligible reviewed source package for them:

- `Company` metadata rows for all six tickers.
- `MarketPrice` rows for all six tickers.
- `CompanyIndustry` rows for `FPT`, `MSN`, and `VCB`.
- `FinancialStatement` row for `VCB`.

`CFO` was not introduced for these core tickers in this phase. Missing accounting fields remain null/N/A/needs_review.

## Read-Path Implication

This dry-run would not yet enable a successful 151R/151T-style `ScreeningCandidate` backfill rerun for any of the six core tickers, because each ticker is still missing at least one required upstream source row category.

The useful finding is narrower: reviewed partial source rows exist for five tickers, but no ticker has the full upstream source set needed for a conservative source confirm-write.

## Guardrail Confirmation

- DB write: no.
- Schema change: no.
- Provider fetch: no.
- UI change: no.
- Assistant change: no.
- `ScreeningCandidate` write: no.
- HSG/NKG untouched: yes.
- TVN absent: yes.
- `IndustryMetric` created: no.
- Valuation/risk benchmark created: no.
- Ranking/scoring created: no.
- Forbidden advice wording introduced: no.
- `productionApprovedTrueCount=0`.
- Missing values remain null/N/A/needs_review.
- Total debt was not mapped from total liabilities.

## Validation

- `npx eslint scripts/dry-run-core-ticker-reviewed-screening-source-import.ts` - passed.
- `npx tsx scripts/dry-run-core-ticker-reviewed-screening-source-import.ts` - passed.
- `npx prisma validate` - passed.
- `npx prisma generate` - passed.
- `npm run typecheck` - passed.

## Next Recommended Phase

No ticker is fully ready for source confirm-write yet.

Recommended next step: manually collect or prepare reviewed source packages for the missing upstream source categories, especially:

- reviewed `Company` metadata packages for the six core tickers;
- reviewed `MarketPrice` packages for the six core tickers;
- reviewed `CompanyIndustry` packages for `FPT`, `MSN`, and `VCB` only if the product explicitly wants those tickers represented in Screening without unsupported inference;
- reviewed `FinancialStatement` source package for `VCB`, or leave `VCB` missing_safe.
