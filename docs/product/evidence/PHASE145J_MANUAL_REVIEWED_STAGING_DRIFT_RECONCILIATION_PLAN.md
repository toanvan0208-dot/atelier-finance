# Phase 145J — Manual-Reviewed Staging Drift Reconciliation Plan

## 1. Phase Summary
- Phase 145J creates a manual-reviewed staging drift reconciliation plan.
- No DB reset.
- No table/column drop.
- No data delete.
- No DB write.
- No migration apply.
- No provider import.
- No seed.
- No `productionApproved=true`.
- No production deploy.

## 2. Starting Point From 145I
- `IndustryContext` and `MacroContext` exist in staging DB but are not tracked in migrations.
- They are used by the product read-path.
- Structural conflicts exist between DB and Prisma schema:
  - `SourceUsageStatus` vs `String` mismatch on `dataMode` column.
  - `warningCodes` column conflict on `FinancialStatementUnitMetadata`.
- Prisma reports reset/data loss risk when generating migrations.

## 3. Drift Inventory
- **driftTables**: `IndustryContext`, `MacroContext`
- **structuralConflicts**: 
  - `FinancialStatementUnitMetadata`: DB has `warningCodes`, schema lacks it.
  - `FinancialStatementUnitMetadata`: DB `dataMode` type differs from schema `SourceUsageStatus`.
  - `IndustryContext`: DB `dataMode` type differs from schema `DataMode`.
  - `MacroContext`: DB `dataMode` type differs from schema `DataMode`.
- **columnsAtRisk**: `FinancialStatementUnitMetadata.warningCodes`, `FinancialStatementUnitMetadata.dataMode`, `IndustryContext.dataMode`, `MacroContext.dataMode`.
- **schemaModelsPresent**: Yes, models exist in `schema.prisma`.
- **migrationFilesReferencingDriftTables**: None.
- **tablesUsedByReadPath**: Yes.

## 4. Destructive Operation Risk
- **DROP TABLE risk**: low (Prisma doesn't try to drop tables, it tries to drop columns or reset DB).
- **DROP COLUMN risk**: high (Prisma wants to `DROP COLUMN warningCodes` and `DROP COLUMN dataMode`).
- **resetRequiredByPrisma**: true (because DB has untracked tables).
- **dataLossRisk**: true (if schema migration is applied naively).
- **safeApplyNow**: false.

## 5. Classification Table

| Item | Observed issue | Classification | Preserve? | Action now | Action later |
|------|----------------|----------------|-----------|------------|--------------|
| `IndustryContext` table | Exists in DB, no migration | migration_history_gap | Yes | Plan baseline | Baseline migration |
| `MacroContext` table | Exists in DB, no migration | migration_history_gap | Yes | Plan baseline | Baseline migration |
| `FinancialStatementUnitMetadata.warningCodes` | Missing in schema, exists in DB | schema_db_type_mismatch / destructive_diff_risk | Yes | Recommend schema alignment | Re-add to `schema.prisma` |
| `dataMode` / `SourceUsageStatus` | Enum in schema vs String in DB | schema_db_type_mismatch | Yes | Recommend schema alignment | Revert to `String` in `schema.prisma` or alter DB column type |

## 6. Recommended Reconciliation Strategy
**Schema alignment first, then manual baseline migration**
1. **Schema alignment**: Re-add `warningCodes` to `FinancialStatementUnitMetadata` in `schema.prisma` and align `dataMode` types to match the DB schema natively (so that `prisma migrate diff` reports empty/clean structural diff).
2. **Manual baseline migration**: Create a baseline migration (`prisma migrate diff --from-empty --to-schema-datamodel` for the tables) and use `prisma migrate resolve --applied` to register it as history without executing destructive queries.

## 7. Explicit Approval Gates
The following actions require separate and explicit approval before application:
- Any schema.prisma alignment that changes generated client behavior (e.g. changing `SourceUsageStatus` back to `String`).
- Any baseline migration creation.
- Any destructive diff (None recommended, all must be avoided).
- Any DB write.
- Any table/column cleanup.
- Any MarketPriceProvenanceMetadata migration (Requires drift to be resolved first).

## 8. Guardrail Checks
- No DB reset.
- No table drop.
- No column drop.
- No delete/truncate.
- No DB data write.
- No migration apply.
- No `productionApproved=true`.
- No `research_only` promotion.
- No MarketPrice provenance migration while drift unsafe.
- No production deploy.

## 9. Validation
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npx tsx scripts/plan-staging-drift-reconciliation.ts
node scripts/run-staging.mjs npm test
```
All static validation, linting, formatting passed cleanly.
`npm test` is not a clean pass.
Failure classified as local PostgreSQL temp test DB infrastructure issue only.

## 10. Recommended Next Phase
Phase 145K — Schema/DB alignment decision for dataMode and warningCodes, no apply
