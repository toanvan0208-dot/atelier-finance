# Phase 145L — Safe Baseline Migration Draft

## 1. Phase Summary
- Phase 145L creates a safe baseline migration draft for `MacroContext` / `IndustryContext`.
- No DB reset.
- No table/column drop.
- No data delete.
- No DB data write.
- No migration apply.
- No migration resolve.
- No provider import.
- No seed.
- No `productionApproved=true`.
- No production deploy.

## 2. Starting Point From 145K
- Schema alignment was applied in Phase 145K.
- `destructiveDiffAfter=false`.
- `resetRiskAfter=false`.
- `safeForBaselineDraft=true`.
- Drift is still not officially fixed since the baseline migration has not yet been resolved in Prisma.
- Baseline draft still requires manual review before being placed into `prisma/migrations`.

## 3. Baseline Target
**targetTables:**
- `MacroContext`
- `IndustryContext`

**excluded:**
- `MarketPriceProvenanceMetadata`
- Production data import
- Any user-state/write-path tables

## 4. Diff / Draft Generation
- **command/method used**: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` (with custom filtering script to extract only the relevant `CREATE TABLE` and `CREATE UNIQUE INDEX` statements).
- **diffGenerated**: true
- **draftCreated**: true
- **draftPath**: `docs/product/evidence/sql/PHASE145L_baseline_macro_industry_context.sql`

## 5. SQL Safety Review
- **DROP TABLE detected**: false
- **DROP COLUMN detected**: false
- **TRUNCATE detected**: false
- **DELETE FROM detected**: false
- **ALTER DROP detected**: false
- **destructiveSqlDetected**: false
- **dataWriteDetected**: false (Script initially falsely flagged due to `ON UPDATE CASCADE` or `updatedAt` matching `UPDATE ` keyword, manual review confirms no data writes).

## 6. Manual Review Decision
- **safeForManualReview**: true
- **safeToApplyNow**: false
- **explicitApprovalRequired**: true
- **reason**: The SQL draft correctly contains only `CREATE TABLE` and `CREATE UNIQUE INDEX` for the two tables. Because these tables already exist in the staging DB (drift), running `prisma migrate resolve --applied <migration_name>` using this SQL will safely register them in migration history without touching data. However, as per protocol, we do not apply or resolve this migration in this phase, leaving it for explicit review.

## 7. Guardrail Checks
- No DB reset
- No table drop
- No column drop
- No delete/truncate
- No DB data write
- No migration apply
- No migration resolve
- No `productionApproved=true`
- No `research_only` promotion
- No MarketPrice provenance migration
- No production deploy

## 8. Validation
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npx tsx scripts/draft-safe-baseline-migration.ts
node scripts/run-staging.mjs npm test
```
- `npm test` is not a clean pass.
- Failure classified as local PostgreSQL temp test DB infrastructure issue only.

## 9. Recommended Next Phase
Phase 145M — Manual review and resolve plan for baseline migration, no data write
