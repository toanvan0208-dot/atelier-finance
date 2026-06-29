# Phase 149E Vietnam Macro Candidate Eligibility Audit Evidence

## Phase

Phase 149E - Vietnam macro candidate confirm-write eligibility audit.

## Starting Commit

`b98e204cdd2518c022deb928e0f9c32755bebd07`

## Files Changed

- `scripts/dry-run-vietnam-macro-parser-batch.ts`
- `scripts/audit-vietnam-macro-candidate-eligibility.ts`
- `scripts/smoke-vietnam-macro-candidate-eligibility-audit.ts`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/evidence/PHASE149E_VIETNAM_MACRO_CANDIDATE_ELIGIBILITY_AUDIT.md`

## Target Indicators

- `USD_VND`
- `EXPORT_GROWTH`
- `CREDIT_GROWTH`
- `PUBLIC_INVESTMENT`

## Source Inputs

- `USD_VND`: Vietcombank Exchange Rate XML API.
- `EXPORT_GROWTH`: manual GSO export value CSV files under `data/manual-review/`.
- `CREDIT_GROWTH`: manual aggregated SBV/news/publication CSV under `data/manual-review/`.
- `PUBLIC_INVESTMENT`: clean manual public investment CSV under `data/manual-review/`.

Raw CSV files were read locally for audit and were not committed.

## Candidate Rows

| Indicator | Candidate rows | Eligible rows | Blocked rows |
| --- | ---: | ---: | ---: |
| `USD_VND` | 1 | 1 | 0 |
| `EXPORT_GROWTH` | 2 | 2 | 0 |
| `CREDIT_GROWTH` | 10 | 0 | 10 |
| `PUBLIC_INVESTMENT` | 34 | 34 | 0 |

- `candidateRowsTotal=47`
- `eligibleRowsTotal=37`
- `blockedRowsTotal=10`
- `needsReviewTrueCount=47`
- `needsReviewTrueCountMatchesCandidateRows=true`

## Blocked Reasons

- `SOURCE_COLUMN_MISSING_PERIOD_TYPE=10`

All blocked rows are `CREDIT_GROWTH` rows. The Phase 149D parser can infer `periodType`, but the Phase 149E source contract requires the source CSV column `period_type`. Because the local credit-growth CSV header does not include that column, these rows are not eligible for confirm-write until the manual CSV contract is corrected.

## Duplicate Candidate Keys

None.

Duplicate check key:

`indicatorCode + period + periodType + unit`

`PUBLIC_INVESTMENT` rows with the same period and different units are not duplicates because the unit is part of the key.

## Provenance Completeness

- `USD_VND`: pass. Source URL, fetched timestamp, payload checksum, and source type are present.
- `EXPORT_GROWTH`: pass. Source file, checksum, derived formula, current period, and prior period are present.
- `CREDIT_GROWTH`: pass for source URL, publication date, extracted quote, source file, and checksum in candidate metadata; blocked only because the source CSV schema is missing `period_type`.
- `PUBLIC_INVESTMENT`: pass. Source URL, publication date, extracted quote, scope, plan basis, source file, and checksum are present.

## Semantic Audit Results

- `USD_VND`: pass. It remains a Vietcombank commercial-bank transfer quote, not SBV central rate.
- `EXPORT_GROWTH`: pass. It is derived YoY from GSO export value CSV and is not directly published growth.
- `CREDIT_GROWTH`: pass for manual aggregation semantics, but blocked for missing source schema column `period_type`.
- `PUBLIC_INVESTMENT`: pass. Unit disambiguates `billion_vnd` versus `percent_of_plan_ytd`.

## Unit Audit Results

- `USD_VND`: `vnd_per_usd`
- `EXPORT_GROWTH`: `percent_yoy`
- `CREDIT_GROWTH`: `percent_ytd`
- `PUBLIC_INVESTMENT`: `billion_vnd` or `percent_of_plan_ytd`

## Period Audit Results

- `USD_VND`: pass.
- `EXPORT_GROWTH`: pass, including a map-able `YTD` derived period.
- `CREDIT_GROWTH`: pass for candidate period format, blocked separately for missing source `period_type` column.
- `PUBLIC_INVESTMENT`: pass with warnings for annual rows represented at the December period marker; this is map-able and not a duplicate.

## Confirm-Write Recommendation

Phase 149E does not write to DB. For a later candidate confirm-write phase:

- Eligible for candidate confirm-write review: `USD_VND`, `EXPORT_GROWTH`, and `PUBLIC_INVESTMENT` rows.
- Not eligible until CSV contract is corrected: `CREDIT_GROWTH` rows.
- Any later candidate DB write must keep `productionApproved=false` and `needsReview=true`.
- `productionApproved=true` requires a separate stronger review gate and is not part of Phase 149E or the immediate next candidate confirm-write phase.

## Guardrail Results

- `dbWriteAttempted=false`
- `candidateRowsPersisted=false`
- `observationRowsCreated=0`
- `provenanceRowsCreated=0`
- `productionApprovedTrueCount=0`
- `frontendIndicatorUniverseExpanded=false`
- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `investmentAdviceAdded=false`
- `manualReviewRequiredBeforeConfirmWrite=true`
- `usdVndNotSbvCentralRate=true`
- `exportGrowthDerivedFromExportValue=true`
- `exportGrowthNotDirectPublishedGrowth=true`
- `creditGrowthManualAggregatedCandidate=true`
- `publicInvestmentUnitDisambiguated=true`

## Validation Results

- `node scripts/run-staging.mjs npx prisma validate`: pass.
- `node scripts/run-staging.mjs npx prisma generate`: pass.
- `node scripts/run-staging.mjs npx prisma migrate status`: pass.
- `node scripts/run-staging.mjs npm run typecheck`: pass.
- `node scripts/run-staging.mjs npm run build`: pass.
- `node scripts/run-staging.mjs npm run lint`: global lint is not a clean pass. Failure is pre-existing/out of scope; new Phase 149E files are not listed in lint failures.

## Smoke Results

`node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-candidate-eligibility-audit.ts`: pass.

Smoke-confirmed fields:

- `candidateRowsTotal=47`
- `eligibleRowsTotal + blockedRowsTotal = candidateRowsTotal`
- `duplicateAuditExecuted=true`
- `sourceProvenanceAuditExecuted=true`
- `semanticAuditExecuted=true`
- `unitAuditExecuted=true`
- `periodAuditExecuted=true`
- `dbWriteAttempted=false`
- `candidateRowsPersisted=false`
- `observationRowsCreated=0`
- `provenanceRowsCreated=0`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCountMatchesCandidateRows=true`
- `smokePassed=true`

## Known Gaps

- `CREDIT_GROWTH` source CSV must add `period_type` before those rows are eligible.
- All eligible rows remain candidate-only and still need manual review before confirm-write.
- No row should be production-approved in the candidate confirm-write phase.

## Recommended Next Phase

Phase 149F should perform candidate confirm-write only for rows that passed the eligibility audit, while leaving blocked rows out and preserving `productionApproved=false` and `needsReview=true`.

## Commit

Pending at evidence creation time.
