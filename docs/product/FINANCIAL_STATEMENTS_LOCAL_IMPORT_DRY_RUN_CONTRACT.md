# Financial Statements Local Import Dry-run Contract

Phase: 39 - Financial Statements Local Import/Dry-run Contract

Date: 2026-06-20

## 1. Goal

Phase 39 adds a local financial statement import dry-run contract.

The contract accepts already parsed object rows from manual/local input, validates them, normalizes safe fields, and returns a report that separates accepted, rejected, and skipped rows.

This phase does not import real BCTC data, does not write database rows, does not wire Financials UI runtime behavior, and does not approve any production financial data source.

## 2. Why This Follows Phase 38

Phase 38 added the local/research-only read-service and adapter foundation for financial statements.

Before any future local file or manual workflow can write canonical records, the product needs a safe dry-run boundary that can:

- preserve missing values as `null`
- reject invalid identifiers, years, periods, and numeric cells
- keep source metadata unapproved
- report duplicates without merging them
- prove that no DB write path exists in this contract

## 3. Import/Dry-run Contract

Primary module:

- `src/lib/data-sources/financial-statement-import-contract.ts`

Primary function:

- `buildFinancialStatementImportDryRun(rows, options)`

Contract guarantees:

- `dryRun:true`
- `writePlanned:false`
- `noDbWrite:true`
- `productionApproved:false`
- no Prisma import
- no database write behavior
- no external API call
- no CSV/text parser requirement in this phase

The input is an array of parsed object rows. CSV parsing and real file ingestion remain later-phase work.

Phase 40 adds a CSV/text parser dry-run bridge in `FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`. It parses CSV text into object rows and then calls this Phase 39 contract; it still does not import real BCTC data, write DB rows, approve a provider, or wire Financials UI runtime behavior.

Phase 41 adds a local file-reader dry-run wrapper in `FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`. It reads caller-provided local `.csv`/`.txt` files only after file safety checks, then calls the Phase 40 parser bridge and this Phase 39 contract; it still does not write DB rows, import real BCTC data, fetch URLs, parse Excel/PDF, approve a provider, or wire Financials UI runtime behavior.

Phase 42 adds a dry-run-only CLI runner in `FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`. It passes CLI options into the Phase 41 wrapper and ultimately into this contract; it still does not add a write flag, write DB rows, import real BCTC data, approve a provider, or wire Financials UI runtime behavior.

Phase 43 records synthetic CLI verification evidence in `FINANCIAL_STATEMENTS_CLI_DRY_RUN_VERIFICATION_EVIDENCE.md`. The evidence confirms this contract reports accepted, rejected, skipped, missing-value, and production approval attempt cases through the CLI path while preserving `productionApproved:false` and no DB write behavior.

Phase 44 adds a controlled local write trial plan in `FINANCIAL_STATEMENTS_CONTROLLED_LOCAL_WRITE_TRIAL_PLAN.md`. The plan requires this contract's dry-run output to be reviewed before any future write trial and does not add persistence behavior to this contract.

Phase 45 adds a separate controlled local write trial in `FINANCIAL_STATEMENTS_FIRST_LOCAL_DB_WRITE_TRIAL.md`. This contract still does not write DB rows; its accepted rows are the only rows eligible for the separate guarded write service.

Phase 46 records read-back evidence and cleanup policy in `FINANCIAL_STATEMENTS_READ_BACK_AND_CLEANUP_POLICY.md`. It does not change this dry-run contract.

## 4. Input Row Shape

Accepted input keys include:

- `ticker`
- `fiscalYear`
- `fiscalQuarter`
- `periodType`
- `statementDate`
- `currency`
- `revenue`
- `grossProfit`
- `operatingIncome`
- `netIncome`
- `totalAssets`
- `totalLiabilities`
- `totalEquity` or `equity`
- `currentAssets`
- `currentLiabilities`
- `cashAndEquivalents`
- `operatingCashFlow`
- `capitalExpenditure`
- `sharesOutstanding`
- `eps`
- `sourceLabel`
- `dataMode`
- `productionApproved`

The function expects these rows to be provided by a caller that has already parsed the raw file or form data.

## 5. Normalized Row Shape

Accepted rows return:

- `ticker`
- `fiscalYear`
- `fiscalQuarter`
- `periodType`
- `statementDate`
- `currency`
- `revenue`
- `grossProfit`
- `operatingIncome`
- `netIncome`
- `totalAssets`
- `totalLiabilities`
- `totalEquity`
- `currentAssets`
- `currentLiabilities`
- `cashAndEquivalents`
- `operatingCashFlow`
- `capitalExpenditure`
- `sharesOutstanding`
- `eps`
- `sourceLabel`
- `dataMode`
- `productionApproved:false`
- `missingFields`
- `warnings`
- `rowIndex`
- `sourceRowNumber`

