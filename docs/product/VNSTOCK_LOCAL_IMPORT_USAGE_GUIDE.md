# Vnstock Local Import Usage Guide

Date: 2026-06-19

Phase: 31F - Local Import Usage Guide And Verification Checklist

This document explains how to use the local-only Vnstock research market price import command safely. It documents the Phase 31H local runner wiring. It does not add a real fetcher, change runtime code, expose an API, add a UI trigger, create a cron job, seed real data, or approve any production source.

## 1. Purpose

This guide covers the local-only command/runner for market prices/PVT research validation:

- Use only for academic, local, and research validation.
- Do not treat it as production ingestion.
- Do not treat it as a realtime market feed.
- Do not treat it as a commercial data provider.
- Do not use it as a substitute for a reviewed and approved data source.
- Do not use imported market price/PVT output as buy, sell, or hold guidance.

Atelier Finance remains a real capstone application. This guide keeps local research imports understandable without making source-rights or reliability claims that the project has not reviewed.

## 2. Current Implementation Status

After Phase 31E:

- The Vnstock research connector skeleton fails closed by default.
- The controlled fetch/normalize branch exists for market prices/PVT historical daily records.
- The persistence service exists for normalized research market price records.
- The local command/runner exists.
- Dry-run is the default behavior.
- `--write` must be explicit.
- A real Vnstock fetcher is not configured by default.
- If no injected/local fetcher is configured, the command fails closed with `fetcher_not_configured`.
- There is no public API, UI button, cron job, scheduler, or app-start import.

The runner is `src/lib/data-sources/vnstock-market-price-import-command.ts`.
The thin script wrapper is `scripts/import-vnstock-market-prices.ts`.

## 3. Safety Model

The local import flow has several safety layers:

- Env safety flags must be set before fetch or persistence can run.
- `VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true` is required as a local import acknowledgement.
- Dry-run is the default.
- `--write` is required before persistence is attempted.
- There is no automatic fetch.
- There is no public runtime trigger.
- Source metadata must keep `productionApproved:false`.
- Missing numeric fields remain `null`.
- Missing numeric fields are not converted to `0`.
- Manual/user data is not silently overwritten.
- Raw data, `dev.db`, generated Prisma output, and import result files must not be committed.

## 4. Required Env Variables

The command requires all of these variables before it may fetch or persist:

```bash
VNSTOCK_RESEARCH_CONNECTOR_ENABLED=true
VNSTOCK_RESEARCH_ALLOW_NETWORK=true
VNSTOCK_RESEARCH_MODE=local_research
VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true
```

Meaning:

- `VNSTOCK_RESEARCH_CONNECTOR_ENABLED`: enables the local research connector branch.
- `VNSTOCK_RESEARCH_ALLOW_NETWORK`: allows the local research branch to pass the network guard, but it does not mean a real fetcher exists.
- `VNSTOCK_RESEARCH_MODE`: must be `local_research`.
- `VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK`: confirms the runner understands this is academic/local research import only and not an approved production data source.

If any variable is missing or different, the command must fail closed and must not write to the database.

## 5. Command Usage

`package.json` includes a local-only import npm script after Phase 31H:

Current state:

- The repo has a script wrapper: `scripts/import-vnstock-market-prices.ts`.
- The repo uses `tsx` as a dev-only TypeScript script runner.
- The local npm script is `import:market-prices:vnstock:local`.
- The script only runs the local command wrapper; it does not add a real fetcher.
- The script is not part of `dev`, `build`, `test`, `lint`, `postinstall`, or seed workflows.

Dry-run usage:

```bash
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31
```

Write usage:

```bash
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --write
```

Dry-run remains the default. `--write` must be explicit.

## 6. Dry-Run Workflow

Dry-run is the default.

Use dry-run to check:

- Argument parsing.
- Env safety flags.
- Fetcher configuration.
- Report shape.
- Normalized and rejected counts when a fetcher is injected.

Dry-run does not write to the database. If no real/local fetcher is configured, dry-run can still fail closed with `fetcher_not_configured`; that is expected in the current repo state.

Review these report fields:

