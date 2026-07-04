# Phase 159C - IndustryMetric Schema + Controlled Seed Dry Run

## Goal

Combine the next Layer 5 planning steps without making a risky production jump.

This phase drafts the future `IndustryMetric` schema shape and prepares a controlled seed plan for the first three supported industries:

- `STEEL_MATERIALS`
- `RETAIL`
- `CONSUMER_STAPLES_DAIRY`

## Scope

- No DB write.
- No schema change.
- No migration creation.
- No provider fetch.
- No raw source import.
- No real metric import.
- No UI change.
- No Assistant prompt change.
- No benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output.
- No fake metric value.
- Missing numeric values remain null with `missingReason`.

## Current State

Current `prisma/schema.prisma` has `Industry`, `CompanyIndustry`, `IndustryContext`, and `IndustryContextProvenance`.

It does not yet have:

- `IndustryMetric`
- `IndustryMetricProvenance`

That means Layer 5 cannot safely store numeric industry observations yet.

## Schema Draft

The dry-run script proposes two future models:

- `IndustryMetric`
- `IndustryMetricProvenance`

The schema draft is emitted by:

- `scripts/dry-run-industry-metric-schema-controlled-seed.ts`

Important design choices:

- `value` is nullable.
- `missingReason` explains missing values.
- `dataMode` defaults to `research_only`.
- `productionApproved` defaults to `false`.
- `needsReview` defaults to `true`.
- uniqueness is by `industryCode`, `metricCode`, `observationDate`, and `sourceLabel`.
- provenance is separated from the metric row.

This phase did not edit `prisma/schema.prisma`.

## Controlled Seed Plan

The seed plan is not a real DB seed yet. It is a dry-run list of metric identities that the system may later support.

Planned placeholder rows:

| Industry | Example ticker | Metric |
| --- | --- | --- |
| `STEEL_MATERIALS` | HPG | `STEEL_FINISHED_SALES_VOLUME` |
| `STEEL_MATERIALS` | HPG | `STEEL_PRICE_REFERENCE` |
| `STEEL_MATERIALS` | HPG | `STEEL_INPUT_COST_REFERENCE` |
| `RETAIL` | MWG | `RETAIL_SALES_INDEX` |
| `RETAIL` | MWG | `RETAIL_GROSS_MARGIN` |
| `RETAIL` | MWG | `RETAIL_INVENTORY_DAYS` |
| `CONSUMER_STAPLES_DAIRY` | VNM | `DAIRY_REVENUE_GROWTH` |
| `CONSUMER_STAPLES_DAIRY` | VNM | `DAIRY_GROSS_MARGIN` |
| `CONSUMER_STAPLES_DAIRY` | VNM | `DAIRY_INPUT_COST_REFERENCE` |

All planned rows keep:

- `value = null`
- `productionApproved = false`
- `needsReview = true`
- `missingReason` present

Reason: the local PDF reports may help later, but numeric extraction still needs a reviewed source step before any number is written as real data.

## Why This Is Safer Than One Big Layer 5 Jump

This phase combines schema planning and seed planning, but still avoids three risky actions:

- applying a migration
- writing numeric observations
- showing metrics in UI or Assistant output

That keeps the system from accidentally treating unreviewed numbers as real industry data.

## Guardrail Result

Script result should show:

- `phase=159C`
- `mode=schema_plus_controlled_seed_dry_run`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `migrationCreated=false`
- `providerFetchAttempted=false`
- `rawSourceImportAttempted=false`
- `industryMetricWriteAttempted=false`
- `seedRowsWithNumericValue=0`
- `seedRowsProductionApproved=0`
- `seedRowsNotNeedsReview=0`
- `seedRowsMissingReasonAbsent=0`
- `fakeMetricValueIntroduced=false`
- `readyForRealMetricImport=false`
- `auditPassed=true`

## Conclusion

Layer 5 is still not active.

What is now ready:

- draft model shape
- first controlled metric identity list
- missing-value rules
- provenance expectations
- safety checks for future import

What is still missing:

- actual schema migration decision
- reviewed source extraction
- unit and period review
- controlled DB write phase
- UI read path
- Assistant read path

## Recommended Next Phase

Phase 159D - IndustryMetric Migration Draft Review Or Apply Decision.

This next phase should decide whether to apply the `IndustryMetric` schema migration locally, still without importing real metric values.
