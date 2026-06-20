# Financial Statements Local File Reader Dry-run Wrapper

Phase: 41 - Financial Statements Local File Reader Dry-run Wrapper

Date: 2026-06-20

## 1. Goal

Phase 41 adds a local file-reader wrapper for financial statement CSV dry-runs.

The wrapper validates a caller-provided local file path, checks basic file constraints, reads UTF-8 text, passes the text into the Phase 40 CSV parser bridge, and returns a combined dry-run report.

This phase does not import real BCTC data, write DB rows, add a public upload API, wire Financials UI runtime behavior, or approve any production data source.

## 2. Why This Follows Phase 40

Phase 40 accepts CSV text and converts it into Phase 39 dry-run rows.

Phase 41 adds only the local file-reading boundary:

`local file path -> UTF-8 CSV text -> Phase 40 CSV parser bridge -> Phase 39 dry-run contract`

The wrapper does not duplicate CSV parsing or financial statement validation logic.

## 3. Local File Reader Dry-run Scope

Primary module:

- `src/lib/data-sources/financial-statement-local-file-dry-run.ts`

Primary function:

- `buildFinancialStatementLocalFileDryRun(input)`

Supported input options:

- `filePath`
- `sourceLabel`
- `dataMode`
- `defaultCurrency`
- `delimiter`
- `maxRows`
- `maxBytes`
- `allowedExtensions`
- `fileName`
- `strictHeaders`
- `baseDir`

The wrapper is intended for Node/server-side local research workflows only.

Phase 42 adds a dry-run-only CLI runner in `FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`. The CLI passes local file options into this wrapper and prints a safe summary or JSON report; it still does not write DB rows, add a write flag, add a public upload API, import real BCTC data, or wire Financials UI runtime behavior.

Phase 43 records synthetic CLI verification evidence in `FINANCIAL_STATEMENTS_CLI_DRY_RUN_VERIFICATION_EVIDENCE.md`. The evidence confirms this wrapper can be reached through the CLI dry-run path while preserving `dryRun:true`, `writePlanned:false`, `noDbWrite:true`, and `productionApproved:false`.

## 4. File Safety Rules

Path handling:

- `filePath` is required.
- The wrapper does not scan folders.
- The wrapper does not auto-discover files.
- `http://` and `https://` URLs are rejected.
- If `baseDir` is provided, resolved paths outside `baseDir` are rejected.

Extension handling:

- Default allowed extensions are `.csv` and `.txt`.
- `.xlsx`, `.xls`, and `.pdf` are rejected with an unsupported-file-type message.
- Excel/PDF parsing is not supported in this phase.

File size handling:

- Default `maxBytes` is `1MB`.
- File size is checked with `stat` before reading.
- Files above `maxBytes` are rejected before parsing.

Read behavior:

- UTF-8 text read only.
- Read/stat errors are returned in report errors.
- Errors are handled without uncaught exceptions.
- No file writes occur.

## 5. Flow

The Phase 41 flow is:

1. Validate local `filePath`.
2. Reject remote URLs and unsupported extensions.
3. Check file metadata and size.
4. Read UTF-8 text.
5. Call `buildFinancialStatementCsvDryRun()`.
6. Return top-level file metadata plus nested Phase 40/Phase 39 dry-run reports.

## 6. Source Metadata Policy

Defaults:

- `sourceLabel:user_provided_local_file`
- `dataMode:research_only`
- `productionApproved:false`

The wrapper does not claim official, realtime, production, or provider-approved financial data.

## 7. Missing Data Policy

Missing cells remain missing through the chain:

- Phase 41 reads text only.
- Phase 40 preserves empty cells for parsing.
- Phase 39 normalizes missing numeric values to `null`.

No missing value is replaced with `0`, inferred, scaled, or backfilled.

## 8. Error Handling

Failure reports keep:

- `dryRun:true`
- `writePlanned:false`
- `noDbWrite:true`
- `productionApproved:false`
- file metadata where available
- `csvDryRun:null` when parsing is not reached

Representative errors:

- `file_path_required`
- `remote_url_rejected`
- `unsupported_file_type`
- `outside_base_dir`
- `file_stat_failed`
- `file_read_failed`
- `file_too_large`
- `not_a_file`

## 9. Tests And Validation Evidence

Phase 41 adds tests for:

- reading a valid local CSV temp file
- missing numeric cells staying `null`
- unsupported `.xlsx` and `.pdf` rejection
- remote URL rejection
- file-size rejection before parsing
- missing-file handling
- empty and header-only file handling
- `baseDir` path traversal rejection
- production approval attempts blocked from output
- no DB persistence wiring
- wording safety

Expected validation commands:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test`

## 10. Safety Notes

Phase 41 does not:

- commit raw CSV files
- import real BCTC data
- write DB rows
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

## 11. Limitations

- Local `.csv`/`.txt` UTF-8 input only.
- No Excel/PDF parser is included.
- No public upload/API route is included.
- No real financial statement file is imported.
- No persistence behavior exists.
- No source/legal review is completed for a production provider.
- Financials UI runtime is unchanged.
- Phase 42 adds a dry-run CLI runner only. It does not add a write flag, output report files by default, public upload APIs, DB writes, or UI runtime behavior.
- Phase 43 records CLI verification evidence only. It does not add persistence, a write flag, a public upload API, real BCTC import, or Financials UI runtime behavior.

## 12. Files Changed

- `src/lib/data-sources/financial-statement-local-file-dry-run.ts`
- `src/lib/data-sources/__tests__/financial-statement-local-file-dry-run.test.ts`
- `src/lib/data-sources/index.ts`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
