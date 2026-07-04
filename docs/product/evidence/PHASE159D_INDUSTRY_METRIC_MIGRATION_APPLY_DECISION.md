# Phase 159D - IndustryMetric Migration Draft Review Or Apply Decision

## Goal

Decide whether the project should apply the `IndustryMetric` migration now.

This phase reviews the migration draft and worktree state. It does not apply the migration.

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

## Decision

Do not apply the `IndustryMetric` migration in this phase.

Reason: the worktree already has unrelated schema and migration changes:

- `prisma/schema.prisma` is modified.
- `prisma/migrations/20260704103000_add_checklist_persistence/` is untracked.

Applying a new Industry migration on top of that state would risk mixing Layer 5 work with unrelated checklist/schema work.

## Current Schema State

Current schema check:

- `Industry`: present.
- `IndustryMetric`: not present.
- `IndustryMetricProvenance`: not present.

So the relation target exists, but the Layer 5 metric models are still absent.

## Draft Review

The dry-run script emits:

- Prisma model draft.
- SQL migration draft.
- apply/defer decision.
- blockers to applying the migration.

Script:

- `scripts/dry-run-industry-metric-migration-apply-decision.ts`

## Design Adjustment From Phase 159C

Phase 159C used `sourceUrl` in the uniqueness idea.

Phase 159D adjusts the draft to include `sourceKey`.

Reason: `sourceUrl` can be nullable. Nullable fields can weaken duplicate protection in unique constraints, depending on database behavior. `sourceKey` gives the future migration a required, stable source identity even when a source URL is missing.

Recommended uniqueness:

- `IndustryMetric`: `@@unique([industryCode, metricCode, observationDate, sourceKey])`
- `IndustryMetricProvenance`: `@@unique([industryMetricId, sourceKey])`

## Apply Decision Result

Expected script result:

- `phase=159D`
- `mode=migration_apply_decision_dry_run`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `migrationCreated=false`
- `providerFetchAttempted=false`
- `rawSourceImportAttempted=false`
- `industryMetricWriteAttempted=false`
- `applyMigrationNow=false`
- `readyForRealMetricImport=false`
- `auditPassed=true`

## What Is Ready

- The model shape is clear.
- Provenance is separate from metric rows.
- Missing values remain nullable.
- Default review state remains conservative.
- `sourceKey` solves the nullable-source uniqueness issue.

## What Is Not Ready

- The migration should not be applied while unrelated schema/migration work is dirty.
- No numeric extraction has been reviewed.
- No IndustryMetric rows should be written yet.
- UI and Assistant should not read Layer 5 metrics yet.

## Recommended Next Phase

Phase 159E - Clean-Worktree IndustryMetric Migration Apply.

That phase should apply the schema migration only after the unrelated schema and migration changes are either committed, moved aside, or explicitly included by the user.
