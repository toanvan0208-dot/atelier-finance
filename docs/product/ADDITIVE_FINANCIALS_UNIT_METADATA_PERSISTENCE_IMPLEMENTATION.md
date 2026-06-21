# Additive Financials Unit Metadata Persistence Implementation

## 1. Phase 68 Summary

Phase 68 implements additive field-level Financials unit metadata persistence using the Phase 67 sidecar-table design.

Schema migration: yes, additive sidecar table only.

No reset or seed step was used. No production approval state changed. No new metric, target price, fair value range, EV, DCF, recommendation, or Risk scoring was added.

## 2. Files Audited

- `prisma/schema.prisma`
- `prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql`
- `src/lib/data-sources/financial-statement-local-write-service.ts`
- `src/lib/data-sources/financial-statement-read-service.ts`
- `src/features/financials/lib/adapt-financial-statement-records.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/financials-unit-metadata-contract.ts`
- `src/features/financials/lib/financials-unit-metadata-persistence-boundary.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- Phase 64-67 Financials and Valuation docs.

## 3. Files Changed

Schema:

- `prisma/schema.prisma`

Migration:

- `prisma/migrations/20260621070000_phase_68_financials_unit_metadata_sidecar/migration.sql`

Code:

- `src/lib/data-sources/financial-statement-local-write-service.ts`
- `src/lib/data-sources/financial-statement-read-service.ts`

Tests:

- `src/features/financials/lib/__tests__/financials-unit-metadata-sidecar-schema.test.ts`
- `src/features/financials/lib/__tests__/load-financials-runtime-data.test.ts`
- `src/features/financials/lib/__tests__/adapt-financial-statement-records.test.ts`
- `src/lib/data-sources/__tests__/financial-statement-local-write-service.test.ts`
- `src/lib/data-sources/__tests__/financial-statement-read-service.test.ts`

Docs:

- this file
- cross-reference updates in Financials, Valuation, productization, and source-evidence docs.

## 4. Schema Implementation

Sidecar model name: `FinancialStatementUnitMetadata`.

Parent model: `FinancialStatement`.

Relation:

- `FinancialStatement.unitMetadata FinancialStatementUnitMetadata[]`
- `FinancialStatementUnitMetadata.financialStatementId -> FinancialStatement.id`
- relation uses `onDelete: Cascade` so sidecar rows follow an intentionally removed parent statement.

Fields:

- `field`
- `unit`
- `status`
- `sourceLabel`
- `dataMode`
- `warningCodes`
- `productionApproved Boolean @default(false)`
- timestamps

Constraints:

- `@@unique([financialStatementId, field])`
- `@@index([financialStatementId])`
- `@@index([field])`

Migration summary:

- creates `FinancialStatementUnitMetadata`
- creates unique statement-field index
- creates statement id and field indexes

Additive-only confirmation:

- no existing table is dropped
- no existing column is dropped or renamed
- no existing data is rewritten
- old `FinancialStatement` rows remain valid with no sidecar rows

## 5. Migration Safety Result

- DROP statement present: no
- DELETE statement present: no
- reset required: no
- seed required: no
- old rows compatible: yes
- generated Prisma client committed: no
- dev DB committed: no

Rollback consideration:

- If a future local environment needs rollback before real data use, the sidecar table can be removed in a separate reviewed rollback migration because it is additive and does not modify parent statement rows. Do not delete parent statement rows to roll back sidecar behavior.

## 6. Write Path Behavior

Valid metadata:

- controlled local write persists sidecar rows only for Phase 64 recognized Financials fields with `status:"explicit"`.
- rows are upserted by `financialStatementId + field`.
- `productionApproved:false` is forced.

Missing metadata:

- no sidecar row is required.
- old or missing metadata reads through the Phase 64/66 fallback.

Invalid metadata:

- accepted dry-run rows should not contain invalid explicit metadata because Phase 65 rejects invalid explicit units.
- read-back still validates persisted sidecar rows again and fails closed if a row is invalid.

Missing value:

- missing values remain `null`.
- no zero-fill is introduced.

Old rows:

- old rows remain readable without sidecar rows.
- present scale-sensitive values without sidecars become `unknown_unit`.

## 7. Read-back And Runtime Sidecar Behavior

Read-back:

- `getFinancialStatementSeries` now selects `unitMetadata` sidecar rows.
- sidecar rows are converted into the Phase 66 persistence payload shape.
- Phase 66 read helper validates units against the Phase 64 contract.

Runtime:

- adapted records carry `unitMetadata` as before.
- `loadFinancialsRuntimeData` continues to prefer record-level `unitMetadata` when present.
- sample fallback and old DB rows remain backward compatible.

Invalid sidecar behavior:

- invalid persisted units are not treated as valid.
- warnings such as `revenue_persisted_unit_metadata_invalid` are surfaced in data quality.

## 8. Valuation Impact

Explicit Financials units can reach the controlled Valuation boundary through:

`sidecar table -> read service -> adapter -> Financials runtime sidecar -> controlled Valuation integration boundary`

Metrics may become eligible only when all required explicit units and market inputs are present.

Current ownership remains unchanged:

- `marketPrice` is not Financials-owned.
- `marketCap` is still market/PVT or persisted-bridge owned.
- EV, EV/EBITDA, DCF, and fair value range remain blocked.
- `canClaimValuationDbBacked:false` remains preserved.

## 9. Browser Verification

Browser verification was not run.

Reason: Phase 68 changes schema, persistence services, runtime handoff tests, and docs only. No visible UI component or route behavior was intentionally changed.

## 10. Tests Added/Updated

Added:

- `financials-unit-metadata-sidecar-schema.test.ts`

Updated:

- local write-service tests for explicit sidecar persistence
- read-service tests for explicit sidecar read-back, old rows, invalid rows, and null preservation
- runtime loader tests for read-back unit metadata reaching controlled Valuation
- adapter fixtures for the expanded normalized values shape

Covered:

- sidecar model and parent relation exist
- migration SQL is additive and sidecar-only
- valid explicit metadata persists and reads back
- old rows without metadata remain unknown-unit/missing
- invalid persisted units fail closed
- missing values remain null
- marketPrice/marketCap are not Financials sidecar fields
- production approval remains false
- controlled Valuation receives explicit units without changing source-claim boundaries

## 11. Non-goals

- no reset or seed
- no destructive migration
- no real BCTC import
- no approved source integration
- no Excel or PDF parser
- no public upload API
- no external API call
- no new metric
- no target price
- no fair value range
- no recommendation or trading signal
- no Risk scoring
- no production source approval

## 12. Limitations

- Existing DB rows do not automatically gain unit metadata.
- The migration file is committed, but local DB files are not committed.
- Unit metadata does not make local/research/user-provided data production-approved.
- Market input unit metadata remains separate.
- Runtime can still show `unknown_unit` until rows are written with explicit sidecar metadata.

## 13. Next Recommended Phase

Recommended next phase: Phase 69 - Controlled Unit Metadata Write Trial.

Maximum scope:

- apply the additive migration in a controlled local environment without reset/seed;
- run one synthetic local write trial with explicit units;
- read back the sidecar rows;
- verify Financials runtime and Valuation boundary behavior from the local DB;
- keep DB files, generated Prisma client, raw CSV/JSON, and screenshots out of the commit unless explicitly requested.

## 14. Phase 69 Follow-up

Phase 69 adds `CONTROLLED_UNIT_METADATA_WRITE_TRIAL.md`. A synthetic explicit-unit write trial was run against a temporary SQLite DB outside the repo after applying the existing additive SQL migrations there. The trial inserted one synthetic Financials row plus ten explicit sidecar unit rows, read them back into runtime metadata, and passed the explicit Financials units into the controlled Valuation boundary.

The existing repo-root `dev.db` was not reset or seeded and was not committed. Generated Prisma output and temp artifacts were cleaned up before commit.

## 15. Phase 70 Follow-up

Phase 70 adds `MARKET_PVT_UNIT_METADATA_CONTRACT.md`. It keeps `marketPrice` and `marketCap` outside the Financials sidecar persistence contract, defines their accepted Market/PVT units, and lets the controlled Valuation boundary consume explicit market metadata when available.

No Financials schema, migration, sidecar table, DB row, generated Prisma output, or visible UI behavior changes in Phase 70.

## 16. Phase 71 Follow-up

Phase 71 adds `VALUATION_UNIT_AWARE_READY_METRICS_BROWSER_VERIFICATION.md`. The browser scenario uses explicit Financials units from a synthetic/local fixture and explicit Market/PVT units from the Phase 70 contract to verify ready controlled metrics.

The Financials sidecar persistence implementation is not changed, and no schema migration, DB write, generated Prisma output, or DB artifact is committed.

## 17. Phase 72 Follow-up

Phase 72 adds `MARKET_PVT_UNIT_METADATA_CAPTURE_BOUNDARY.md`. Market/PVT capture remains separate from the Financials sidecar table and does not alter Financials persistence, migrations, or DB rows.
