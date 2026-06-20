# Financials Unit Metadata Persistence Read-back Boundary

## 1. Phase 66 Summary

Phase 66 adds a safe persistence/read-back boundary for Financials unit metadata without changing the database schema.

The current `FinancialStatement` model has a single `unit` string plus JSON-string arrays such as `missingFields` and `warningCodes`, but it does not have a safe JSON metadata field for the full ten-field unit sidecar. Because of that, Phase 66 chooses Option B: a pure persistence payload helper and runtime read-back handoff boundary, with DB persistence deferred.

No source is approved. No new metric, target price, recommendation, EV, EV/EBITDA, DCF, or fair value range is added.

## 2. Files Audited

- `prisma/schema.prisma`
- `src/lib/data-sources/financial-statement-local-write-service.ts`
- `src/lib/data-sources/financial-statement-read-service.ts`
- `src/features/financials/lib/adapt-financial-statement-records.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/financials-unit-metadata-contract.ts`
- `src/features/financials/lib/financials-unit-metadata-persistence-boundary.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`

## 3. Files Changed

Code:

- `src/features/financials/lib/financials-unit-metadata-persistence-boundary.ts`
- `src/features/financials/lib/adapt-financial-statement-records.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/index.ts`
- `src/lib/data-sources/financial-statement-read-service.ts`

Tests:

- `src/features/financials/lib/__tests__/financials-unit-metadata-persistence-boundary.test.ts`

Docs:

- `docs/product/FINANCIALS_UNIT_METADATA_PERSISTENCE_READBACK_BOUNDARY.md`
- cross-reference updates in Financials, Valuation, productization, and source evidence docs.

## 4. Persistence Strategy

Chosen strategy: Option B - pure helper/read-back boundary, DB persistence deferred.

Why:

- There is no existing per-row JSON metadata column on `FinancialStatement`.
- The existing `unit` field is a single scalar and cannot safely represent field-level units.
- `warningCodes`, `missingFields`, and `errorCodes` are arrays for diagnostics, not durable unit sidecars.
- Adding a schema field would be an additive migration, but Phase 66 avoids migration unless explicitly needed.

Schema migration: no.

DB reset/seed: no.

DB write: no.

## 5. Unit Metadata Persistence Behavior

| Case | Behavior |
| --- | --- |
| valid explicit unit metadata | accepted by the helper payload and can be read back into runtime sidecar when a repository provides it |
| missing metadata | returns `unknown_unit` for present values and `missing` for null values |
| invalid metadata | warning emitted, invalid unit is not treated as valid |
| missing value | remains `null`; no zero-fill |
| old row without metadata | backward-compatible `unknown_unit` / `missing` sidecar |

The payload helper forces `productionApproved:false` even when an unsafe payload claims approval.

## 6. Runtime Sidecar Behavior

`adaptFinancialStatementSeries` can now carry optional validated `unitMetadata` from a read-back record into an adapted statement.

`loadFinancialsRuntimeData` now prefers adapted statement `unitMetadata` when available. If unavailable, it preserves the Phase 64 behavior and rebuilds a conservative sidecar from the snapshot with unknown units.

This keeps existing synthetic rows compatible and keeps local/research-only data unapproved.

## 7. Valuation Handoff Impact

The tested handoff is:

`validated unit metadata payload -> adapted Financials statement -> Financials runtime sidecar -> controlled Valuation integration boundary`.

Eligible Financials fields:

- `revenue`
- `netIncome`
- `equity`
- `eps`
- `sharesOutstanding`

Explicit units can make P/E, BVPS, P/B, P/S, and derived marketCap eligible only when required market inputs also have explicit units. `marketPrice` and `marketCap` remain market/PVT or persisted-bridge owned. EV, EV/EBITDA, DCF, and fair value range remain blocked.

## 8. Browser Verification

Browser verification was not run.

Reason: Phase 66 changes persistence/read-back helpers, adapter/runtime sidecar handoff, tests, and docs only. It does not add DB persistence and does not change visible UI behavior.

## 9. Tests Added/Updated

Added:

- `financials-unit-metadata-persistence-boundary.test.ts`

Covered behavior:

- build and read valid persistence payload;
- old rows without metadata stay `unknown_unit`;
- invalid persisted unit metadata is not treated as valid;
- missing values remain null;
- runtime sidecar consumes validated read-back metadata;
- controlled Valuation receives explicit runtime units;
- unknown runtime units keep dependent Valuation metrics insufficient;
- source approval remains false.

## 10. Non-goals

- No DB reset/seed.
- No destructive migration.
- No schema migration.
- No DB write.
- No real BCTC import.
- No official source.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No new metric.
- No target price.
- No fair value calculation.
- No recommendation.
- No Risk scoring.
- No production source approval.

## 11. Limitations

- Existing historical/synthetic rows do not have durable unit metadata.
- DB persistence remains deferred until an additive storage plan is explicitly approved.
- Unit metadata does not make any local/research/user-provided source production-approved.
- Market input unit metadata remains separate from Financials unit metadata.

## 12. Next Recommended Phase

Recommended Phase 67: Additive Financials Unit Metadata Storage Plan.

Maximum safe scope:

- propose an additive schema/storage path for field-level unit metadata;
- include migration review without reset/seed;
- preserve backward compatibility for existing rows;
- keep `productionApproved:false`;
- do not add metrics, target price, fair value, recommendation, EV, DCF, or Risk scoring.