- `ticker`
- `from`
- `to`
- `dryRun:true`
- `productionApproved:false`
- `warnings`
- `normalizedCount`
- `rejectedCount`

## 7. Write Workflow

Use `--write` only after a dry-run has been reviewed.

Write mode requires:

- All env safety flags.
- Local import acknowledgement.
- Explicit `--write`.
- A configured injected/local fetcher.
- Safe source metadata.

Write mode:

- Persists only normalized records.
- Does not persist raw payload files.
- Rejects missing or unsafe metadata.
- Rejects any attempt to persist with production approval set to true.
- Defaults duplicate handling to skip in the persistence service.
- Supports update only through an explicit service option, not silent overwrite.
- Does not silently overwrite manual/user market price data.

## 8. Verification Checklist Before Import

Before running a local import:

- Previous phase changes are committed or otherwise intentionally handled.
- `git status` is clean.
- You understand this is a local academic research import.
- Required env variables are set.
- A specific `--ticker`, `--from`, and `--to` are chosen.
- The command is not importing the whole market.
- The command is not using intraday/realtime data.
- No raw data, PDF, Excel, import output, or local DB file is waiting to be committed.
- If a dev server may lock `dev.db`, stop it before `db:reset` or import work that needs the database.

## 9. Verification Checklist After Dry-Run

After dry-run:

- The report keeps `productionApproved:false`.
- The report does not contain investment action wording.
- Sample or test data is not described as real source data.
- `fetcher_not_configured` is expected when no real/local fetcher has been configured.
- No database write occurred.
- `git status` does not show `dev.db`, raw output, generated Prisma output, or `tsconfig.tsbuildinfo`.

## 10. Verification Checklist After Write

After write:

- Check inserted, skipped, updated, and rejected counts.
- Check source metadata.
- Confirm `productionApproved:false`.
- Confirm missing numeric fields remain `null`.
- Confirm duplicates do not create repeated records.
- Confirm manual/user market price data was not overwritten.
- Confirm `git status` does not stage or include `dev.db`, `prisma/dev.db`, generated Prisma output, raw data, or import reports.
- Do not commit local DB or raw source data.

## 11. How To Inspect Local DB Safely

The repo already has database workflow scripts, including `prisma:studio`, `db:reset`, and `db:seed`.

Safe inspection notes:

- Prisma Studio can be used if it is already part of the local workflow.
- Do not commit the local DB.
- Do not capture or add raw source-equivalent data to the repo unless a later phase explicitly approves it.
- `npm run db:reset` resets the local SQLite database, so use it only when local data loss is acceptable.

## 12. AI Disclosure Examples

When a user asks where imported market price data came from:

> Du lieu market price hien tai duoc dua vao he thong qua quy trinh import local phuc vu muc dich hoc thuat/nghien cuu. He thong khong tuyen bo day la nguon du lieu production hoac du lieu thuong mai da duoc cap phep day du.

When a user asks how reliable it is:

> Co the dung de kiem thu va tham khao trong pham vi do an, nhung khong nen xem la tuyet doi. Khi ra quyet dinh tai chinh that, nguoi dung nen doi chieu voi nguon cong bo chinh thuc hoac nguon du lieu da duoc phep cho muc dich can thiet.

When a user asks whether it is realtime:

> Quy trinh hien tai khong phai realtime feed. Day la import local co kiem soat; du lieu can duoc xem cung thoi diem cap nhat va nguon du lieu.

The AI must not turn PVT or imported market prices into a trading instruction.

## 13. Troubleshooting

| Case | Expected handling |
| --- | --- |
| `git status` is dirty before running | Stop and resolve or intentionally commit/stash existing work before import. |
| `fetcher_not_configured` | Expected unless a local research fetcher has been injected/configured. No DB write should occur. |
| `network_not_allowed` | Set `VNSTOCK_RESEARCH_ALLOW_NETWORK=true` only if the local research run is intentional. |
| `local_import_ack_required` | Set `VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true` only after confirming the academic/local boundary. |
| Missing `--ticker`, `--from`, or `--to` | Re-run with one specific ticker and explicit date range. |
| `dev.db` locked by dev server | Stop the dev server before database reset or write import work. |
| `db:reset` changes local data | This is expected; it resets local SQLite state. Do not use it when local records must be preserved. |
| Command runner unavailable | After Phase 31H, `tsx` should be available through the local npm script. If unavailable, reinstall dependencies from the npm lockfile before running local checks. |
| Unexpected DB/generated files in `git status` | Restore or exclude generated/local artifacts before final review; do not commit them. |

