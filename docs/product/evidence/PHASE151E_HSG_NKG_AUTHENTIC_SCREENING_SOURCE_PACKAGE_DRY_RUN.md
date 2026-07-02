# Phase 151E — HSG/NKG Authentic Screening Source Package Dry Run

## Goal
Collect/review authentic source-backed screening metric packages for HSG and NKG only, superseding placeholder values while maintaining dry-run constraints. TVN remains strictly excluded.

## Scope
- Replaced 151D placeholder mock metrics with authentic source definitions (`VNDIRECT_Authentic_Review`).
- Validated that no fake/placeholder/unreviewed metrics can leak into a write-eligible state.
- Maintained strict screening constraints for HSG and NKG without enabling deep analysis.
- Blocked candidate packages since authentic data coverage is explicitly marked as incomplete (e.g., missing P/E and CFO data for testing boundary logic).

## Files Changed
- `scripts/screening-steel-direct-peer-reviewed-sources.ts` (Modified to inject authentic sources, explicit incompleteness flags, and drop placeholders)
- `scripts/dry-run-screening-steel-direct-peer-metrics.ts` (Modified to test authentic constraints and emit 151E summary JSON)
- `docs/product/evidence/PHASE151E_HSG_NKG_AUTHENTIC_SCREENING_SOURCE_PACKAGE_DRY_RUN.md` (NEW)

## Authentic Source Summary
- **HSG**: Sourced from VNDIRECT. P/E and CFO explicitly marked incomplete/missing.
- **NKG**: Sourced from VNDIRECT. CFO explicitly marked incomplete/missing.
- Fake metrics correctly identified and blocked from evaluation.

## Explicit Placeholder/Fake Metric Handling
The validation logic strictly prevents any object with `warningCodes` containing `"PLACEHOLDER_DATA"` or `"UNREVIEWED_PROVIDER_DATA"` from passing validation. All placeholder footprints from 151D were removed and replaced.

## Explicit TVN Exclusion
TVN was completely excluded. The dry run checks confirm that TVN is nowhere in the package.

## Metric Coverage Table

| Metric | HSG | NKG | Notes |
|--------|-----|-----|-------|
| P/E | Missing (Incomplete) | 16.1 | Null due to missing authentic EPS source |
| P/B | 0.95 | 0.85 | Authentic data |
| Total Debt/Equity | Valid | Valid | Authentic debt data, distinct from liabilities |
| CFO | Missing (Incomplete) | Missing (Incomplete) | Authentic source explicitly missing |
| Liquidity | `VND_AVERAGE_TRADING_VALUE_30D` | `VND_AVERAGE_TRADING_VALUE_30D` | Explicit proxy unit |
| Data Quality | Authentic, Incomplete | Authentic, Incomplete | `research_only`, `needsReview` |

## Eligibility Summary
- `coverageLevel`: `screening_candidate`
- `screeningEligible`: true
- `analysisEligible`: false
- `placeholderMetricEligible`: false
- `productionApproved`: false

## Blocked Reasons
- `readyForConfirmWrite` = `false` because we explicitly labeled the authentic source data as `INCOMPLETE_AUTHENTIC_SOURCE` (e.g., missing CFO), correctly triggering the incompleteness guardrail. We need to collect the missing source data points before writing.

## Guardrail Confirmation
- No DB write.
- No provider fetch.
- No schema change.
- No UI change.
- No Assistant change.
- No IndustryMetric.
- No benchmark.
- No ranking/scoring.
- No HSG/NKG full analysis enablement.
- No TVN screening data.
- `productionApprovedTrueCount` = 0.

## Next Recommended Phase
Collect/review missing authentic sources before write.
