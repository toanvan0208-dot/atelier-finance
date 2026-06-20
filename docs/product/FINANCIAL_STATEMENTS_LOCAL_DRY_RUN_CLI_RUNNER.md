# Financial Statements Local Dry-run CLI Runner

Phase: 42 - Financial Statements Local Dry-run CLI Runner

Date: 2026-06-20

## 1. Goal

Phase 42 adds a terminal runner for local financial statement dry-runs.

The CLI accepts a caller-provided local CSV/TXT path, passes CLI options into the Phase 41 local file dry-run wrapper, prints either a safe summary or JSON report, and returns clear exit codes.

This phase does not import real BCTC data, write DB rows, add a public upload API, wire Financials UI runtime behavior, or approve any production data source.

## 2. Why This Follows Phase 41

Phase 41 added the local file-reader wrapper.

Phase 42 adds only the command-line boundary:

`npm script -> CLI args -> Phase 41 local file wrapper -> Phase 40 CSV parser bridge -> Phase 39 dry-run contract`

The CLI does not duplicate file validation, CSV parsing, or financial statement validation logic.

## 3. CLI Scope

Primary script:

- `scripts/financial-statements-dry-run.ts`

NPM script:

- `financials:dry-run`

Example:

```bash
npm run financials:dry-run -- --file ./local/financials.csv
```

JSON output:

```bash
npm run financials:dry-run -- --file ./local/financials.csv --json
```

The CLI is dry-run-only. It has no write mode.

## 4. Supported Options

Required:

- `--file <path>`

Optional:

- `--base-dir <path>`
- `--max-bytes <number>`
- `--source-label <string>`
- `--data-mode <string>`
- `--delimiter <char>`
- `--json`
- `--help`

Rejected write-like flags:

- `--write`
- `--commit`
- `--db`
- `--seed`

These flags fail with `write_not_supported` and do not call the local file dry-run wrapper.

## 5. Exit Code Policy

Exit code `0`:

- `completed`
- `completed_with_rejections`
- `failed` dry-run validation reports that successfully reached the dry-run contract

Exit code non-zero:

- missing `--file`
- unsupported option
- write-like flag
- `file_validation_failed`
- `file_read_failed`
- `parse_failed`

Rejected rows are treated as dry-run validation evidence, not infrastructure failure, as long as the file was read and parsed enough to reach the dry-run chain.

## 6. Output Summary Fields

Default output includes:

- `status`
- `dryRun`
- `writePlanned`
- `noDbWrite`
- `productionApproved`
- `fileName`
- `sizeBytes`
- `acceptedCount`
- `rejectedCount`
- `skippedCount`
- `warningsCount`
- `errorsCount`
- `sourceLabel`
- `dataMode`

The default summary does not print raw CSV content.

With `--json`, the CLI prints the sanitized report returned by the Phase 41 wrapper.

## 7. No DB Write Guarantee

Phase 42 has no DB write path.

The CLI:

- does not import Prisma
- does not call persistence APIs
- does not expose `--write`
- does not add API routes
- does not write output report files by default
- does not scan folders
- does not auto-discover files
- does not fetch URLs

## 8. Source Metadata Policy

The CLI passes local file dry-run metadata through the Phase 41/40/39 chain.

Defaults remain:

- `sourceLabel:user_provided_local_file`
- `dataMode:research_only`
- `productionApproved:false`

The CLI does not claim official, realtime, production, or provider-approved financial data.

## 9. Missing Data Policy

The CLI does not alter financial statement cells.

Missing cells remain missing through the chain:

- Phase 41 reads UTF-8 text.
- Phase 40 preserves empty cells for parsing.
- Phase 39 normalizes missing numeric values to `null`.

No missing value is replaced with `0`, inferred, scaled, or backfilled.

## 10. Tests And Validation Evidence

Phase 42 adds tests for:

- missing `--file` usage failure
- `--help` usage success
- valid option mapping into the Phase 41 wrapper
- write-like flag rejection
- safe summary output without raw CSV
- `--json` parseable report output
- `completed_with_rejections` exit code policy
- fatal file/parse failure exit code policy
- wording safety

Expected validation commands:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test`

## 11. Safety Notes

Phase 42 does not:

- add a write flag
- commit raw CSV files
- import real BCTC data
- write DB rows
- import Prisma in the CLI
- call external APIs
- fetch URLs
- scrape or download data
- parse Excel/PDF
- add a public upload API
- add cron, public runtime trigger, or auto sync
- wire Financials UI runtime
- approve a production provider
- claim official/realtime/production financial data
- create investment action outputs

## 12. Limitations

- CLI dry-run only.
- Local file behavior remains owned by Phase 41.
- CSV text parsing remains owned by Phase 40.
- Financial statement validation remains owned by Phase 39.
- No Excel/PDF parser is included.
- No public upload/API route is included.
- No real financial statement file is imported.
- No persistence behavior exists.
- Financials UI runtime is unchanged.

## 13. Files Changed

- `scripts/financial-statements-dry-run.ts`
- `src/lib/data-sources/__tests__/financial-statements-dry-run-cli.test.ts`
- `package.json`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