## 14. What Phase 31F Does Not Do

Phase 31F does not:

- Add a real Vnstock fetcher.
- Add a dependency.
- Add an npm script when the repo has not chosen a TypeScript script runner.
- Open a public API.
- Add a UI button.
- Add cron or scheduler behavior.
- Add app-start import.
- Approve a production source.
- Process financial statements or fundamentals.
- Seed real data.

## 15. Historical Next Phase Proposal

At the end of Phase 31F, the recommended next phase was Phase 31G - Local Script Runner Wiring Or Real Fetcher Decision.

Option A - Add script runner wiring:

- Only if the repo chooses `tsx`, `ts-node`, or another script runtime.
- Add a clearly named local/research npm script.
- Do not add a real fetcher in the same step.

Option B - Add a real local research fetcher adapter:

- Requires a careful decision about source, access method, terms, and runtime behavior.
- Must stay disabled by default.
- Must still require env safety flags and local import acknowledgement.
- Must keep `productionApproved:false`.

## 16. Phase 31G Script Runner Decision

Phase 31G reviewed whether the local import wrapper should be wired into `package.json`.

Package audit result at the time of Phase 31G:

- `package.json` does not include `tsx`.
- `package.json` does not include `ts-node`.
- `package.json` does not include another TypeScript script runner for `scripts/*.ts`.
- Existing script workflow uses Node for `.mjs` database tooling, such as `scripts/reset-local-db.mjs`.
- Existing npm scripts do not include a comparable local import command.
- At that time, `scripts/import-vnstock-market-prices.ts` existed as a wrapper, but it was not wired to an npm script.

Decision at the time: Option B - runner does not exist.

No npm script was added in Phase 31G because the repo did not yet have a TypeScript script runner dependency. Adding a script such as `import:market-prices:vnstock:local` required a later reviewed dependency decision. Phase 31G also did not add dependencies.

Usage after Phase 31G remained:

- Use `runVnstockMarketPriceImportCommand` as a testable library boundary.
- Keep `scripts/import-vnstock-market-prices.ts` as an unwired local wrapper until runner wiring is chosen. Phase 31H later chose npm/`tsx` runner wiring.
- Do not run real Vnstock fetches by default.
- Do not expose public API, UI, cron, scheduler, or app-start import.
- Keep `productionApproved:false`.

Phase 31H later chose npm/`tsx` wiring. The follow-up requirements were:

- Add or use a clearly reviewed runner.
- Use a clear local/research script name.
- Avoid adding a real fetcher in the same step.
- Keep all env safety flags and local import acknowledgement.
- Keep the command out of build, test, dev startup, UI, API, and cron workflows.

## 17. Phase 31H Local Script Runner

Phase 31H adds explicit local script runner wiring:

- `tsx` is added as a dev-only script runner.
- `package.json` includes `import:market-prices:vnstock:local`.
- The script only helps run the local command wrapper.
- The script does not add a real Vnstock fetcher.
- Dry-run remains the default.
- `--write` remains explicit.
- Env safety flags and local import acknowledgement remain required.
- Without an injected/local fetcher, the command still fails closed with `fetcher_not_configured`.
- There is no public API, UI button, cron job, scheduler, or app-start import.
- There is no production source approval; `productionApproved:false` remains mandatory.

Bash-style dry-run example:

```bash
VNSTOCK_RESEARCH_CONNECTOR_ENABLED=true
VNSTOCK_RESEARCH_ALLOW_NETWORK=true
VNSTOCK_RESEARCH_MODE=local_research
VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31
```

Bash-style write example:

