# Phase 159I - IndustryMetric Read Path Dry Run

## Goal

Verify that the five controlled Layer 5 metric rows can be read safely from the local DB.

This phase does not wire the metrics into UI or Assistant yet.

## Scope

- DB write: no.
- Schema change: no.
- Migration creation: no.
- Provider fetch: no.
- Raw source import: no.
- `IndustryMetric` write: no.
- `IndustryMetricProvenance` write: no.
- UI change: no.
- Assistant prompt change: no.
- Benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output: no.

## Script

Created:

- `scripts/dry-run-industry-metric-read-path.ts`

The script reads the five `sourceKey` values written in Phase 159H and builds a safe payload grouped by industry.

## Read Path Checks

The script verifies:

- all five expected metric rows are readable
- each row has provenance
- all rows are `dataMode=research_only`
- all rows are `needsReview=true`
- all rows are `qualityStatus=needs_review`
- no row is `productionApproved=true`
- no UI or Assistant behavior is changed

## Read Result

Expected industry grouping:

- `STEEL_MATERIALS`: 2 metrics
- `RETAIL`: 3 metrics
- `CONSUMER_STAPLES_DAIRY`: 0 metrics

This is expected because Phase 159G did not approve a clean dairy-specific metric for write trial.

## User-Facing Caveat

Every metric payload includes a caveat:

- research-only metric
- needs review
- not a benchmark
- not a score
- not an investment conclusion

## Guardrail Result

Expected script output:

- `phase=159I`
- `mode=industry_metric_read_path_dry_run`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `migrationCreated=false`
- `providerFetchAttempted=false`
- `rawSourceImportAttempted=false`
- `industryMetricWriteAttempted=false`
- `industryMetricProvenanceWriteAttempted=false`
- `metricRowsRead=5`
- `rowsWithoutProvenance=0`
- `rowsNotResearchOnly=0`
- `rowsProductionApproved=0`
- `rowsNotNeedsReview=0`
- `productionApprovedTrueCount=0`
- `safeReadPathPayloadAvailable=true`
- `readyForUiWiring=false`
- `readyForAssistantUse=false`
- `auditPassed=true`

## Conclusion

Layer 5 metrics can now be read safely from DB in a dry-run script.

They are still not wired into the product UI or Assistant.

## Recommended Next Phase

Phase 159J - IndustryMetric UI Read Path Wiring.

That phase should add a small UI read path for metrics, still clearly marked as research-only and review-gated.
