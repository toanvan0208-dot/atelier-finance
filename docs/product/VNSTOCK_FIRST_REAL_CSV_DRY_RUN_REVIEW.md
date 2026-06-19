# Vnstock First Real CSV Dry-Run Review

Phase: 31O - First Real CSV Dry-Run Review

## 1. Purpose

This document records the first dry-run with a real CSV file that the user exported from Vnstock outside the repo.

This is local academic/research verification only. It is not production data integration, does not use `--write`, does not write to the database, does not make the app call Vnstock, and does not approve any production source.

## 2. Input Summary

| Field | Value |
| --- | --- |
| Ticker | `FPT` |
| Date range requested | `2025-01-01` to `2025-01-31` |
| File path | `D:\fpt-market-prices.csv` |
| File location | Outside repo |
| Format | `csv` |
| Data input mode | `user_provided_manual_export` |
| Command mode | `local_research` |
| Dry-run only | `true` |

The real CSV rows are not copied into this document or committed to the repo.

## 3. Command Executed

```powershell
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --file "D:\fpt-market-prices.csv" --format csv
```

Notes:

- `--write` was not used.
- Env safety flags were used before the command.
- Env safety flags were cleared after the command.
- Do not rerun with `--write` without a separate reviewed phase.

## 4. Result Summary

| Field | Value |
| --- | --- |
| `status` | `dry_run_completed` |
| `dryRun` | `true` |
| `mode` | `local_research` |
| `normalizedCount` | `17` |
| `insertedCount` | `0` |
| `updatedCount` | `0` |
| `skippedCount` | `0` |
| `rejectedCount` | `0` |
| `productionApproved` | `false` |
| `errors` | `[]` |

## 5. Warning Interpretation

- Academic/local research warnings are expected and must remain.
- Vnstock remains not production-approved.
- Original data rights may belong to upstream providers.
- Several FPT records from `2024-12-23` to `2024-12-31` were skipped because they are outside the requested date range.
- The out-of-range skips are acceptable and show date-range filtering is working.
- No wrong ticker rejection appeared in this real dry-run.
- No invalid numeric/date rejection appeared in this real dry-run.

## 6. Review Conclusion

- The first real CSV dry-run passed.
- The manual file import bridge can read and normalize a real user-provided CSV export.
- The dry-run did not write DB rows.
- The command preserved `productionApproved:false`.
- The CSV file must remain outside the repo.
- This result does not mean the source is production-approved.
- This result does not mean the app has a real-time data provider.
- This result does not mean commercial usage is approved.

## 7. Repo Hygiene Checklist

After the dry-run, run:

```bash
git status --short
```

Confirm:

- `D:\fpt-market-prices.csv` is outside the repo and not shown by Git.
- No real CSV/JSON export is staged or untracked inside the repo.
- `dev.db` and `prisma/dev.db` are not dirty.
- `src/generated/prisma` is not dirty.
- `tsconfig.tsbuildinfo` is not dirty.
- No generated output/import result files are dirty or untracked.

## 8. Before Any Future Write Phase

Before any future `--write` phase:

- User explicitly approves a local DB write.
- Dry-run output is reviewed and accepted.
- `normalizedCount > 0`.
- `rejectedCount` is understood.
- Warnings are understood.
- The CSV file remains outside the repo.
- A backup/reset plan exists for the local DB.
- The `--write` command must be run once on a small date range first.
- After write, DB counts must be inspected.
- No `productionApproved:true`.
- No DB or CSV file is committed.
- No public UI, API, cron, scheduler, or app-start import path is added.

## 9. Non-Goals

Phase 31O does not:

- Add a real fetcher.
- Call Vnstock from the app.
- Install dependencies.
- Run `--write`.
- Write to the database.
- Add UI, API, cron, or scheduler behavior.
- Approve any production source.
- Commit a real CSV file.
- Commit raw data.
- Add recommendation or signal logic.

## 10. Phase 31P First Local DB Write Trial Plan

Phase 31P adds `docs/product/VNSTOCK_FIRST_LOCAL_DB_WRITE_TRIAL_PLAN.md` to plan a future first local DB write trial. It documents backup/reset checks, repo hygiene checks, expected output, and Phase 31Q acceptance criteria, but it does not run `--write` or write DB data.

## 11. Phase 31Q First Local DB Write Trial

Phase 31Q followed this dry-run with the first local DB write trial. The write review is recorded in `docs/product/VNSTOCK_FIRST_LOCAL_DB_WRITE_TRIAL_REVIEW.md`.

The write used the same reviewed ticker, date range, and outside-repo CSV path. It returned `import_completed`, inserted `17` local `research_only` rows, did not stage or commit the CSV/DB files, and preserved `productionApproved:false`.
