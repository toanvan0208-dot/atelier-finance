# Phase 159H - IndustryMetric Controlled Write Trial

## Goal

Write the five reviewed Layer 5 metric rows from Phase 159G into the local DB as research-only data.

This is not production approval and not a UI/Assistant release.

## Scope

- DB write: yes.
- `IndustryMetric` write: yes.
- `IndustryMetricProvenance` write: yes.
- Schema change: no.
- Migration creation: no.
- Provider fetch: no.
- Raw source import: no.
- UI change: no.
- Assistant prompt change: no.
- Benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output: no.

## Script

Created:

- `scripts/confirm-write-industry-metric-controlled-trial.ts`

The script is idempotent. It uses the unique key:

- `industryCode`
- `metricCode`
- `observationDate`
- `sourceKey`

Running it again updates the same five rows instead of creating duplicates.

## Rows Written

Five `IndustryMetric` rows and five matching `IndustryMetricProvenance` rows are written.

| Industry | Metric | Value | Unit | Period |
| --- | --- | ---: | --- | --- |
| `STEEL_MATERIALS` | `STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION` | 159.9 | million tonnes | 2026-03 |
| `STEEL_MATERIALS` | `STEEL_GLOBAL_CRUDE_STEEL_PRODUCTION_YOY` | -4.2 | percent | 2026-03 |
| `RETAIL` | `RETAIL_SALES_VALUE_CURRENT_PRICE` | 2546 | VND trillion | 2026-04 YTD |
| `RETAIL` | `RETAIL_SALES_VALUE_YOY_CURRENT_PRICE` | 11.1 | percent | 2026-04 YTD |
| `RETAIL` | `RETAIL_SALES_REAL_GROWTH` | 6.3 | percent | 2026-04 YTD |

## Safety State

Every written row remains:

- `dataMode=research_only`
- `productionApproved=false`
- `needsReview=true`
- `qualityStatus=needs_review`

No raw PDF is committed. The DB only stores source metadata, source key, page note, and reviewed metric values.

## Guardrail Result

Expected script output:

- `phase=159H`
- `mode=industry_metric_controlled_write_trial`
- `dbWriteAttempted=true`
- `industryMetricWriteAttempted=true`
- `industryMetricProvenanceWriteAttempted=true`
- `schemaChanged=false`
- `migrationCreated=false`
- `providerFetchAttempted=false`
- `rawSourceImportAttempted=false`
- `controlledRowsPlanned=5`
- `after.eligibleIndustryMetricRows=5`
- `after.eligibleIndustryMetricProvenanceRows=5`
- `after.productionApprovedTrueCount=0`
- `readyForRealMetricImport=false`
- `auditPassed=true`

## Deferred Items

Still deferred:

- Steel domestic construction price range needs min/max split.
- Retail gross margin still needs a reviewed source.
- Dairy-specific industry metrics still need a cleaner source.

## Conclusion

Layer 5 now has a small controlled local data seed for reviewed industry metrics.

The data is still research-only and review-gated.

## Recommended Next Phase

Phase 159I - IndustryMetric Read Path Dry Run.

That phase should verify the API/service can read these rows safely without ranking, scoring, valuation output, or stock attractiveness language.
