# Additive Financials Unit Metadata Storage Design And Migration Safety Review

## 1. Phase 67 Summary

Phase 67 audits the current Financials storage path and records an additive storage design for field-level unit metadata.

No migration was applied. No database write was performed. No reset or seed step was used. No source approval state changed.

The implementation work in this phase is intentionally limited to a pure storage-decision helper, tests, and documentation.

## 2. Files Audited

- `prisma/schema.prisma`
- `src/lib/data-sources/financial-statement-local-write-service.ts`
- `src/lib/data-sources/financial-statement-read-service.ts`
- `src/features/financials/lib/adapt-financial-statement-records.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/financials-unit-metadata-contract.ts`
- `src/features/financials/lib/financials-unit-metadata-persistence-boundary.ts`
- `src/lib/data-sources/financial-statement-file-parser.ts`
- `src/lib/data-sources/financial-statement-import-contract.ts`
- `src/lib/data-sources/financial-statement-local-file-dry-run.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/lib/valuation-input-unit-provenance.ts`

## 3. Files Changed

Code:

- `src/features/financials/lib/financials-unit-metadata-storage-plan.ts`
- `src/features/financials/index.ts`

Tests:

- `src/features/financials/lib/__tests__/financials-unit-metadata-storage-plan.test.ts`

Docs:

- `docs/product/ADDITIVE_FINANCIALS_UNIT_METADATA_STORAGE_DESIGN_AND_MIGRATION_SAFETY_REVIEW.md`
- cross-reference updates in Financials, Valuation, productization, and source-evidence docs.

## 4. Current Schema Finding

The relevant row model is `FinancialStatement`.

Current fields include:

- scalar `unit String?`
- numeric statement values as nullable `Decimal?`
- diagnostic arrays serialized into strings: `missingFields`, `warningCodes`, and `errorCodes`
- source/readiness fields such as `sourceId`, `sourceLabel`, `sourceType`, `dataMode`, `qualityStatus`, and `readiness`

No existing field safely stores field-level unit metadata for all Financials import-owned numeric fields.

The current Prisma datasource provider is `sqlite`. The repo pattern around statement diagnostics uses string-serialized arrays rather than a row-level Prisma `Json` field on `FinancialStatement`.

Phase 66 already added a pure persistence/read-back payload helper and runtime handoff boundary. That boundary can validate unit metadata if a repository later supplies it, but it does not persist the sidecar today.

## 5. Option Comparison

| Option | Design | Pros | Cons | Risks | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Option A JSON field | Add an optional metadata field on `FinancialStatement`, such as `unitMetadata Json?`, and validate shape in application code. | Simple read-back with the statement row; minimal table count; additive when provider and repo patterns are clear. | Harder field-level queries; app-layer shape validation; does not match the current string-serialized diagnostic pattern. | Provider behavior and migration behavior must be verified before use; invalid nested data must never unlock derived calculations. | Not primary for the current repo because the provider/pattern fit is not clear enough and field-level trace is useful. |
| Option B sidecar table | Add `FinancialStatementUnitMetadata` keyed by statement id and field, with unit/status/source/warning fields. | Explicit field-level trace; queryable; unique statement-field guard; can use string fields without relying on JSON behavior. | More repository mapping; relation and index migration work; heavier than payload-only handoff. | Partial joins must not be treated as valid metadata; migration must stay additive. | Primary recommendation for Phase 68 after approval. |
| Option C deferred payload only | Keep metadata in import/runtime payloads only. | No schema risk; no DB write path; old rows keep conservative unknown-unit behavior. | Metadata does not survive DB write/read-back; DB-backed runtime can remain unknown for scale-sensitive fields. | End-to-end persistence remains incomplete. | Current safe fallback until Phase 68 is approved. |

## 6. Recommended Storage Design

Recommended option: Option B - sidecar table `FinancialStatementUnitMetadata`.

Why:

- Field-level metadata is naturally keyed by statement field.
- The existing `unit` scalar cannot represent different units for revenue, EPS, share count, and balance-sheet values.
- Existing diagnostic arrays are not durable unit sidecars.
- A sidecar table can enforce one metadata row per statement-field pair with `@@unique([financialStatementId, field])`.
- String fields keep the first additive migration less dependent on provider-specific JSON behavior.

Why not Option A:

- The current schema does not show a row-level metadata-field pattern on `FinancialStatement`.
- Field-level filtering, validation, and repair would be weaker than a related table.

Why not Option C as the long-term plan:

- Phase 65 and Phase 66 have already prepared import and runtime handoff sidecars.
- Durable read-back is needed before DB-backed Financials can pass explicit units end to end.

Backward compatibility:

- Old rows do not need sidecar rows.
- Reads without sidecar rows keep the Phase 64/66 fallback: present scale-sensitive values become `unknown_unit`; missing values remain `missing`.
- Invalid sidecar rows must be ignored or downgraded to invalid metadata warnings, not treated as valid units.

