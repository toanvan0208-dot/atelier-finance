# Vnstock Local Import Usage Guide

Date: 2026-06-19

Phase: 31F - Local Import Usage Guide And Verification Checklist

This document explains how to use the local-only Vnstock research market price import command safely. It is documentation only. It does not add a real fetcher, install a dependency, change runtime code, expose an API, add a UI trigger, create a cron job, seed real data, or approve any production source.

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

`package.json` does not currently include an import npm script because the repo does not have a TypeScript script runner dependency such as `tsx` or `ts-node`. Phase 31F does not add such a dependency.

Current state:

- The repo has a script wrapper: `scripts/import-vnstock-market-prices.ts`.
- No npm command is wired for this wrapper yet.
- Do not run `npm install` just to execute this script unless a later phase explicitly chooses that tooling.
- Direct script execution depends on tooling available in a developer's local environment.
- If a later phase adds script runner wiring, it should use a clear local/research npm script name and should not add a fetcher by accident.

Conceptual dry-run usage:

```bash
node/tsx equivalent scripts/import-vnstock-market-prices.ts --ticker FPT --from 2025-01-01 --to 2025-01-31
```

Conceptual write usage:

```bash
node/tsx equivalent scripts/import-vnstock-market-prices.ts --ticker FPT --from 2025-01-01 --to 2025-01-31 --write
```

The exact command depends on the script runner chosen by the repo. Do not add a new dependency casually.

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
| Command runner unavailable | No `tsx`/`ts-node` script is configured in `package.json`; choose script runner wiring in a later phase. |
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

## 15. Next Phase Proposal

Recommended next phase: Phase 31G - Local Script Runner Wiring Or Real Fetcher Decision.

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

Package audit result:

- `package.json` does not include `tsx`.
- `package.json` does not include `ts-node`.
- `package.json` does not include another TypeScript script runner for `scripts/*.ts`.
- Existing script workflow uses Node for `.mjs` database tooling, such as `scripts/reset-local-db.mjs`.
- Existing npm scripts do not include a comparable local import command.
- `scripts/import-vnstock-market-prices.ts` exists as a wrapper, but it is not wired to an npm script.

Decision: Option B - runner does not exist.

No npm script was added because the repo does not currently have a TypeScript script runner dependency. Adding a script such as `import:market-prices:vnstock:local` would require calling a tool that is not available in the current package setup. Phase 31G also does not add dependencies.

Current usage remains:

- Use `runVnstockMarketPriceImportCommand` as a testable library boundary.
- Keep `scripts/import-vnstock-market-prices.ts` as an unwired local wrapper.
- Do not run real Vnstock fetches by default.
- Do not expose public API, UI, cron, scheduler, or app-start import.
- Keep `productionApproved:false`.

A later phase may add npm script wiring only if the repo explicitly chooses a TypeScript script runner. That phase should:

- Add or use a clearly reviewed runner.
- Use a clear local/research script name.
- Avoid adding a real fetcher in the same step.
- Keep all env safety flags and local import acknowledgement.
- Keep the command out of build, test, dev startup, UI, API, and cron workflows.
