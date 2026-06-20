# Financial Statements First Local DB Write Trial

Phase: 45 - First Controlled Financial Statement Local DB Write Trial

Date: 2026-06-20

## 1. Goal

Phase 45 implements and verifies the first controlled local financial statement DB write trial.

This phase writes only synthetic accepted dry-run rows to a local SQLite/dev database under explicit confirmation flags. It does not import real BCTC data, call external APIs, scrape/download data, add a public upload API, parse Excel/PDF, approve a production provider, or wire Financials UI runtime behavior.

## 2. Why This Follows Phase 44

Phase 44 defined the write-trial policy:

- dry-run first
- local DB safety gate
- explicit confirmations
- accepted rows only
- insert-only duplicate protection
- local/research-only metadata
- no raw CSV/JSON/DB artifacts committed

Phase 45 implements that controlled path as a separate CLI command so `financials:dry-run` remains dry-run-only.

## 3. Write Scope

Allowed in this phase:

- synthetic CSV outside the repo
- local SQLite/dev DB only
- `dataMode:research_only`
- `sourceLabel:phase45_synthetic_financial_statement_local_write`
- dry-run accepted rows only
- insert-only behavior
- duplicate existing rows skipped
- missing values preserved as `null`

Not allowed in this phase:

- real BCTC import
- production/official/realtime data claim
- production-approved source claim
- rejected row write
- skipped row write
- DB reset/seed
- raw CSV commit
- JSON/report output commit
- public API/upload API
- Financials UI runtime change

## 4. Implementation Summary

Phase 45 adds:

- `financials:write-trial` npm script
- `scripts/financial-statements-write-trial.ts`
- local DB safety guard
- controlled local write service
- tests for guard, service, and CLI

The write-trial CLI runs the Phase 41/40/39 dry-run chain first and then writes only `acceptedRows` when all confirmations and DB safety checks pass.

## 5. Required Confirmation Flags

Command flags used:

- `--confirm-local-research-only`
- `--confirm-no-production-source`
- `--confirm-reviewed-dry-run`
- `--confirm-no-production-database`
- `--source-label phase45_synthetic_financial_statement_local_write`
- `--data-mode research_only`

Missing confirmations reject the run before write.

## 6. Local DB Safety Gate

The guard accepts only local SQLite/dev `file:` URLs and rejects:

- missing `DATABASE_URL`
- PostgreSQL URLs
- MySQL URLs
- SQL Server URLs
- non-`file:` URLs
- production-like database wording

Write trial command used:

- `DATABASE_URL=file:./dev.db`
- guard result: `databaseGuardAccepted:true`
- database mode: `local_sqlite_dev`

## 7. Synthetic Dry-run Command

Synthetic CSV:

- stored temporarily in OS temp folder
- deleted after verification
- not committed
- not copied into docs

Dry-run command:

```bash
npm run --silent financials:dry-run -- --file <temp-csv-path> --source-label phase45_synthetic_financial_statement_local_write --data-mode research_only
```

Observed dry-run summary:

- `status:completed_with_rejections`
- `dryRun:true`
- `writePlanned:false`
- `noDbWrite:true`
- `productionApproved:false`
- `acceptedCount:3`
- `rejectedCount:1`
- `skippedCount:1`
- `warningsCount:3`
- `errorsCount:2`
- `sourceLabel:phase45_synthetic_financial_statement_local_write`
- `dataMode:research_only`

## 8. Write Trial Command

Command:

```bash
npm run --silent financials:write-trial -- --file <temp-csv-path> --source-label phase45_synthetic_financial_statement_local_write --data-mode research_only --confirm-local-research-only --confirm-no-production-source --confirm-reviewed-dry-run --confirm-no-production-database
```

Environment:

- `DATABASE_URL=file:./dev.db`

Observed write summary:

- `dryRunStatus:completed_with_rejections`
- `dryRunAcceptedCount:3`
- `dryRunRejectedCount:1`
- `dryRunSkippedCount:1`
- `writeStatus:write_completed`
- `writeExecuted:true`
- `insertedCount:3`
- `updatedCount:0`
- `skippedExistingCount:0`
- `writeRejectedCount:0`
- `productionApproved:false`
- `databaseGuardAccepted:true`
- `databaseMode:local_sqlite_dev`
- `rejectedRowsWritten:false`
- `skippedRowsWritten:false`

## 9. DB Verification

Read-only DB verification by `sourceLabel` and `dataMode` confirmed:

- row count: `3`
- tickers: `FPT`, `MWG`, `VCB`
- FPT 2024 annual count: `1`
- blank ticker count: `0`
- MWG `revenue:null`
- MWG `operatingCashFlow:null`
- all rows `dataMode:research_only`
- source usage status: `research_only`
- source type: `user_input`

Interpretation:

- rejected row was not written
- duplicate FPT row was not written twice
- missing numeric values stayed `null`
- source remained local/user-provided research metadata
- no production source was approved

## 10. Safety Notes

Phase 45 did not:

- commit `dev.db`
- commit synthetic CSV
- commit JSON/report output
- import real BCTC data
- call external APIs
- scrape or download data
- reset or seed DB
- add public upload/API behavior
- change Financials UI runtime behavior
- approve a production provider
- claim official/realtime/production financial data
- create investment action outputs

## 11. Limitations

- Synthetic local research data only.
- The local DB write evidence is for controlled development verification only.
- No real financial statement source was reviewed or approved.
- No Excel/PDF parser was added.
- No Financials UI runtime path was changed.
- No production database or production data provider is involved.

## 12. Files Changed

- `src/lib/data-sources/financial-statement-local-write-guard.ts`
- `src/lib/data-sources/financial-statement-local-write-service.ts`
- `src/lib/data-sources/__tests__/financial-statement-local-write-guard.test.ts`
- `src/lib/data-sources/__tests__/financial-statement-local-write-service.test.ts`
- `src/lib/data-sources/__tests__/financial-statements-write-trial-cli.test.ts`
- `scripts/financial-statements-write-trial.ts`
- `package.json`
- `src/lib/data-sources/index.ts`
- `docs/product/FINANCIAL_STATEMENTS_FIRST_LOCAL_DB_WRITE_TRIAL.md`
- `docs/product/FINANCIAL_STATEMENTS_CONTROLLED_LOCAL_WRITE_TRIAL_PLAN.md`
- `docs/product/FINANCIAL_STATEMENTS_CLI_DRY_RUN_VERIFICATION_EVIDENCE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 13. Validation Evidence

Targeted validation passed:

- `npm test -- --run src/lib/data-sources/__tests__/financial-statement-local-write-guard.test.ts src/lib/data-sources/__tests__/financial-statement-local-write-service.test.ts src/lib/data-sources/__tests__/financial-statements-write-trial-cli.test.ts` (`3` files / `12` tests)

Final validation commands passed for this phase:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test` (`60` files / `426` tests)
