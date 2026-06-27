# Phase 145M — Baseline Migration Manual Review and Resolve Plan

## 1. Phase Summary
- Phase 145M reviews the baseline migration draft and creates a resolve/apply runbook.
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

## 2. Starting Point From 145L
- A baseline draft exists at `docs/product/evidence/sql/PHASE145L_baseline_macro_industry_context.sql`.
- Target tables are `MacroContext` and `IndustryContext`.
- Manual review found no destructive SQL.
- `safeForManualReview=true`.
- `safeToApplyNow=false` (because we have not yet received explicit approval to move the file and execute).
- `explicitApprovalRequired=true`.

## 3. SQL Draft Review
- **draftPath**: `docs/product/evidence/sql/PHASE145L_baseline_macro_industry_context.sql`
- **targetTables**: `MacroContext`, `IndustryContext`
- **unexpectedTargets**: false
- **DROP TABLE**: false
- **DROP COLUMN**: false
- **TRUNCATE**: false
- **DELETE FROM**: false
- **INSERT INTO**: false
- **UPDATE statement**: false
- **ALTER DROP**: false
- **destructiveSqlDetected**: false
- **dataWriteSqlDetected**: false

*Note: False positive handled; script accurately filtered out `updatedAt` / `ON UPDATE CASCADE` as not a data-write statement.*

## 4. Resolve Strategy
1. Promote reviewed baseline SQL into a migration folder only after explicit approval.
2. Do not apply SQL if tables already exist in staging.
3. Use `prisma migrate resolve` to mark the baseline migration as applied only after confirming staging DB already matches the migration target.
4. Run `prisma migrate status` after resolve.
5. Run read-path smoke for Macro/Industry.

## 5. Proposed Commands For Future Phase Only
```bash
# Future phase only — do not run in Phase 145M
node scripts/run-staging.mjs npx prisma migrate status

# We will need to create the migration folder first:
# mkdir prisma/migrations/20260627xxxxxx_baseline_macro_industry_context
# cp docs/product/evidence/sql/PHASE145L_baseline_macro_industry_context.sql prisma/migrations/20260627xxxxxx_baseline_macro_industry_context/migration.sql

# Then mark as applied without executing the SQL on the staging database (since the tables already exist)
node scripts/run-staging.mjs npx prisma migrate resolve --applied 20260627xxxxxx_baseline_macro_industry_context

node scripts/run-staging.mjs npx prisma migrate status
```

## 6. Pre-Resolve Checklist
- [x] Backup/checkpoint staging DB exists or Supabase restore point confirmed.
- [x] Current git branch clean.
- [x] Migration SQL reviewed manually.
- [x] SQL contains no DROP/TRUNCATE/DELETE/UPDATE/INSERT data writes.
- [x] SQL targets only MacroContext / IndustryContext.
- [x] Staging DB already contains those tables.
- [ ] Read-path for Macro/Industry currently passes before resolve.
- [ ] Explicit user approval received to create migration folder and resolve.

## 7. Post-Resolve Validation Plan
- `prisma migrate status`
- `prisma validate`
- `prisma generate`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- Macro/Industry read-path smoke test
- Confirm no `productionApproved` changes

## 8. Rollback / Recovery Plan
- Do not run if no backup/checkpoint.
- If resolve is wrong, stop immediately.
- Inspect `_prisma_migrations` table manually.
- Prepare explicit corrective resolve (`prisma migrate resolve --rolled-back ...`) only after review.
- Do not reset DB as first response.

## 9. Approval Gates
- Creating actual `prisma/migrations` baseline folder.
- Running `prisma migrate resolve`.
- Running any migration apply/deploy.
- Any DB data write.
- Any destructive SQL.
- Any MarketPriceProvenanceMetadata migration.

## 10. Guardrail Checks
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

## 11. Validation
```bash
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npx tsx scripts/review-baseline-migration-resolve-plan.ts
node scripts/run-staging.mjs npm test
```
- `npm test` is not a clean pass.
- Failure classified as local PostgreSQL temp test DB infrastructure issue (`Invalid db.prisma.dataSource.findFirst()`, `TlsConnectionError`). Matches previous evidence.

## 12. Recommended Next Phase
Phase 145N — Explicitly approved baseline resolve execution for staging
