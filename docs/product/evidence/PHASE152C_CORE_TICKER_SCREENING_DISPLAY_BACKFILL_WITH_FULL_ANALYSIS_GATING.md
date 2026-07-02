# Phase 152C — Screening Display Backfill For Six Core Tickers With Full Analysis Gating

## Goal
Backfill `ScreeningCandidate` rows for six core tickers (FPT, HPG, VNM, MSN, MWG, VCB) to populate the Screening module for a complete-looking stock filter interface, strictly gating full analysis features for display-only tickers.

## Product Intent
Ensure that showing a ticker in the Screening module does not automatically render it eligible for deep analysis. 
- **FPT, MSN, VCB**: Must be visible in Screening but strictly "display-only" (`analysisEligible=false`).
- **HPG, VNM, MWG**: Visible in Screening and optionally `analysisEligible=true` only if the prerequisite dataset (Company, MarketPrice, FinancialStatement, CompanyIndustry) is fully present.

## Scope
- Backfilled `ScreeningCandidate` records for FPT, HPG, VNM, MSN, MWG, VCB.
- Added basic metrics (closePrice, volume, tradingValue/liquidity) derived directly from existing `MarketPrice` to the `ScreeningCandidateMetric` table.
- Read existing `Company`, `MarketPrice`, `FinancialStatement`, `CompanyIndustry` records to determine analysis eligibility.
- Zero mutations to existing schemas or `Company`, `MarketPrice`, `DataSource`, `FinancialStatement`, or `CompanyIndustry` rows.
- Left existing HSG and NKG `ScreeningCandidate` data untouched. TVN remains absent.
- Did not introduce `IndustryMetric` or any benchmark, ranking, score, or forbidden advice terms.

## Files Changed
- `scripts/confirm-write-core-ticker-screening-display-backfill.ts`
- `scripts/smoke-core-ticker-screening-display-backfill-read-path.ts`
- `docs/product/evidence/PHASE152C_CORE_TICKER_SCREENING_DISPLAY_BACKFILL_WITH_FULL_ANALYSIS_GATING.md`

## ScreeningCandidate Model & Storage Note
The core mechanism separating "Screening display" and "Full analysis" utilizes existing fields on `ScreeningCandidate`:
- `screeningEligible`: true (visible in Screening)
- `analysisEligible`: boolean (unlocks deep analysis modules)
- `coverageLevel`: "full_analysis_candidate" or "screening_candidate"
- `warningCodes` & `caveats`: Highlight `RESEARCH_ONLY`, `NEEDS_REVIEW`, and either `FULL_ANALYSIS` or `DISPLAY_ONLY`.

## Current Source Availability by Ticker & Gating
- **FPT, MSN, VCB**: Forced to display-only. `analysisEligible=false`.
- **HPG, VNM, MWG**: Evaluated against available base records. For example, if a ticker has Company, MarketPrice, FinancialStatement, and CompanyIndustry records, it qualifies for `analysisEligible=true`. Otherwise, it falls back to display-only.

## Execution Results

### Dry-run Result
Successfully validated candidates across the 6 tickers based on local data without initiating database writes.

### Confirm-write Result
Created/updated 6 `ScreeningCandidate` rows for FPT, HPG, VNM, MSN, MWG, VCB, alongside safe ScreeningCandidateMetrics derived from available MarketPrice records.

### Idempotency Rerun Result
A second run verified that updating existing `ScreeningCandidate`s operates identically without duplicates. Metric creation handled duplicates by purging and rewriting linked metric rows to maintain idempotency.

### Read-path Smoke Result
Verified `ScreeningCandidate` presence. FPT, MSN, and VCB remained `analysisEligible=false` (display-only). TVN absent. No benchmarks or rankings created. Verified unchanged state for HSG and NKG.

## Rows Written by Ticker
- FPT
- HPG
- VNM
- MSN
- MWG
- VCB

## Metrics Stored by Ticker
Metrics created in `ScreeningCandidateMetric` depending on `MarketPrice` values available:
- `CLOSE_PRICE`
- `VOLUME`
- `LIQUIDITY`

## Missing Fields & Warning Summary by Ticker
All inserted metrics were flagged with `["MARKET_PRICE_SNAPSHOT", "RESEARCH_ONLY"]`.
The candidates themselves possess `["RESEARCH_ONLY", "NEEDS_REVIEW", ...]`. 
Missing target fields like fully validated EPS/CFO remain omitted to avoid zero-filling.

## Confirmations
- **FPT/MSN/VCB remain display-only**: Confirmed.
- **HPG/VNM/MWG unlock deeper analysis based on source eligibility**: Confirmed.
- **No schema change**: Confirmed.
- **No provider fetch**: Confirmed.
- **No UI change**: Confirmed. Unrelated dirty files were skipped.
- **No Assistant change**: Confirmed.
- **No Company write**: Confirmed.
- **No MarketPrice write**: Confirmed.
- **No DataSource write**: Confirmed.
- **No FinancialStatement write**: Confirmed.
- **No CompanyIndustry write**: Confirmed.
- **HSG/NKG untouched**: Confirmed.
- **TVN absent**: Confirmed.
- **Raw JSON not committed**: Confirmed.
- **No ranking/scoring/benchmark**: Confirmed.
- **No IndustryMetric**: Confirmed.
- **No forbidden advice wording**: Confirmed.
- **productionApprovedTrueCount=0**: Confirmed.

## Next Recommended Phase
**Phase 152D** — Screening UI Smoke And Display-Only Deep-Link Guard Verification
