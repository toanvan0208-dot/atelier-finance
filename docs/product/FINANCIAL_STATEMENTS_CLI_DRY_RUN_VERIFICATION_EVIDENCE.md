# Financial Statements CLI Dry-run Verification Evidence

Phase: 43 - Financial Statements CLI Dry-run Verification Evidence

Date: 2026-06-20

## 1. Goal

Phase 43 records evidence that the Phase 42 financial statements CLI can run the Phase 41/40/39 dry-run chain against a synthetic local CSV file.

This is an evidence phase only. It does not add product behavior, import real BCTC data, write DB rows, add a write flag, approve any source, add a public upload API, or wire Financials UI runtime behavior.

## 2. Why This Follows Phase 42

Phase 42 added:

- `npm run financials:dry-run -- --file <path>`
- safe summary output
- sanitized JSON output
- rejection for write-like flags
- no DB write path

Phase 43 verifies that CLI boundary with a temporary synthetic file outside the repo and records only summarized evidence.

## 3. Synthetic Verification Setup

Temporary file:

- OS temp folder
- file name: `atelier-finance-phase-43-financials-synthetic.csv`
- deleted after verification

The CSV was synthetic and intentionally small. It was not committed, staged, copied into docs, or saved as a generated report.

Synthetic row coverage:

- accepted row for `FPT`, fiscal year `2024`, annual period, complete core numeric values
- accepted row for `MWG`, fiscal year `2024`, annual period, with missing `revenue` and `operatingCashFlow`
- duplicate `FPT` fiscal year `2024` annual-equivalent row, expected to be skipped
- rejected row with missing ticker and invalid fiscal year
- accepted `VCB` row with a `productionApproved` attempt, expected to remain `productionApproved:false` with warning evidence

No real financial statement data was used.

## 4. Commands Run

Summary dry-run:

```bash
npm run --silent financials:dry-run -- --file <temp-csv-path> --source-label phase43_synthetic_local_file --data-mode research_only
```

JSON dry-run:

```bash
npm run --silent financials:dry-run -- --file <temp-csv-path> --source-label phase43_synthetic_local_file --data-mode research_only --json
```

Negative write-flag check:

```bash
npm run --silent financials:dry-run -- --file <temp-csv-path> --write
```

## 5. Observed Summary Evidence

The summary dry-run completed and printed:

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
- `sourceLabel:phase43_synthetic_local_file`
- `dataMode:research_only`

Evidence interpretation:

- the local file was read by the CLI wrapper
- missing values were reported through the dry-run chain and not filled with `0`
- the duplicate row was reported as skipped
- the invalid row was reported as rejected
- the production approval attempt did not produce approved output
- the CLI remained dry-run-only

## 6. JSON Evidence

The JSON command returned a parseable sanitized payload.

Selected JSON fields confirmed:

- top-level `status:completed_with_rejections`
- top-level `dryRun:true`
- top-level `writePlanned:false`
- top-level `noDbWrite:true`
- top-level `productionApproved:false`
- nested import dry-run `acceptedCount:3`
- nested import dry-run `rejectedCount:1`
- nested import dry-run `skippedCount:1`
- nested import dry-run `dataMode:research_only`

The JSON output was not committed or saved as an artifact.

## 7. Negative Write-Flag Evidence

The `--write` command failed with exit code `1`.

Observed result:

- `write_not_supported`
- usage text was printed
- no write mode was enabled
- the write-like flag was rejected before any DB write path could exist

## 8. Safety Observations

Phase 43 verification did not:

- commit raw CSV
- commit generated JSON output
- write DB rows
- run a real BCTC import
- call external APIs
- scrape or download data
- approve production data
- mark local/research-only data as production-approved
- add public API or upload behavior
- wire Financials UI runtime behavior
- create investment action outputs

## 9. Limitations

- Synthetic data only.
- No real BCTC file was imported.
- No source/legal review was completed for a production financial data provider.
- No DB write was attempted or added.
- No Excel/PDF parsing was added.
- No public upload/API route was added.
- No Financials UI runtime path was changed.
- This evidence does not promote local/research-only data to production use.

## 10. Files Changed

- `docs/product/FINANCIAL_STATEMENTS_CLI_DRY_RUN_VERIFICATION_EVIDENCE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 11. Validation Evidence

Final validation commands passed for this phase:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test` (`57` files / `414` tests)
