# Phase 151D — HSG/NKG Screening Metric Source Package Dry Run

## Goal
Prepare source-backed candidate packages for HSG/NKG screening-level metrics only, without writing DB and without enabling deep analysis. This phase is dry-run only.

## Scope
- Define source package shape for `screening_candidate`.
- Implement validation script with strict constraints.
- Exclude TVN completely.

## Files Changed
- `scripts/screening-steel-direct-peer-reviewed-sources.ts` (NEW)
- `scripts/dry-run-screening-steel-direct-peer-metrics.ts` (NEW)
- `docs/product/evidence/PHASE151D_HSG_NKG_SCREENING_METRIC_SOURCE_PACKAGE_DRY_RUN.md` (NEW)

## Source Package Summary
- **HSG**: Hoa Sen Group (`STEEL_MATERIALS`, `direct_peer`)
- **NKG**: Nam Kim Steel (`STEEL_MATERIALS`, `direct_peer`)

## Explicit TVN Exclusion
TVN has been systematically omitted from candidate packages and an explicit safeguard prevents it from passing validation.

## Metric Coverage Table

| Metric | HSG Candidate Status | NKG Candidate Status | Expected Behavior |
|--------|----------------------|----------------------|-------------------|
| **P/E** | Null (Assume EPS <= 0) | Defined value | Preserved as null/N/A if missing/EPS<=0 |
| **P/B** | Defined value | Defined value | - |
| **Total Debt/Equity** | Defined debt & ratio | Defined debt & ratio | Uses explicit debt, not total liabilities |
| **CFO** | Defined value | Defined value | - |
| **Liquidity** | `VND_TRADING_VALUE` | `VND_TRADING_VALUE` | Distinct proxy specified |
| **Data Quality** | `research_only`, `needsReview` | `research_only`, `needsReview` | Contains appropriate `warningCodes` |

## Eligibility Summary
- `coverageLevel`: `screening_candidate`
- `screeningEligible`: true
- `analysisEligible`: false
- `productionApproved`: false

## Blocked Reasons
- `readyForConfirmWrite` = `false` because we only created a structural mock with "fake" realistic metrics for contract verification. We need to collect or review authentic source packages before allowing a confirm-write.

## Guardrail Confirmation
- No DB write.
- No provider fetch.
- No schema change.
- No UI change.
- No Assistant behavior change.
- No IndustryMetric.
- No valuation/risk benchmark.
- No stock ranking/scoring.
- No HSG/NKG full analysis enablement.
- No TVN screening data.
- `productionApprovedTrueCount` = 0.

## Next Recommended Phase
Phase 151E — Collect/review missing authentic source packages before confirm-write.
