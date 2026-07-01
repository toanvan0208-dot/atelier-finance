# Phase 151A - Industry qualitative context confirm-write + read-path

## Goal

Write reviewed qualitative IndustryContext rows for exactly the three reviewed Industry milestone industries, then wire runtime/API/Assistant/UI read-paths so source-backed qualitative context is clearly separated from static educational compass guidance.

Reviewed industries remain exactly:

- `STEEL_MATERIALS`
- `RETAIL`
- `CONSUMER_STAPLES_DAIRY`

Unsupported tickers remain missing-safe:

- `FPT`
- `VCB`
- `MSN`

## Scope

- Added a guarded confirm-write script for the Phase 150Z reviewed source packages.
- Added a smoke script for qualitative context DB read-path, Company API, Assistant prompt context, UI/API caveats, and unsupported ticker missing-safe behavior.
- Updated the Industry runtime payload to mark whether qualitative context is source-backed by provenance.
- Updated the Industry UI caveat copy without redesign.
- Updated Assistant guardrails so source-backed qualitative context is eligible only for mapped reviewed tickers and remains non-advice.

No provider fetch, CSV import, schema change, IndustryMetric, valuation benchmark, risk benchmark, Retail peer group, or VNM peer group was introduced.

## Files Changed

- `scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts`
- `scripts/smoke-industry-qualitative-context-read-path.ts`
- `src/features/industry/lib/load-industry-context.ts`
- `src/features/industry/components/IndustryCompassSections.tsx`
- `src/app/api/assistant/route.ts`
- `docs/product/evidence/PHASE151A_INDUSTRY_QUALITATIVE_CONTEXT_CONFIRM_WRITE_READ_PATH.md`

## Confirm-Write Summary

The confirm-write script defaults to no-write dry-run mode unless `--confirm-write` is supplied.

Dry-run/no-write result:

- `confirmWrite=false`
- `dbReadAttempted=true`
- `dbWriteAttempted=false`
- `candidateContextPackages=3`
- `eligibleContextPackages=3`
- `blockedContextPackages=0`
- `contextRowsCreated=0`
- `contextRowsUpdated=0`
- `provenanceRowsCreated=0`
- `provenanceRowsUpdated=0`
- `productionApprovedTrueCount=0`
- `smokePassed=true`

Before confirmed write, the dry-run saw `contextRowsAfter=0` and `provenanceRowsAfter=0`. After confirmed write, rerunning default dry-run still performed no writes and saw the existing `contextRowsAfter=3` and `provenanceRowsAfter=3`.

Confirmed write result:

- `confirmWrite=true`
- `dbWriteAttempted=true`
- `contextRowsCreated=3`
- `contextRowsUpdated=0`
- `provenanceRowsCreated=3`
- `provenanceRowsUpdated=0`
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

Rows written:

- `HPG` / `STEEL_MATERIALS` from World Steel Association raw materials fact sheet
- `MWG` / `RETAIL` from BLS Retail Trade sector profile
- `VNM` / `CONSUMER_STAPLES_DAIRY` from FAO Gateway to dairy production and products

All rows remain:

- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`

## Idempotency Result

Rerunning the confirm-write command with `--confirm-write` created no duplicate rows:

- `contextRowsCreated=0`
- `contextRowsUpdated=3`
- `provenanceRowsCreated=0`
- `provenanceRowsUpdated=3`
- `contextRowsAfter=3`
- `provenanceRowsAfter=3`
- `productionApprovedTrueCount=0`
- `smokePassed=true`

## Read-Path/API/Assistant/UI Smoke Summary

`scripts/smoke-industry-qualitative-context-read-path.ts` passed:

- `HPG` reads source-backed qualitative context for `STEEL_MATERIALS`.
- `MWG` reads source-backed qualitative context for `RETAIL`.
- `VNM` reads source-backed qualitative context for `CONSUMER_STAPLES_DAIRY`.
- `FPT`, `VCB`, and `MSN` remain missing-safe.
- Company API exposes source-backed qualitative context only for mapped reviewed tickers.
- Assistant prompt context includes qualitative context only for `HPG`, `MWG`, and `VNM`.
- Assistant prompt context keeps `FPT`, `VCB`, and `MSN` missing-safe.
- UI/API caveats are visible.
- `forbiddenAdviceDetected=false`
- `numericBenchmarkLanguageDetected=false`
- `unsupportedTickerContextDetected=false`
- `productionApprovedTrueCount=0`
- `industryMetricCreated=false`
- `benchmarkCreated=false`
- `valuationRiskBenchmarkInvented=false`
- `retailPeerGroupCreated=false`
- `vnmPeerGroupCreated=false`
- `staticGuidanceTreatedAsReviewedQualitativeContext=false`
- `smokePassed=true`

## Guardrail Notes

- DB writes happened only for qualitative IndustryContext and IndustryContextProvenance rows.
- Provider fetch did not happen.
- CSV import did not happen.
- No IndustryMetric was created.
- No valuation/risk benchmark was created.
- No `productionApproved=true` row was created.
- No Retail peer group was created.
- No VNM peer group was created.
- No unsupported ticker taxonomy or qualitative context was inferred for `FPT`, `VCB`, or `MSN`.
- Static compass guidance is still educational/static guidance and is not treated as reviewed qualitative context.
- Peer group and taxonomy remain non-advice and are not valuation/risk benchmarks.

## Schema Note

The current schema safely stores qualitative context overview, key drivers, key risks, and provenance metadata. The fuller Phase 150Z fields such as how the industry makes money, macro sensitivity, next checks, and common misread remain preserved in the reviewed source package module rather than being forced into unrelated DB columns.

## Validation Commands

- `npx eslint scripts/industry-qualitative-context-reviewed-sources.ts scripts/dry-run-industry-qualitative-context-reviewed-sources.ts scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts scripts/smoke-industry-qualitative-context-read-path.ts src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts`
- `npx tsx scripts/dry-run-industry-qualitative-context-reviewed-sources.ts`
- `npx tsx scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts`
- `npx tsx scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts --confirm-write`
- `npx tsx scripts/confirm-write-industry-qualitative-context-reviewed-sources.ts --confirm-write`
- `npx tsx scripts/smoke-industry-qualitative-context-read-path.ts`
- `npx tsx scripts/smoke-industry-ui-reviewed-coverage-alignment.ts`
- `npx tsx scripts/smoke-industry-milestone-e2e.ts`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`

All commands passed. The Prisma/DB commands emitted existing staging TLS warnings only; they were not validation failures.

## Next Recommended Phase

Phase 151B - extend the qualitative context schema/read-path if the product should expose the full beginner explanation fields from the reviewed source packages instead of only the currently supported overview, drivers, risks, and provenance fields.