```bash
VNSTOCK_RESEARCH_CONNECTOR_ENABLED=true
VNSTOCK_RESEARCH_ALLOW_NETWORK=true
VNSTOCK_RESEARCH_MODE=local_research
VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --write
```

PowerShell dry-run example:

```powershell
$env:VNSTOCK_RESEARCH_CONNECTOR_ENABLED = "true"
$env:VNSTOCK_RESEARCH_ALLOW_NETWORK = "true"
$env:VNSTOCK_RESEARCH_MODE = "local_research"
$env:VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK = "true"
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31
```

PowerShell env cleanup:

```powershell
Remove-Item Env:VNSTOCK_RESEARCH_CONNECTOR_ENABLED
Remove-Item Env:VNSTOCK_RESEARCH_ALLOW_NETWORK
Remove-Item Env:VNSTOCK_RESEARCH_MODE
Remove-Item Env:VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK
```

## 18. Phase 31I Smoke Test Results

Phase 31I verifies the local npm script wiring with safe smoke tests:

- The npm script executes successfully and reaches the local command runner.
- Missing env/ACK fails closed with `local_import_ack_required`.
- ACK plus local research env, but no injected fetcher, fails closed with `fetcher_not_configured`.
- Missing required args fails usage validation before any fetch or persistence path.
- Dry-run remains the default; `--write` was not used in smoke tests.
- No DB write, network/Vnstock call, scrape, download, or raw output file is expected from these checks.
- No raw output, local DB, generated Prisma, or `tsconfig.tsbuildinfo` file should be committed.
- `productionApproved:false` remains mandatory.

## 19. Phase 31J Real Fetcher Feasibility Audit

Phase 31J audits future real fetcher options in `docs/product/VNSTOCK_REAL_FETCHER_FEASIBILITY_AUDIT.md`. The current npm import command still has no real fetcher configured and remains fail-closed with `fetcher_not_configured` unless a later reviewed phase explicitly adds a local fetcher path.

## 20. Phase 31K Offline Fetcher Contract

Phase 31K adds `docs/product/VNSTOCK_OFFLINE_FETCHER_CONTRACT.md` and a fake/sample fixture for future fetcher validation. The local npm import command still has no real fetcher configured and remains fail-closed without an injected/local fetcher.

## 21. Phase 31L Manual Export/Import Bridge

Phase 31L lets a user provide a local CSV or JSON file that was exported outside Atelier Finance. Atelier Finance only reads the local file, validates and normalizes it through the existing Vnstock research market price contract, and keeps dry-run as the default.

- The app does not call Vnstock.
- The app does not call network, scrape, download, or run a Python bridge.
- The command still requires env safety flags and `VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK=true`.
- If no `--file` is provided and no injected fetcher exists, the command remains fail-closed with `fetcher_not_configured`.
- CSV columns: `ticker,date,open,high,low,close,volume,tradingValue`.
- JSON input should be an array of objects matching the same raw contract.
- Missing numeric cells become `null`; invalid numeric values become `null` plus warnings.
- Records outside `--ticker` or the requested date range are skipped with warnings.
- Do not commit local CSV/JSON exports, local DB files, raw data, or generated import reports.

Header-only CSV template:

`docs/product/templates/vnstock-market-prices-template.csv`

PowerShell dry-run example:

```powershell
$env:VNSTOCK_RESEARCH_CONNECTOR_ENABLED = "true"
$env:VNSTOCK_RESEARCH_ALLOW_NETWORK = "true"
$env:VNSTOCK_RESEARCH_MODE = "local_research"
$env:VNSTOCK_RESEARCH_LOCAL_IMPORT_ACK = "true"
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --file .\path\to\fpt-market-prices.csv --format csv
```

Write example, only after reviewing dry-run output:

```bash
npm run import:market-prices:vnstock:local -- --ticker FPT --from 2025-01-01 --to 2025-01-31 --file ./path/to/fpt-market-prices.csv --format csv --write
```

## 22. Phase 31M End-To-End Local Dry-Run Verification

Phase 31M verifies the manual export/import bridge end to end with a fake CSV sample:

