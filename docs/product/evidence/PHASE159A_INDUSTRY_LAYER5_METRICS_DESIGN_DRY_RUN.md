# Phase 159A - Industry Layer 5 Metrics Design Dry Run

## Goal

Design the first safe Layer 5 metric candidates for the Industry module before any schema change, provider fetch, or metric import.

## Scope

- Dry-run only.
- No DB write.
- No schema change.
- No provider fetch.
- No raw source import.
- No `IndustryMetric` write.
- No ranking, scoring, trading signal, stock attractiveness score, target price, fair value, upside, or downside.
- Missing values remain N/A until a source-backed metric pipeline exists.

## Current State

The dry run confirmed that the three target industries have Layer 4 qualitative context available:

- `STEEL_MATERIALS` / HPG
- `RETAIL` / MWG
- `CONSUMER_STAPLES_DAIRY` / VNM

Current counts from the dry run:

- `Industry`: 3
- `CompanyIndustry`: 3
- `IndustryContext`: 6
- `IndustryContextProvenance`: 6
- `IndustryMetric`: 0
- `productionApprovedTrueCount`: 0

Important blocker:

- `IndustryMetric` schema is not present in `prisma/schema.prisma`.

Because of that, Layer 5 is not ready for real metric import yet.

## Proposed Metric Design

### STEEL_MATERIALS

Candidate metrics:

- `STEEL_APPARENT_CONSUMPTION`
- `STEEL_FINISHED_SALES_VOLUME`
- `STEEL_EXPORT_VOLUME_OR_VALUE`
- `STEEL_PRICE_INDEX`
- `IRON_ORE_COAL_INPUT_COST`

Purpose:

- Confirm demand, volume, export exposure, price pressure, and input-cost pressure.
- These metrics should be descriptive time-series/check metrics only.

### RETAIL

Candidate metrics:

- `RETAIL_SALES_INDEX`
- `RETAIL_SAME_STORE_SALES`
- `RETAIL_GROSS_MARGIN`
- `RETAIL_INVENTORY_TURNOVER`
- `RETAIL_SELLING_EXPENSE_RATIO`

Purpose:

- Confirm purchasing power, real demand, margin, inventory pressure, and operating-cost pressure.
- If same-store sales data is unavailable, the value should remain N/A.

### CONSUMER_STAPLES_DAIRY

Candidate metrics:

- `CONSUMER_STAPLES_RETAIL_SALES`
- `DAIRY_REVENUE_GROWTH`
- `DAIRY_GROSS_MARGIN`
- `MILK_INPUT_COST_INDEX`
- `SELLING_EXPENSE_RATIO`

Purpose:

- Confirm household demand, dairy revenue direction, margin pressure, input costs, and distribution/selling-cost pressure.
- Broad consumer metrics must remain needs-review when used for the dairy lane.

## Safety Rules For Layer 5

Layer 5 should show:

- Metric name
- Value
- Unit
- Period
- Source label
- Data mode
- Review status
- Missing/N/A state
- Plain-language interpretation of what the metric helps check

Layer 5 should not show:

- Stock ranking
- Stock scoring
- Trading signal
- Stock attractiveness
- Target price
- Fair value
- Upside/downside
- Automated good/bad investment conclusion

## Validation

Commands passed:

- `npx eslint scripts/dry-run-industry-layer5-metrics-design.ts`
- `npx tsx scripts/dry-run-industry-layer5-metrics-design.ts`

Dry-run output confirmed:

- `dbWriteAttempted=false`
- `schemaChanged=false`
- `providerFetchAttempted=false`
- `rawSourceImportAttempted=false`
- `industryMetricWriteAttempted=false`
- `industryMetricModelPresent=false`
- `industryMetricRows=0`
- `productionApprovedTrueCount=0`
- `forbiddenAdviceDetected=false`
- `layer5ReadyForImport=false`
- `auditPassed=true`

## Conclusion

Layer 5 should not be imported yet. The safe next move is to design the `IndustryMetric` schema contract first, then review metric sources and permissions before any data write.

## Recommended Next Phase

Phase 159B - IndustryMetric Schema Design Dry Run.

This phase should design the storage contract for source-backed industry metrics, including units, period alignment, provenance, missing-value handling, review status, and UI read-path rules. It should still avoid real DB writes and provider fetches.
