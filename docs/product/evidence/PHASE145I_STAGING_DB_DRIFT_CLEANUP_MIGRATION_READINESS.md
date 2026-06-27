# Phase 145I — Staging DB Drift Cleanup / Migration Readiness

## 1. Phase Summary
- Phase 145I focuses on staging DB drift cleanup / migration readiness.
- No DB reset.
- No table drop.
- No data delete.
- No provider import.
- No seed.
- No `productionApproved=true`.
- No production deploy.

## 2. Starting Point From 145H
- `driftDetected=true`
- `dataLossRisk=true`
- `sidecarMigrationSafe=false`
- `migrationRecommendedNow=false`
- `IndustryContext` and `MacroContext` exist in staging DB but are not tracked in migrations.

## 3. Drift Inventory
- **driftTables**: `IndustryContext`, `MacroContext` (and structurally `FinancialStatementUnitMetadata`)
- **Prisma models exist**: Yes, `schema.prisma` contains the models.
- **Migration files reference them**: No. `prisma/migrations` only contains `init_postgres` and `phase_143a_company_business_profile`.
- **Tables used by read-path**: Yes.
- **Data appears required**: Yes.
- **Detailed structural drift (from `prisma migrate diff`)**:
  - `FinancialStatementUnitMetadata`: DB has `warningCodes` column; `schema.prisma` does NOT. DB has `dataMode` of unknown type; Prisma wants `SourceUsageStatus` enum.
  - `IndustryContext` / `MacroContext`: DB has `dataMode` of unknown type; Prisma wants `DataMode` enum.

## 4. Risk Classification
- **dataLossRisk**: true (Prisma's generated diff includes `DROP COLUMN "warningCodes"` and `DROP COLUMN "dataMode"`).
- **resetRequiredByPrisma**: true (Since the DB already contains tables not present in the migration history, Prisma `migrate dev` demands a DB reset to track them).
- **dropRisk**: true
- **orphanRisk**: false (Models are in `schema.prisma` and used by features).
- **productReadPathRisk**: high (These tables likely contain active macro/industry context for RAG).

## 5. Reconciliation Decision
- **safeReconciliationPossible**: false automatically.
- **migrationRecommendedNow**: false
- **migrationCreated**: no
- **migration deferred**: yes
- **blockedReason**: Staging DB has tables not tracked in migrations, and structurally conflicts with `schema.prisma` (e.g., missing `warningCodes` in schema). Prisma forces `DROP COLUMN` and DB resets. Manual alignment or baseline is required to preserve data.

## 6. Guardrail Checks
- No DB reset
- No drop table
- No delete/truncate
- No DB data write
- No `productionApproved=true`
- No `research_only` promotion
- No MarketPrice provenance migration while drift unsafe
- No production deploy

## 7. Validation
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npx tsx scripts/audit-staging-db-drift-readiness.ts
node scripts/run-staging.mjs npm test
```
- `npm test` is not a clean pass.
- Failure classified as local PostgreSQL temp test DB infrastructure issue (`Invalid db.prisma.dataSource.findFirst()`, `Invalid prisma.$queryRawUnsafe()`).

## 8. Recommended Next Phase
Phase 145J — Manual-reviewed staging drift reconciliation plan
