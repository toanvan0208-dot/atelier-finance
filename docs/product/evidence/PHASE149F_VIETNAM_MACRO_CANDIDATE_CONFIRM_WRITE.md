# Phase 149F Vietnam Macro Candidate Confirm-Write Evidence

## Phase

Phase 149F - Vietnam macro candidate confirm-write for 37 eligible rows.

## Starting Commit

`7e21d7dcc3c2f19b30daf377b51ebd91476334f9`

## Files Changed

- `scripts/confirm-write-vietnam-macro-candidates.ts`
- `scripts/smoke-vietnam-macro-confirm-write-candidates.ts`
- `scripts/audit-vietnam-macro-candidate-eligibility.ts`
- `docs/product/evidence/PHASE149F_VIETNAM_MACRO_CANDIDATE_CONFIRM_WRITE.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`

## Source Inputs

- `USD_VND`: Vietcombank Exchange Rate XML API.
- `EXPORT_GROWTH`: manual GSO export value CSV files under `data/manual-review/`.
- `PUBLIC_INVESTMENT`: clean manual public investment CSV under `data/manual-review/`.
- `CREDIT_GROWTH`: manual CSV exists but was intentionally excluded because Phase 149E blocked all 10 rows.

Raw CSV files were read locally and were not committed.

## Candidate And Eligibility Counts

| Indicator | Candidate rows | Eligible rows | Blocked rows | Rows to write |
| --- | ---: | ---: | ---: | ---: |
| `USD_VND` | 1 | 1 | 0 | 1 |
| `EXPORT_GROWTH` | 2 | 2 | 0 | 2 |
| `CREDIT_GROWTH` | 10 | 0 | 10 | 0 |
| `PUBLIC_INVESTMENT` | 34 | 34 | 0 | 34 |

- `candidateRowsTotal=47`
- `rowsToWriteTotal=37`
- `rowsSkippedBlockedTotal=10`
- `CREDIT_GROWTH candidates generated=10`
- `CREDIT_GROWTH eligible=0`
- `CREDIT_GROWTH blocked=10`
- `CREDIT_GROWTH rows written=0`

`CREDIT_GROWTH` was intentionally excluded because 149E blocked all 10 rows due to missing `period_type`.

## Confirm-Write Results

First confirmed write:

- `confirmWriteRequested=true`
- `dbWriteAttempted=true`
- `candidateRowsPersisted=true`
- `rowsWrittenTotal=37`
- `rowsCreatedTotal=37`
- `rowsUpdatedTotal=0`
- `provenanceRowsCreated=37`
- `provenanceRowsUpdated=0`

Rows written by indicator:

- `USD_VND=1`
- `EXPORT_GROWTH=2`
- `CREDIT_GROWTH=0`
- `PUBLIC_INVESTMENT=34`

All written rows use `productionApproved=false` and `needsReview=true`.

## Idempotency Result

Second confirmed write:

- `rowsWrittenTotal=37`
- `rowsCreatedTotal=0`
- `rowsUpdatedTotal=37`
- `provenanceRowsCreated=0`
- `provenanceRowsUpdated=37`
- `duplicateKeySafe=true`
- `uniqueDbKeysPlanned=true`
- `rerunSafeUpsert=true`

No duplicate rows were created.

## Read-Back Results

Smoke read-back after confirm-write and idempotency rerun:

- `readBackRows=37`
- `readBackProvenanceRows=37`
- `USD_VND rows=1`
- `EXPORT_GROWTH rows=2`
- `PUBLIC_INVESTMENT rows=34`
- `CREDIT_GROWTH rows=0`
- `allWrittenRowsHaveProvenance=true`
- `allProvenanceRowsHaveObservation=true`
- `allWrittenRowsHaveCandidateSourceType=true`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCount=37`

## Semantic Caveats

- `USD_VND`: Vietcombank commercial-bank transfer quote, not SBV central rate.
- `EXPORT_GROWTH`: derived YoY from GSO export value CSV, not directly published growth.
- `PUBLIC_INVESTMENT`: unit disambiguates whether the row is value in `billion_vnd` or progress as `percent_of_plan_ytd`.
- `CREDIT_GROWTH`: blocked because source CSV is missing required `period_type`; no rows persisted.

## Guardrail Results

- `productionApproved=false` for all written rows.
- `needsReview=true` for all written rows.
- `dbWriteAttempted=true`
- `candidateRowsPersisted=true`
- `creditGrowthRowsWritten=0`
- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `fallbackAsReal=false`
- `investmentAdviceAdded=false`
- `frontendIndicatorUniverseExpanded=false`
- `rawCsvCommitted=false`

## Validation Results

- `node scripts/run-staging.mjs npx prisma validate`: pass.
- `node scripts/run-staging.mjs npx prisma generate`: pass.
- `node scripts/run-staging.mjs npx prisma migrate status`: pass.
- `node scripts/run-staging.mjs npm run typecheck`: pass.
- `node scripts/run-staging.mjs npm run build`: pass.
- `node scripts/run-staging.mjs npm run lint`: global lint is not a clean pass. Failure is pre-existing/out of scope; new Phase 149F files are not listed in lint failures.

## Smoke Results

`node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-confirm-write-candidates.ts`: pass.

Smoke-confirmed fields:

- `USD_VND candidate row exists=true`
- `EXPORT_GROWTH candidate rows exist=true`
- `PUBLIC_INVESTMENT candidate rows exist=true`
- `CREDIT_GROWTH rows written=0`
- `rowsWrittenTotal=37`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCount=37`
- `allWrittenRowsHaveProvenance=true`
- `allWrittenRowsHaveCandidateSourceType=true`
- `usdVndNotSbvCentralRate=true`
- `exportGrowthDerivedFromExportValue=true`
- `publicInvestmentUnitDisambiguated=true`
- `dbWriteAttempted=true`
- `smokePassed=true`

## Known Gaps

- `CREDIT_GROWTH` remains blocked until the manual CSV source schema includes `period_type`.
- Persisted Vietnam macro rows are candidate/staging data only; they are not production-approved.
- A separate stronger review gate is required before any production approval.

## Recommended Next Phase

Phase 149G should integrate/read-back these persisted Vietnam macro candidate rows into the macro runtime/UI and Assistant context while preserving candidate warnings, semantic caveats, `productionApproved=false`, and `needsReview=true`.

## Commit

Pending at evidence creation time.
