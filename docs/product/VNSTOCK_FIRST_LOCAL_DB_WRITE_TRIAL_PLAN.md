# Vnstock First Local DB Write Trial Plan

Phase: 31P - First Local DB Write Trial Plan

## 1. Purpose

This document plans the first write of real user-provided Vnstock CSV data into the local development database.

The data would come from a real CSV file that the user exported from Vnstock outside the repo. Phase 31P does not run `--write`, does not write to the database, and does not approve any production source. The goal is to make any future Phase 31Q write trial small, explicit, inspectable, and reversible.

## 2. Current Verified Dry-Run Input

Phase 31O reviewed this dry-run result:

| Field | Value |
| --- | --- |
| Ticker | `FPT` |
| Date range | `2025-01-01` to `2025-01-31` |
| File path | `D:\fpt-market-prices.csv` |
| File location | Outside repo |
| Format | `csv` |
| Status | `dry_run_completed` |
| `normalizedCount` | `17` |
| `rejectedCount` | `0` |
| `insertedCount` | `0` |
| `updatedCount` | `0` |
| `skippedCount` | `0` |
| `dryRun` | `true` |
| `productionApproved` | `false` |
| Errors | `[]` |

Out-of-range FPT rows from December 2024 were skipped correctly. The real CSV rows are not copied into docs and are not committed to the repo.

## 3. Write Trial Principles

- First write must be small.
- Use only one ticker: `FPT`.
- Use only the same reviewed date range: `2025-01-01` to `2025-01-31`.
- Use the same CSV path unless the user explicitly changes it.
- Do not import all-market data.
- Do not import intraday/live data.
- Do not import financial statements or fundamentals.
- Do not import recommendation, rating, target, or signal columns.
- Keep `productionApproved:false`.
- Keep source metadata academic/local/research.
- Keep the CSV outside the repo.
- Keep the DB local only.
- Do not commit the DB file.

## 4. Pre-Write Checklist

Before any future `--write` command, confirm:

- Git worktree is clean.
- No real CSV/JSON export is inside the repo.
- No protected files are dirty.
- Dry-run was completed and reviewed.
- `normalizedCount > 0`.
- `rejectedCount = 0`, or all rejected records are reviewed and acceptable.
- Warnings are understood.
- Ticker is correct.
- Date range is correct.
- CSV path is correct.
- User explicitly approves local DB write.
- User understands this is local academic/research data.
- User understands this is not a production-approved source.
- Backup/reset plan is available.

## 5. Local DB Backup/Reset Plan

### Option A - Reset local DB if something goes wrong

```bash
npm run db:reset
npm run db:seed
```

Notes:

- This resets the local development DB.
- Do not use this on a production DB.
- Confirm the project is using the local SQLite/dev DB before doing a destructive reset.
- Do not commit the DB file after reset or write.

### Option B - Copy local DB before write if applicable

The repo documents the default local SQLite setting in `.env.example` as:

```env
DATABASE_URL="file:./dev.db"
```

The reset script also handles `dev.db`, `dev.db-journal`, `prisma/dev.db`, and `prisma/dev.db-journal`.

Before a future write:

- Check `DATABASE_URL` in local `.env.local`, but do not commit or expose `.env.local`.
- If `DATABASE_URL` points to `file:./dev.db` or `prisma/dev.db`, copy that DB file outside the repo before write.
- If DB is not file-based or the path is unclear, prefer the `db:reset` / `db:seed` rollback workflow.
- Do not commit DB backup files.

## 6. Planned Write Command, Not To Run In Phase 31P

PowerShell env for a future reviewed phase:

```powershell
$env:VNSTOCK_RESEARCH_CONNECTOR_ENABLED = "true"
$env:VNSTOCK_RESEARCH_ALLOW_NETWORK = "true"
$env:VNSTOCK_RESEARCH_MODE = "local_research"
$env:VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK = "true"
```

Candidate write command for Phase 31Q:

```powershell
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --file "D:\fpt-market-prices.csv" --format csv --write
```

Clear env after the command:

```powershell
Remove-Item Env:VNSTOCK_RESEARCH_CONNECTOR_ENABLED
Remove-Item Env:VNSTOCK_RESEARCH_ALLOW_NETWORK
Remove-Item Env:VNSTOCK_RESEARCH_MODE
Remove-Item Env:VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK
```

Do not run this command in Phase 31P. Run only in Phase 31Q after explicit approval.

## 7. Expected Write Output

Based on the reviewed dry-run, if the local DB has no existing FPT records for this Vnstock research source/date range:

- `status` should be `import_completed`.
- `dryRun` should be `false`.
- `normalizedCount` should be `17`.
- `insertedCount` may be `17` if no duplicates exist.
- `updatedCount` is likely `0` under the current default duplicate policy.
- `rejectedCount` should be `0`.
- `productionApproved` should remain `false`.
- Warnings may include academic/local source boundary warnings and out-of-range skipped rows.

Do not overread exact insert/update/skip counts. If records already exist, inserted, updated, or skipped counts may differ depending on duplicate policy and existing local DB state. The important checks are no errors, `productionApproved:false`, and explainable DB counts.

## 8. Post-Write Inspection Checklist For Future Phase 31Q

Command output:

- `status`.
- `dryRun:false`.
- `normalizedCount`.
- `insertedCount`, `updatedCount`, and `skippedCount`.
- `rejectedCount`.
- `warnings`.
- `errors`.
- `productionApproved:false`.

DB inspection:

- FPT rows exist for `2025-01-01` to `2025-01-31`.
- Source/provider metadata indicates Vnstock/manual/local research usage.
- Production approval metadata remains false.
- Missing values remain `null`, not `0`.
- No recommendation or signal fields are created.
- No unexpected ticker is imported.
- No rows outside the requested range are imported.

Repo hygiene:

- Run `git status --short`.
- No real CSV file appears.
- No DB file is staged.
- No generated Prisma output is dirty.
- `tsconfig.tsbuildinfo` is not dirty.
- No output/import result files are dirty or untracked.

## 9. Acceptance Criteria For Phase 31Q

Phase 31Q can be considered successful only if:

- `--write` is run once on the small reviewed FPT range.
- No real CSV is committed.
- DB write counts are explainable.
- `productionApproved:false` remains.
- No public API, UI, cron, scheduler, or app-start import is added.
- No app direct Vnstock fetcher is added.
- No investment recommendation wording is added.
- Tests and validation pass after write.
- Protected files are not staged or committed.

## 10. Non-Goals

Phase 31P does not:

- Run `--write`.
- Write to the database.
- Add a real fetcher.
- Call Vnstock from the app.
- Install dependencies.
- Add UI, API, cron, or scheduler behavior.
- Approve any production source.
- Commit a real CSV file.
- Commit a DB file.
- Import financial statements or fundamentals.
- Add recommendation or signal logic.

## 11. Phase 31Q Execution Review

Phase 31Q executed the planned local DB write trial and recorded the result in `docs/product/VNSTOCK_FIRST_LOCAL_DB_WRITE_TRIAL_REVIEW.md`.

Summary:

- `--write` was executed for `FPT` over `2025-01-01` to `2025-01-31`.
- The CSV file stayed outside the repo at `D:\fpt-market-prices.csv`.
- The command returned `import_completed`.
- `normalizedCount` was `17`.
- `insertedCount` was `17`.
- `updatedCount`, `skippedCount`, and `rejectedCount` were `0`.
- DB verification found `17` FPT `research_only` rows in range and no FPT `research_only` rows outside range.
- No DB or CSV file was staged or committed.
- `productionApproved:false` remained in the command result.
