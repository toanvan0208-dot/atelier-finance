# PostgreSQL Main Merge Plan (Phase 142G-M2)

## Current Status
- **Branch**: `phase-142f-postgres-docker-dry-run`
- **Head**: `f7186d213a242194256ea253675b081b04dca5fd`
- **Target**: `main`

## What Will Be Merged
- Complete migration of Prisma ORM from SQLite to PostgreSQL.
- Updated schema definitions supporting PostgreSQL specific constraints, native enums.
- Removed all SQLite runtime logic and database initialization codes.
- Local data source guards updated to safely detect and allow local Postgres instances.
- Evidence documentation for validation pipelines, dry runs, and integration reviews.

## Pre-Merge Validation Gate
- **Blocker**: Remove `diagrams/`, `docs/thesis/`, and `docs/product/evidence/source-pdfs/` from this branch.
- **Diff Cleanliness**: Rerun `git diff --name-status origin/main...HEAD` to verify only the above intended files are included.
- **Validation**: Re-run validation (`prisma validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`) after out-of-scope files are removed to ensure zero regressions.

## Merge Command Plan
Once the branch is clean, execute the following commands in the terminal:
```bash
git checkout main
git pull origin main
git merge phase-142f-postgres-docker-dry-run --no-ff -m "merge: Phase 142F postgres migration"
git push origin main
```

## Post-Merge Validation Gate (on main)
Immediately after merging, pull the `main` branch locally and verify:
1. Complete validation suite passes identically as it did on the branch.
2. Verify Supabase staging DB can connect locally without errors.
3. No secret or `.env` files leaked.

## Rollback Plan
If validation fails post-merge or critical failures occur in deployment:
1. Revert the merge commit locally: `git revert -m 1 HEAD`.
2. Push the reverted main to origin.
3. Re-run local suite with SQLite branch fallback.

## Stop Conditions
Do not merge if:
- Diff contains unexpected domain or feature files outside of the PostgreSQL ORM transition.
- Validation exit code != 0.
- `productionApproved` is forced to `true` anywhere in the tests or fixtures.

## Explicitly Not Production
- This merge does NOT deploy to production.
- Production readiness is strictly `false`.

## Explicitly No Data Import
- This merge does NOT import any staging or production data into the schema.
- Data import will be handled in subsequent phases once the new schema is safely on `main`.

## Next Phases After Merge
1. **Staging reviewed-preview data import**: Import staging data directly into Supabase.
2. **Staging read-path/API/UI smoke**: Perform a dry run of the application locally pointing at Staging DB.
3. **Vercel deployment/live smoke**: Deploy the latest `main` branch with Postgres to Vercel and verify functionality in the live environment.
4. **Production**: Execute production data initialization *only* after staging validation completes perfectly.