- Fake sample file: `docs/product/templates/vnstock-market-prices-sample.fake.csv`.
- Command ran through the npm local import script with safety env flags and local import acknowledgement.
- `--write` was not used.
- The report returned `dryRun:true` and `productionApproved:false`.
- Valid FPT rows normalized.
- Missing numeric values stayed `null`.
- Invalid numeric value `low=abc` produced a warning and normalized to `null`.
- Wrong ticker `HPG` was skipped with a warning when `--ticker FPT` was requested.
- Invalid date was rejected with a warning.
- No DB write, network/Vnstock call, scrape, download, raw output file, public trigger, or production approval was added.
- Repo hygiene stayed clean except for intentional docs/sample changes.

Before using a real user-provided CSV/JSON export, run dry-run first, review warnings/counts, and do not commit the CSV/JSON export, local DB, or generated output. Use `--write` only after the dry-run is understood and the source boundary is acceptable for local academic research.

## 23. Phase 31N First Real Manual Export Trial Guide

Phase 31N adds `docs/product/VNSTOCK_FIRST_REAL_MANUAL_EXPORT_TRIAL_GUIDE.md` for the first user-provided real CSV/JSON trial. Real export files should stay outside the repo, dry-run is required first, `--write` is not used in this phase, no DB write is performed, and `productionApproved:false` remains mandatory.

## 24. Phase 31O First Real CSV Dry-Run Review

Phase 31O records the first real user-provided CSV dry-run review in `docs/product/VNSTOCK_FIRST_REAL_CSV_DRY_RUN_REVIEW.md`.

- A real user-provided CSV outside the repo was dry-run successfully for `FPT`.
- The requested range was `2025-01-01` to `2025-01-31`.
- The command normalized `17` records and rejected `0` records.
- `--write` was not used.
- No DB write occurred.
- Out-of-range December 2024 rows were skipped correctly.
- Future `--write` requires a separate reviewed phase.

## 25. Phase 31P First Local DB Write Trial Plan

Phase 31P adds `docs/product/VNSTOCK_FIRST_LOCAL_DB_WRITE_TRIAL_PLAN.md`.

- `--write` is documented only as a future candidate command.
- Phase 31P does not run write mode.
- Phase 31P does not write DB data.
- DB reset/backup and repo hygiene checks are required before any future write phase.
- The real CSV must remain outside the repo.
- `productionApproved:false` remains mandatory.

## 26. Phase 31Q First Local DB Write Trial

Phase 31Q records the first local DB write trial in `docs/product/VNSTOCK_FIRST_LOCAL_DB_WRITE_TRIAL_REVIEW.md`.

- `--write` was executed once successfully on the reviewed `FPT` range.
- The real CSV stayed outside the repo.
- The command returned `import_completed`.
- `17` records were normalized and inserted.
- DB verification found `17` FPT `research_only` rows in range and no FPT `research_only` rows outside range.
- No public trigger, real fetcher, or production source approval was added.
- CSV and DB files were not staged or committed.

## 27. Phase 31R Market Price DB Read Path Verification

Phase 31R adds `docs/product/MARKET_PRICE_DB_READ_PATH_VERIFICATION.md` and verifies a local DB read service for manually imported market price rows.

- Use the read path/service verification before connecting imported data to UI.
- The service reads `MarketPrice` rows by ticker/date/source/data mode.
- It preserves `null` numeric values.
- It keeps `productionApproved:false` at the service output layer.
- It does not call Vnstock, fetch network data, write DB rows, or add a public trigger.

## 28. Phase 31S Technical/PVT Adapter Connection

Phase 31S adds `docs/product/MARKET_PRICE_PVT_ADAPTER_CONNECTION.md` and verifies module-ready consumption after DB read verification.

- MarketPrice DB read output can be converted into PVT adapter-ready output.
- The existing Technical/PVT builder can consume the adapter output.
- Existing UI/static data behavior is unchanged.
- The path preserves `sourceLabel:vnstock`, `dataMode:research_only`, and `productionApproved:false`.
- It does not add UI, public API, direct fetcher, DB write, or automatic import behavior.
