# Phase 159B - IndustryMetric Schema Design Dry Run

## Goal

Design the safe database shape for future Industry Layer 5 metrics before any real schema migration or metric import.

This phase is intentionally dry-run only. It answers: "If we later store numeric industry data, what must the schema protect?"

## Scope

- No DB write.
- No schema change.
- No migration creation.
- No provider fetch.
- No raw source import.
- No Industry write.
- No IndustryMetric write.
- No UI change.
- No Assistant prompt change.
- No benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output.
- Missing values stay null or N/A with a missing reason.

## Current Schema State

`prisma/schema.prisma` currently has:

- `Industry`: exists.
- `CompanyIndustry`: exists.
- `IndustryContext`: exists.
- `IndustryContextProvenance`: exists.
- `DataSource`: exists.
- `IndustryMetric`: not present.
- `IndustryMetricProvenance`: not present.

Conclusion: the app has Layer 4 qualitative context storage, but it does not yet have a formal Layer 5 metric table.

## Proposed Schema Contract

### IndustryMetric

Purpose: one reviewed numeric industry observation per industry, metric, period, and source.

Required fields:

- `id`
- `industryCode`
- `metricCode`
- `metricName`
- `metricLabelVi`
- `metricGroup`
- `value`
- `unit`
- `periodType`
- `periodLabel`
- `observationDate`
- `sourceLabel`
- `sourceUrl`
- `dataMode`
- `productionApproved`
- `needsReview`
- `qualityStatus`
- `missingReason`
- `warningCodes`
- `createdAt`
- `updatedAt`

Default review state:

- `dataMode = research_only`
- `productionApproved = false`
- `needsReview = true`

Missing value rule:

- `value` may be null.
- If `value` is null, `missingReason` should explain why.
- Never write `0` just because a number is missing.

Recommended uniqueness/index shape:

- `@@unique([industryCode, metricCode, observationDate, sourceLabel])`
- `@@index([industryCode])`
- `@@index([metricCode])`
- `@@index([observationDate])`
- `@@index([dataMode])`
- `@@index([productionApproved])`
- `@@index([needsReview])`

### IndustryMetricProvenance

Purpose: source and review evidence for each metric row.

Required fields:

- `id`
- `industryMetricId`
- `industryCode`
- `metricCode`
- `observationDate`
- `sourceLabel`
- `sourceUrl`
- `sourceType`
- `publicationDate`
- `retrievedAt`
- `dataMode`
- `productionApproved`
- `needsReview`
- `payloadChecksum`
- `evidenceNotes`
- `warningCodes`
- `createdAt`
- `updatedAt`

Recommended uniqueness/index shape:

- `@@unique([industryMetricId, sourceLabel, sourceUrl])`
- `@@index([industryMetricId])`
- `@@index([industryCode])`
- `@@index([metricCode])`
- `@@index([observationDate])`
- `@@index([sourceLabel])`
- `@@index([dataMode])`
- `@@index([productionApproved])`

Raw source rule:

- Do not commit raw PDF, CSV, JSON, or manual input files.
- Store only source metadata, short review notes, and checksum-like traceability fields.

## UI Read-Path Rules For Later

When Layer 5 is actually wired, the UI should show:

- metric label
- value
- unit
- period
- source
- review state
- N/A when value is missing

The UI should not turn metrics into automatic conclusions. A metric is only a data point to check, not a final investment answer.

## Assistant Rules For Later

If the Assistant later reads industry metrics, it may:

- explain what a metric means
- explain what changed period to period
- suggest which source or company filing to verify next

It must keep outputs descriptive, review-gated, and source-aware.

## Guardrail Audit

This dry run introduced:

- DB writes: no
- Schema change: no
- Migration: no
- Provider fetch: no
- Raw source import: no
- IndustryMetric rows: no
- Benchmark/ranking/scoring: no
- Trading/valuation output: no
- Stock attractiveness output: no
- Fake metric fallback as real: no

## Script Output

Script created:

- `scripts/dry-run-industry-metric-schema-design.ts`

Required output fields include:

- `phase=159B`
- `mode=dry_run_schema_design_only`
- `industryMetricModelPresent`
- `industryMetricProvenanceModelPresent`
- `proposedModels`
- `uiReadPathRules`
- `assistantRules`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `providerFetchAttempted=false`
- `industryMetricWriteAttempted=false`
- `readyForRealMetricImport=false`
- `auditPassed`

## Current Conclusion

The right next system step is not real metric import yet.

The next safe step is to draft the migration shape without applying it, so the project can review naming, uniqueness, null rules, provenance, and guardrails before any database change.

## Recommended Next Phase

Phase 159C - IndustryMetric Migration Draft Dry Run.
