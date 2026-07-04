# Phase 159G - Reviewed IndustryMetric Source Mapping

## Goal

Review the PDF extraction candidates from Phase 159F and decide which numeric observations are clean enough for a controlled write trial.

This phase does not write DB rows.

## Scope

- No DB write.
- No schema change.
- No migration creation.
- No provider fetch.
- No raw source import.
- No `IndustryMetric` write.
- No `IndustryMetricProvenance` write.
- No UI change.
- No Assistant prompt change.
- No benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output.

## Script

Created:

- `scripts/review-industry-metric-source-mapping.ts`

The script classifies reviewed mappings into:

- `eligible_for_write_trial`
- `needs_metric_split`
- `needs_manual_review`
- `not_eligible`

All rows remain:

- `productionApproved=false`
- `needsReview=true`

## Eligible For Controlled Write Trial

Five rows are eligible for the next controlled write trial:

| Industry | Proposed metric | Value | Unit | Period |
| --- | --- | ---: | --- | --- |
| `STEEL_MATERIALS` | `STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION` | 159.9 | million tonnes | 2026-03 |
| `STEEL_MATERIALS` | `STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION_YOY` | -4.2 | percent | 2026-03 |
| `RETAIL` | `RETAIL_SALES_VALUE_CURRENT_PRICE` | 2546 | VND trillion | 2026-04 YTD |
| `RETAIL` | `RETAIL_SALES_VALUE_YOY_CURRENT_PRICE` | 11.1 | percent | 2026-04 YTD |
| `RETAIL` | `RETAIL_SALES_REAL_GROWTH` | 6.3 | percent | 2026-04 YTD |

These are eligible only for a controlled local write trial, not production approval.

## Deferred Or Blocked

Deferred:

- `STEEL_DOMESTIC_CONSTRUCTION_PRICE_CHANGE_RANGE`: the PDF gives a price-change range. The current metric table stores one numeric value, so this needs min/max metric split or a range convention.
- `RETAIL_GROSS_MARGIN`: no reliable gross margin source was found in the retail PDF dry run.
- `DAIRY_REVENUE_GROWTH`: the consumer staples PDF has broad and company context, but the dry run did not isolate a dairy-specific industry metric.

## Important Review Notes

Some Phase 159F candidates did not map cleanly to the original 9 metric identities.

Example:

- The steel PDF provided global crude steel production, not HPG sales volume.
- The retail PDF provided total retail sales value and growth, not a generic index.
- The consumer staples PDF did not provide a clean dairy-specific metric in the dry run.

So Phase 159G intentionally proposes clearer metric codes instead of forcing unclear source data into the older placeholder names.

## Guardrail Result

Expected script output:

- `phase=159G`
- `mode=reviewed_industry_metric_source_mapping_dry_run`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `migrationCreated=false`
- `providerFetchAttempted=false`
- `rawSourceImportAttempted=false`
- `industryMetricWriteAttempted=false`
- `industryMetricProvenanceWriteAttempted=false`
- `eligibleForWriteTrialCount=5`
- `productionApprovedTrueCount=0`
- `needsReviewFalseCount=0`
- `readyForControlledWriteTrial=true`
- `readyForRealMetricImport=false`
- `auditPassed=true`

## Conclusion

Layer 5 now has:

- schema
- source extraction dry run
- reviewed source mapping

It still does not have metric DB rows.

The next safe step is a controlled write trial for the five reviewed rows, with `research_only`, `needsReview=true`, and `productionApproved=false`.

## Recommended Next Phase

Phase 159H - IndustryMetric Controlled Write Trial.
