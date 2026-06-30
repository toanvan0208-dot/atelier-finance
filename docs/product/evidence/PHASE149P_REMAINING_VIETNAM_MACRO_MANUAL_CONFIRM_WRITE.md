# Phase 149P - Remaining Vietnam Macro Manual Confirm Write

## Phase objective

Confirm-write the remaining Vietnam macro manual candidate rows that passed prior dry-runs, improving real macro coverage while preserving candidate/manual status. This phase writes only:

- `FOREIGN_NET_FLOW`
- `PMI_MANUFACTURING`
- `POLICY_RATE`
- `MARKET_TRADING_VALUE`

No other macro indicator is written or modified by the confirm-write script.

## Commands run

- `git status --short`
- `git diff --stat`
- `git diff`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`
- `node scripts/run-staging.mjs npx tsx scripts/confirm-write-vietnam-macro-remaining-manual-candidates.ts`
- `node scripts/run-staging.mjs npx tsx scripts/confirm-write-vietnam-macro-remaining-manual-candidates.ts --confirm-write`
- `node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-remaining-manual-confirm-write-read-path.ts`
- `node scripts/run-staging.mjs npx tsx scripts/confirm-write-vietnam-macro-remaining-manual-candidates.ts --confirm-write`
- `node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-remaining-manual-confirm-write-read-path.ts`
- `node scripts/run-staging.mjs npx eslint scripts/confirm-write-vietnam-macro-remaining-manual-candidates.ts`
- `node scripts/run-staging.mjs npx eslint scripts/smoke-vietnam-macro-remaining-manual-confirm-write-read-path.ts`
- `node scripts/run-staging.mjs npx eslint src/features/macro/lib/load-macro-runtime-data.ts src/app/api/assistant/route.ts scripts/dry-run-vietnam-macro-foreign-net-flow-manual-csv.ts`
- `node scripts/run-staging.mjs npx prisma validate`
- `node scripts/run-staging.mjs npx prisma generate`
- `node scripts/run-staging.mjs npx prisma migrate status`
- `node scripts/run-staging.mjs npm run typecheck`
- `node scripts/run-staging.mjs npm run build`
- `node scripts/run-staging.mjs npm run lint`

## Files changed

- `scripts/confirm-write-vietnam-macro-remaining-manual-candidates.ts`
- `scripts/smoke-vietnam-macro-remaining-manual-confirm-write-read-path.ts`
- `src/features/macro/lib/load-macro-runtime-data.ts`
- `src/app/api/assistant/route.ts`
- `scripts/dry-run-vietnam-macro-foreign-net-flow-manual-csv.ts`
- `docs/product/evidence/PHASE149P_REMAINING_VIETNAM_MACRO_MANUAL_CONFIRM_WRITE.md`

## Input files used but not committed

- `data/manual-review/macro/foreign-net-flow/vietnam-foreign-net-flow-manual.csv`
- `data/manual-review/macro/pmi-manufacturing/vietnam-pmi-manufacturing-manual.csv`
- `data/manual-review/macro/policy-rate/vietnam-policy-rate-manual.csv`
- `data/manual-review/macro/market-trading-value/vietnam-market-trading-value-manual.csv`

The CSV files remain local-only and were not staged or committed.

## Confirm-write scope

Expected rows:

| Indicator | Rows |
| --- | ---: |
| `FOREIGN_NET_FLOW` | 12 |
| `PMI_MANUFACTURING` | 29 |
| `POLICY_RATE` | 30 |
| `MARKET_TRADING_VALUE` | 12 |
| **Total** | **83** |

The dry-run mode produced:

- `rowsToWriteTotal=83`
- `dbWriteAttempted=false`
- `validationErrors=[]`
- `candidateRowsPersisted=false`

## Rows written/upserted by indicator

First confirm-write:

| Indicator | Written | Created | Updated |
| --- | ---: | ---: | ---: |
| `FOREIGN_NET_FLOW` | 12 | included in total | included in total |
| `PMI_MANUFACTURING` | 29 | included in total | included in total |
| `POLICY_RATE` | 30 | included in total | included in total |
| `MARKET_TRADING_VALUE` | 12 | included in total | included in total |

Totals:

- `rowsCreatedTotal=83`
- `rowsUpdatedTotal=0`
- `provenanceRowsCreated=83`
- `provenanceRowsUpdated=0`

Second confirm-write/idempotency run:

- `rowsCreatedTotal=0`
- `rowsUpdatedTotal=83`
- `provenanceRowsCreated=0`
- `provenanceRowsUpdated=83`
- `duplicateRowsCreated=false`
- `secondRunSafeUpsert=true`

## Read-back observation/provenance counts

| Indicator | Observations | Provenance |
| --- | ---: | ---: |
| `FOREIGN_NET_FLOW` | 12 | 12 |
| `PMI_MANUFACTURING` | 29 | 29 |
| `POLICY_RATE` | 30 | 30 |
| `MARKET_TRADING_VALUE` | 12 | 12 |

## Production approval and review state

- `productionApprovedTrueCount=0`
- `needsReviewRowsCount=83`
- Every written observation/provenance row keeps `productionApproved=false`.
- Every written observation/provenance row keeps `needsReview=true`.

## noWritesToOtherIndicators

- `noWritesToOtherIndicators=true`
- Smoke checked that Phase 149P source labels are not present on non-target indicators.
- Confirm-write script hard-codes the target indicator allowlist and validates `rowsToWriteTotal=83` before any DB write.

## Runtime/UI/Assistant verification

Smoke result:

- `runtimeIncludesAllTargets=true`
- `runtimeReadableAllTargets=true`
- `uiWarningsPreserved=true`
- `assistantContextIncludesTargets=true`
- `allWrittenRowsHaveProvenance=true`
- `allWrittenRowsHaveCandidateSourceType=true`

Read-path fix:

- `loadMacroRuntimeData` now requests a larger macro observation limit for the full frontend-locked universe. This prevents later indicators from being dropped after adding many manual monthly rows.

Assistant context:

- Adds caveats for `FOREIGN_NET_FLOW`, `PMI_MANUFACTURING`, `POLICY_RATE`, and `MARKET_TRADING_VALUE`.
- Guardrail now says these rows may be explained only when present in `dbBackedIndicators`, and must be described as candidate/manual data with `productionApproved=false` and `needsReview=true`.

## Caveats by indicator

- `FOREIGN_NET_FLOW`: Manual aggregated HOSE-only foreign investor net flow; positive/negative values describe market-flow terminology, not investment recommendation wording. The terms equivalent to net buying/net selling are market-flow terminology.
- `PMI_MANUFACTURING`: Manual/secondary-source PMI manufacturing candidate; unit is `index`.
- `POLICY_RATE`: Monthly carry-forward snapshot of the SBV refinancing rate; not a machine-readable official SBV feed.
- `MARKET_TRADING_VALUE`: Average daily/session trading value by month for HOSE, not total monthly trading value.

## Guardrail results

- `dbWriteAttempted=true` only in confirm-write script with `--confirm-write`.
- Smoke script has `dbWriteAttempted=false`.
- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `fallbackAsReal=false`
- `frontendIndicatorUniverseExpanded=false`
- `investmentAdviceAdded=false`

The banned wording audit excludes market-flow terminology equivalent to net buying/net selling and does not treat it as investment advice.

## Validation results

- Targeted lint for `scripts/confirm-write-vietnam-macro-remaining-manual-candidates.ts`: pass
- Targeted lint for `scripts/smoke-vietnam-macro-remaining-manual-confirm-write-read-path.ts`: pass
- Targeted lint for touched runtime/Assistant/dry-run files: pass
- `node scripts/run-staging.mjs npx prisma validate`: pass
- `node scripts/run-staging.mjs npx prisma generate`: pass
- `node scripts/run-staging.mjs npx prisma migrate status`: pass
- `node scripts/run-staging.mjs npm run typecheck`: pass
- `node scripts/run-staging.mjs npm run build`: pass
- `node scripts/run-staging.mjs npm run lint`: fail globally due to existing/out-of-scope lint debt in older scripts and modules. New/touched Phase 149P files pass targeted lint.

## Known limitations

- The DB schema does not have native dimension columns such as `market`, `rate_name`, or `value_type`; these are preserved in provenance `evidenceNotes` JSON.
- The manual CSV files remain local-only and are required to reproduce the exact candidate extraction inputs.
- The written rows are not production-approved and still require a separate stronger human review gate before any `productionApproved=true` workflow.

## Next recommended phase

Phase 149Q should run a final full macro coverage smoke across all frontend-locked indicators and document the remaining blocked `GLOBAL_FLOW` definition/source decision.

## Commit

Pending.