## 7. Draft Schema Shape

Draft only. This is not an applied migration and no migration file was created in Phase 67.

```prisma
// Draft only - not applied in Phase 67.
model FinancialStatement {
  id           String                           @id @default(cuid())
  unitMetadata FinancialStatementUnitMetadata[]
}

model FinancialStatementUnitMetadata {
  id                   String             @id @default(cuid())
  financialStatementId String
  field                String
  unit                 String
  status               String
  sourceLabel          String?
  dataMode             String?
  warningCodes         String             @default("[]")
  productionApproved   Boolean            @default(false)
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt
  financialStatement   FinancialStatement @relation(fields: [financialStatementId], references: [id])

  @@unique([financialStatementId, field])
  @@index([financialStatementId])
  @@index([field])
}
```

Implementation notes for a future phase:

- The relation field on the real `FinancialStatement` model would be added without removing existing fields.
- `field`, `unit`, and `status` should be validated through the Phase 64 unit metadata contract before use.
- `warningCodes` can follow the existing string-serialized array pattern.
- The storage row does not approve source status.

## 8. Migration Safety Checklist

Machine-readable checklist is implemented in `buildFinancialsUnitMetadataMigrationSafetyChecklist`.

Required gates:

- additive only
- existing rows remain valid
- no destructive change
- no reset
- no seed requirement
- new storage nullable, optional, or relation-optional for old rows
- old rows read as `unknown_unit` for present scale-sensitive values
- invalid persisted metadata is not treated as valid
- `productionApproved:false` remains preserved for local/research/sample data
- no valuation metric becomes ready without explicit units and required market inputs
- rollback notes documented before any migration is applied
- validation commands listed and run
- sidecar table requires relation plus unique statement-field protection

## 9. Phase 68 Implementation Gate

Before applying a real migration:

- Approve Option B or explicitly choose another option.
- Keep migration additive.
- Do not delete or rewrite existing statement rows.
- Add repository write/read tests for sidecar rows.
- Add adapter tests for old rows with no sidecar rows.
- Confirm invalid sidecar units do not unlock metrics.
- Confirm no `dev.db`, generated Prisma files, or temporary import artifacts are committed.
- Run type-check, Prisma validation, lint, and unit tests.
- Document rollback notes before running a migration.

## 10. Tests Added

`src/features/financials/lib/__tests__/financials-unit-metadata-storage-plan.test.ts` covers:

- JSON field recommendation only when provider support and row metadata pattern are confirmed.
- Sidecar table recommendation when JSON storage is not the safe pattern and relation/index work is safe.
- Deferred payload-only recommendation when schema context is insufficient.
- Safety checklist requirements for additive-only behavior, no reset/seed, old-row unknown units, false source approval, and no metric readiness without explicit units.
- Restricted trading wording not appearing in exported helper labels or generated output.
- No source approval claim.

## 11. Browser Verification

Browser verification was not run because Phase 67 changes only helper logic, tests, and documentation. No visible UI behavior changed.

## 12. Non-goals

- no migration applied
- no DB write
- no reset or seed
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
- no source approval

## 13. Limitations

- Unit metadata is still not durably persisted until a later implementation phase.
- Existing DB-backed runtime can remain `unknown_unit` for present Financials values.
- Market input unit metadata remains separate from Financials-owned unit metadata.
- The schema snippet above is a draft only and must be converted into a reviewed migration before use.

## 14. Next Recommended Phase

Recommended next phase: Phase 68 - Additive Financials Unit Metadata Persistence Implementation.

Maximum scope:

- apply the approved additive sidecar migration;
- wire controlled local write/read services to create/read sidecar rows;
- keep old rows backward compatible;
- reject or ignore invalid persisted metadata;
- keep `productionApproved:false` for local/research/sample rows;
- run full validation before commit.

## 15. Phase 68 Follow-up

Phase 68 adds `ADDITIVE_FINANCIALS_UNIT_METADATA_PERSISTENCE_IMPLEMENTATION.md`. The approved sidecar design is now represented by an additive `FinancialStatementUnitMetadata` schema model, a sidecar-only migration, controlled write/read-back service wiring, and tests for old-row compatibility and invalid metadata fail-closed behavior.

No reset, seed, real BCTC import, external API call, UI change, source approval, new metric, target price, fair value range, recommendation, or Risk scoring is added.

## 16. Phase 69 Follow-up

Phase 69 adds `CONTROLLED_UNIT_METADATA_WRITE_TRIAL.md`. The sidecar storage design was exercised with one synthetic explicit-unit row in a temporary SQLite DB outside the repo. Sidecar persistence, read-back, runtime handoff, and controlled Valuation handoff were verified without committing DB files or generated Prisma output.
