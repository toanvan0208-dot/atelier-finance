# Phase 151B - Industry Tier 4 full qualitative context milestone

## Goal

Complete qualitative Industry Tier 4 for the existing reviewed Industry milestone scope only:

- `HPG` / `STEEL_MATERIALS`
- `MWG` / `RETAIL`
- `VNM` / `CONSUMER_STAPLES_DAIRY`

Unsupported tickers remain missing-safe:

- `FPT`
- `VCB`
- `MSN`

## Scope

Phase 151B completed the source-backed qualitative context fields that were intentionally left out of the Phase 151A database/read-path contract:

- `howIndustryMakesMoney`
- `macroSensitivity`
- `nextChecks`
- `commonMisread`

The phase did not add reviewed industries, unsupported ticker taxonomy, Retail peer groups, VNM peer groups, IndustryMetric rows, valuation benchmarks, risk benchmarks, provider fetches, or UI redesigns.

## Files Changed

- `prisma/schema.prisma`
- `prisma/migrations/20260702093000_add_full_industry_qualitative_context/migration.sql`
- `scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts`
- `scripts/smoke-industry-qualitative-context-full-read-path.ts`
- `src/features/industry/lib/load-industry-context.ts`
- `src/features/industry/components/IndustryCompassSections.tsx`
- `src/app/api/assistant/route.ts`
- `docs/product/evidence/PHASE151B_INDUSTRY_TIER4_FULL_QUALITATIVE_CONTEXT_MILESTONE.md`

## Schema And Migration Summary

Added four nullable text columns to `IndustryContext`:

- `howIndustryMakesMoney`
- `macroSensitivity`
- `nextChecks`
- `commonMisread`

The list-shaped fields use JSON-string storage consistent with the existing `keyDrivers` and `industryRisks` representation. No unrelated models were changed, and no IndustryMetric or benchmark table was created.

Migration applied:

- `20260702093000_add_full_industry_qualitative_context`

## Confirm-Write/Update Summary

The confirm-write script still defaults to no-write dry-run mode unless `--confirm-write` is supplied.

Pre-write dry-run:

- `phase=151B`
- `confirmWrite=false`
- `dbReadAttempted=true`
- `dbWriteAttempted=false`
- `schemaChanged=true`
- `contextRowsCreated=0`
- `contextRowsUpdated=0`
- `provenanceRowsCreated=0`
- `provenanceRowsUpdated=0`
- `fullQualitativeContextRowsAfter=0`
- `contextRowsAfter=3`
- `provenanceRowsAfter=3`
- `productionApprovedTrueCount=0`
- `smokePassed=true`

Confirmed update:

- `confirmWrite=true`
- `dbWriteAttempted=true`
- `contextRowsCreated=0`
- `contextRowsUpdated=3`
- `provenanceRowsCreated=0`
- `provenanceRowsUpdated=3`
- `fullQualitativeContextRowsAfter=3`
- `contextRowsAfter=3`
- `provenanceRowsAfter=3`
- `productionApprovedTrueCount=0`
- `industryMetricCreated=false`
- `benchmarkCreated=false`
- `valuationRiskBenchmarkInvented=false`
- `retailPeerGroupCreated=false`
- `vnmPeerGroupCreated=false`
- `unsupportedTickerInference=false`
- `staticGuidanceTreatedAsReviewedQualitativeContext=false`
- `smokePassed=true`

Rows updated:

- `HPG` / `STEEL_MATERIALS`
- `MWG` / `RETAIL`
- `VNM` / `CONSUMER_STAPLES_DAIRY`

All rows remain:

- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`

## Idempotency Result

Rerunning confirm-write with `--confirm-write` created no duplicate rows:

- `contextRowsCreated=0`
- `contextRowsUpdated=3`
- `provenanceRowsCreated=0`
- `provenanceRowsUpdated=3`
- `fullQualitativeContextRowsAfter=3`
- `contextRowsAfter=3`
- `provenanceRowsAfter=3`
- `productionApprovedTrueCount=0`
- `smokePassed=true`

## Full Read-Path/API/Assistant/UI Smoke Summary

`scripts/smoke-industry-qualitative-context-full-read-path.ts` passed:

- `HPG` reads full source-backed qualitative context for `STEEL_MATERIALS`.
- `MWG` reads full source-backed qualitative context for `RETAIL`.
- `VNM` reads full source-backed qualitative context for `CONSUMER_STAPLES_DAIRY`.
- `FPT`, `VCB`, and `MSN` remain missing-safe.
- Company API exposes full fields only for mapped reviewed tickers.
- Assistant prompt includes full fields only for mapped reviewed tickers.
- Assistant and runtime caveats include `research_only`, `needsReview`, not investment advice, not valuation/risk benchmark, and not peer benchmark.
- UI displays additive source-backed qualitative sections without redesign.
- Static compass guidance remains separate educational/static guidance, not reviewed qualitative context.

Smoke result:

- `fullQualitativeRows=3`
- `forbiddenAdviceDetected=false`
- `numericBenchmarkLanguageDetected=false`
- `unsupportedTickerContextDetected=false`
- `staticGuidanceTreatedAsReviewedQualitativeContext=false`
- `productionApprovedTrueCount=0`
- `industryMetricCreated=false`
- `benchmarkCreated=false`
- `retailPeerGroupCreated=false`
- `vnmPeerGroupCreated=false`
- `smokePassed=true`

Backward compatibility smokes also passed:

- `scripts/smoke-industry-qualitative-context-read-path.ts`
- `scripts/smoke-industry-ui-reviewed-coverage-alignment.ts`
- `scripts/smoke-industry-milestone-e2e.ts`

## Final Tier 4 Milestone Status

Industry Tier 4 qualitative context is complete within the bounded reviewed scope of exactly three industries and three mapped tickers:

- `STEEL_MATERIALS` via `HPG`
- `RETAIL` via `MWG`
- `CONSUMER_STAPLES_DAIRY` via `VNM`

The milestone is not generalized beyond this scope. Unsupported tickers remain missing-safe, and missing data remains unavailable rather than inferred or zero-filled.

## Guardrail Confirmation

- Provider fetch: no.
- IndustryMetric created: no.
- Valuation/risk benchmark created: no.
- `productionApproved=true`: no.
- Retail peer group: no.
- VNM peer group: no.
- Unsupported ticker inference: no.
- Static guidance treated as reviewed qualitative context: no.
- Buy/sell/hold recommendation: no.
- Trading signal: no.
- Target price, fair value, upside, or downside advice: no.

## Validation Commands

- `npx eslint scripts/industry-qualitative-context-reviewed-sources.ts scripts/dry-run-industry-qualitative-context-reviewed-sources.ts scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts scripts/smoke-industry-qualitative-context-read-path.ts scripts/smoke-industry-qualitative-context-full-read-path.ts src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts`
- `npx prisma validate`
- `npx prisma generate`
- `npx prisma migrate deploy`
- `npx tsx scripts/dry-run-industry-qualitative-context-reviewed-sources.ts`
- `npx tsx scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts`
- `npx tsx scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts --confirm-write`
- `npx tsx scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts --confirm-write`
- `npx tsx scripts/smoke-industry-qualitative-context-full-read-path.ts`
- `npx tsx scripts/smoke-industry-qualitative-context-read-path.ts`
- `npx tsx scripts/smoke-industry-ui-reviewed-coverage-alignment.ts`
- `npx tsx scripts/smoke-industry-milestone-e2e.ts`
- `npm run typecheck`

All commands passed. Staging Prisma/DB commands emitted existing TLS warnings only; they were not validation failures.