No DB id is included because Phase 39 never persists the row.

## 6. Validation Rules

Ticker:

- required
- trimmed and uppercased
- limited to safe ticker characters
- invalid rows are rejected
- no DB lookup occurs

Fiscal year:

- required
- integer only
- accepted range: `1990` to `2100`
- invalid rows are rejected
- no year is inferred

Period:

- accepted period types: `annual`, `quarterly`, `unknown`
- `year`, `yearly`, and `fy` normalize to `annual`
- `quarter` and `q` normalize to `quarterly`
- annual rows normalize quarter to `null`
- quarterly rows require quarter `1` through `4`
- invalid quarterly rows are rejected

Numeric fields:

- empty string, `null`, and `undefined` normalize to `null`
- numeric strings normalize to numbers
- comma separators are accepted in numeric strings
- non-numeric text rejects the row
- `totalAssets`, `totalLiabilities`, and `sharesOutstanding` cannot be negative
- `netIncome`, `operatingCashFlow`, `totalEquity`, and `eps` may be negative
- no ratios are computed in this phase

Important missing fields:

- `revenue`
- `netIncome`
- `totalAssets`
- `totalEquity`
- `operatingCashFlow`

Rows can still be accepted when these fields are missing, but the report lists them in `missingFields` and row warnings.

## 7. Missing Data Policy

Missing values stay missing:

- no missing value is converted to `0`
- no unsupported field is inferred
- no denominator is interpreted
- no valuation ratio is computed

This matches the existing product rule that incomplete financial data must surface as `null`, `unavailable`, `not_available`, `not_applicable`, or `insufficient_data` depending on downstream display context.

## 8. Duplicate Row Policy

The dry-run detects duplicates inside the same input by:

`ticker + fiscalYear + periodType + fiscalQuarter`

The first accepted row wins for dry-run reporting. Later rows with the same key are placed in `skippedRows` with the duplicate key and reason. Phase 39 does not merge duplicate rows.

## 9. Source Metadata Policy

Defaults:

- `sourceLabel:user_provided_local_research`
- `dataMode:research_only`
- `productionApproved:false`

If an input row attempts to pass production approval, the accepted output remains `productionApproved:false` and the row gets a warning.

The contract does not claim official, realtime, or production financial data.

## 10. No DB Write Guarantee

Phase 39 has no write path.

The contract:

- does not import Prisma
- does not call database persistence APIs
- does not expose a write flag
- does not add an API route
- does not add a CLI runner
- does not run an import
- does not seed or reset any database

The test suite includes a guard that scans the dry-run module for database persistence wiring.

## 11. Tests And Validation Evidence

Phase 39 adds tests for:

- valid row normalization
- ticker uppercase normalization
- numeric string normalization
- missing numeric cells staying `null`
- invalid ticker and fiscal year rejection
- production approval override to false
- duplicate row skip reporting
- invalid numeric text rejection
- disallowed negative total assets and shares outstanding
- annual and quarterly period validation
- dry-run module purity and no DB write wiring
- investment action wording absence in report output

Expected validation commands:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test`

## 12. Safety Notes

Phase 39 does not:

- import real BCTC data
- write DB rows
- call external APIs
- scrape or download data
- add cron, public API, or auto sync
- wire Financials UI to this contract
- approve a production provider
- set production approval to true
- claim official/realtime/production financial data
- create investment action outputs

## 13. Limitations

- The function accepts parsed object rows only; raw CSV parsing is out of scope.
- No real financial statement file is imported.
- No persistence behavior exists.
- No source/legal review is completed for a production provider.
- Financials UI runtime is unchanged.
- Future phases still need reviewed source evidence before any write/import workflow can be promoted.
- Phase 40 adds CSV text parsing only as a dry-run bridge and keeps this contract as the validation boundary.
- Phase 41 adds local file reading only as a dry-run wrapper and keeps this contract as the validation boundary.
- Phase 42 adds CLI access only as a dry-run runner and keeps this contract as the validation boundary.
- Phase 43 records CLI verification evidence only and keeps this contract as the validation boundary.
- Phase 44 records controlled local write trial policy only and keeps this contract as the validation boundary.
- Phase 45 keeps this contract as the validation boundary before the separate guarded local write service.
- Phase 46 keeps this contract unchanged and adds read-back/cleanup evidence only.

## 14. Files Changed

- `src/lib/data-sources/financial-statement-import-contract.ts`
- `src/lib/data-sources/__tests__/financial-statement-import-contract.test.ts`
- `src/lib/data-sources/index.ts`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
