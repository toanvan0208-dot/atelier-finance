# Vnstock First Real Manual Export Trial Guide

Phase: 31N - First Real Local Manual Export Trial Guide

## 1. Purpose

This guide explains the first trial with a real CSV/JSON file that the user exports from Vnstock outside Atelier Finance.

The goal is dry-run validation only. This is an academic/local research workflow, not production data integration. The app does not call Vnstock, does not fetch network data, does not write to the database in this phase, and does not approve any production source.

## 2. Current Safe Pipeline

`Vnstock outside repo -> user exports CSV/JSON -> local file stays outside committed source -> Atelier Finance local import command reads file -> parse/normalize -> dry-run report -> user reviews warnings -> only a later reviewed phase may consider --write`

## 3. Real Trial Rules

- Use only one ticker first; `FPT` is recommended for the first trial.
- Use a short date range first, such as 5-20 trading days.
- Do not use all-market export.
- Do not use intraday/live data.
- Do not include financial statements or fundamentals.
- Do not include recommendation, rating, target price, or action-signal columns.
- Do not commit the CSV/JSON file.
- Do not place a real CSV/JSON file in `docs/product/templates`.
- Do not run `--write` in this phase.
- Always run dry-run first.
- Keep `productionApproved:false`.
- Treat the file as user-provided research data.

## 4. Expected CSV Columns

Accepted columns:

```csv
ticker,date,open,high,low,close,volume,tradingValue
```

Required:

- `ticker`
- `date`

Optional numeric:

- `open`
- `high`
- `low`
- `close`
- `volume`
- `tradingValue`

Rules:

- Empty numeric cell becomes `null`.
- Invalid numeric value becomes `null` plus a warning.
- Invalid ticker/date is rejected with a warning.
- Wrong ticker is skipped with a warning.
- Unknown extra columns are ignored safely.
- Do not use `0` as a placeholder for missing values.

## 5. Where To Put Real Exported Files

Prefer a folder outside the repo, for example:

```powershell
C:\Users\<user>\Documents\atelier-finance-local-data\fpt-market-prices.csv
```

Use a local ignored folder only if `.gitignore` already covers it. If not already ignored, keep real exported files outside the repo. Do not create or commit a local real-data folder in this phase.

## 6. PowerShell Dry-Run Workflow

Set safety env:

```powershell
$env:VNSTOCK_RESEARCH_CONNECTOR_ENABLED = "true"
$env:VNSTOCK_RESEARCH_ALLOW_NETWORK = "true"
$env:VNSTOCK_RESEARCH_MODE = "local_research"
$env:VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK = "true"
```

Run dry-run:

```powershell
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --file "C:\Users\<user>\Documents\atelier-finance-local-data\fpt-market-prices.csv" --format csv
```

Important:

- Do not include `--write`.
- If the path has spaces, wrap it in quotes.
- If `--format` is omitted, `.csv` or `.json` extension may be inferred by the current command.

Clear env:

```powershell
Remove-Item Env:VNSTOCK_RESEARCH_CONNECTOR_ENABLED
Remove-Item Env:VNSTOCK_RESEARCH_ALLOW_NETWORK
Remove-Item Env:VNSTOCK_RESEARCH_MODE
Remove-Item Env:VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK
```

## 7. What To Inspect After Dry-Run

- `status` should be `dry_run_completed`.
- `dryRun` should be `true`.
- `normalizedCount` should be greater than `0`.
- `insertedCount` and `updatedCount` should be `0`.
- `productionApproved` should be `false`.
- Review all warnings.
- Understand every rejected/skipped count.
- Confirm no unexpected ticker was normalized.
- Confirm missing fields remain `null`, not `0`.
- Confirm no recommendation or signal fields are present.

## 8. Common Dry-Run Outcomes

| Outcome | Meaning / next check |
| --- | --- |
| `local_import_ack_required` | Missing `VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true`. |
| `file_validation_failed` | File path, permission, parse, or format issue. Check the command error details. |
| `usage_validation_failed` | Missing or invalid `--ticker`, `--from`, or `--to`. |
| Unknown format error | Provide `--format csv` or `--format json`. |
| `dry_run_completed` with warnings | Review warnings before any future write phase. |
| `normalizedCount = 0` | Likely wrong ticker, wrong date range, bad header, or invalid dates. |

## 9. Repo Hygiene Checklist After Dry-Run

Run:

```bash
git status --short
```

Confirm no real data files are dirty or untracked inside the repo.

Protected files must not be dirty:

- `.env.local`
- `dev.db`
- `prisma/dev.db`
- `.next-dev.log`
- `.next-dev.err.log`
- `src/generated/prisma`
- `tsconfig.tsbuildinfo`
- `package.json` / `package-lock.json` unless intentionally changed
- real CSV/JSON exports
- generated output/import result files

If a real CSV/JSON export appears in git status, do not stage it. Move it outside the repo or handle a local ignored path only in a separate reviewed phase.

## 10. Graduation Criteria Before Future Write Phase

- Dry-run completed successfully.
- `normalizedCount > 0`.
- Warnings are reviewed and acceptable.
- No wrong ticker records are present.
- No unexpected `0` placeholders are present.
- Source and usage metadata remain academic/local/research.
- User explicitly approves a write phase.
- A backup/reset plan exists for the local DB.
- The command remains local only and dry-run by default.

## 11. Non-Goals

Phase 31N does not:

- Add a real fetcher.
- Call Vnstock.
- Call upstream APIs.
- Install Python or Vnstock dependencies.
- Install new dependencies.
- Import a real CSV/JSON file into DB.
- Run `--write`.
- Add UI, API, cron, or scheduler behavior.
- Approve any production source.
- Commit real data.

## 12. Phase 31O First Real CSV Dry-Run Review

The first real user-provided CSV dry-run is recorded in `docs/product/VNSTOCK_FIRST_REAL_CSV_DRY_RUN_REVIEW.md`.

Summary:

- Ticker `FPT`, requested range `2025-01-01` to `2025-01-31`.
- Real CSV file stayed outside the repo at `D:\fpt-market-prices.csv`.
- `normalizedCount` was `17`.
- `rejectedCount` was `0`.
- No DB rows were written.
- `--write` was not used.
- `productionApproved:false` remained in the command result.
