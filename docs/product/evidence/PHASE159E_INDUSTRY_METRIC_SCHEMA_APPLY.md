# Phase 159E - IndustryMetric Schema Migration Apply

## Goal

Create real local schema support for Layer 5 industry metrics, without importing any metric values yet.

## Scope

- Schema change: yes.
- Migration creation: yes.
- Local DB schema apply: yes.
- IndustryMetric data rows: no.
- Provider fetch: no.
- Raw source import: no.
- UI change: no.
- Assistant prompt change: no.
- Benchmark, ranking, score, trading signal, valuation output, or stock attractiveness output: no.

## What Changed

Added two schema models:

- `IndustryMetric`
- `IndustryMetricProvenance`

Added an `Industry.metrics` relation.

Added migration:

- `prisma/migrations/20260704134500_add_industry_metric_models/migration.sql`

Added confirmation script:

- `scripts/confirm-industry-metric-schema-apply.ts`

## Design

`IndustryMetric` stores one numeric industry observation per:

- industry
- metric
- observation date
- source key

`IndustryMetricProvenance` stores source and review evidence for the metric row.

Important safety defaults:

- `value` is nullable.
- `dataMode` defaults to `research_only`.
- `productionApproved` defaults to `false`.
- `needsReview` defaults to `true`.
- `qualityStatus` defaults to `needs_review`.
- `missingReason` remains available for null values.
- `sourceKey` is required and used in uniqueness rules.

## Local Apply

The migration SQL was applied directly with Prisma DB execute, then marked as applied in Prisma migration history:

- `npx prisma db execute --file prisma/migrations/20260704134500_add_industry_metric_models/migration.sql`
- `npx prisma migrate resolve --applied 20260704134500_add_industry_metric_models`

Reason: the worktree already contains unrelated checklist schema and migration work. Directly applying the specific IndustryMetric migration avoided mixing unrelated changes into this phase.

## Confirmation

The confirmation script checks:

- `IndustryMetric` model exists in `prisma/schema.prisma`.
- `IndustryMetricProvenance` model exists in `prisma/schema.prisma`.
- `IndustryMetric` table exists in local DB.
- `IndustryMetricProvenance` table exists in local DB.
- migration is marked applied.
- `IndustryMetric` row count is 0.
- `IndustryMetricProvenance` row count is 0.
- `productionApprovedTrueCount` is 0.

Expected result:

- `auditPassed=true`

## Guardrail Result

- Provider fetch: no.
- Raw source import: no.
- Real metric values imported: no.
- IndustryMetric data rows created: no.
- IndustryMetricProvenance data rows created: no.
- Benchmark/ranking/scoring introduced: no.
- Trading/valuation output introduced: no.
- Stock attractiveness output introduced: no.
- Fake metric value introduced: no.

## Current Layer 5 State

Layer 5 schema now exists locally.

Layer 5 data is still empty and not production-ready.

The system can now safely proceed to a controlled metric source extraction dry run.

## Recommended Next Phase

Phase 159F - IndustryMetric Source Extraction Dry Run.

That phase should read selected numeric candidates from the available industry PDFs, but still avoid DB writes until values, units, periods, and source permissions are reviewed.
