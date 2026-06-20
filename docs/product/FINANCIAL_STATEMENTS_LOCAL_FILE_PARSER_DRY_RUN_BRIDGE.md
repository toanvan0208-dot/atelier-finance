# Financial Statements Local File Parser Dry-run Bridge

Phase: 40 - Financial Statement Local File Parser Dry-run Bridge

Date: 2026-06-20

## 1. Goal

Phase 40 adds a local CSV/text parser bridge for financial statement dry-runs.

The bridge parses CSV text into object rows, maps supported headers into the Phase 39 import contract shape, calls `buildFinancialStatementImportDryRun()`, and returns a combined parse plus dry-run report.

This phase does not import real BCTC data, write DB rows, read files from disk, wire Financials UI runtime behavior, or approve any production data source.

## 2. Why This Follows Phase 39

Phase 39 created the dry-run validation and normalization contract for parsed object rows.

Phase 40 keeps that contract as the single validation boundary and only adds a parser layer:

`CSV text -> parsed object rows -> Phase 39 dry-run report`

The parser does not duplicate financial statement validation rules. Ticker, fiscal year, period, numeric normalization, duplicate handling, missing-field reporting, and production approval blocking remain owned by the Phase 39 contract.

## 3. CSV/Text Parser Bridge Scope

Primary module:

- `src/lib/data-sources/financial-statement-file-parser.ts`

Primary function:

- `buildFinancialStatementCsvDryRun(csvText, options)`

Supported options:

- `sourceLabel`
- `dataMode`
- `defaultCurrency`
- `delimiter`
- `maxRows`
- `fileName`
- `strictHeaders`

The bridge accepts CSV text only. It does not read local files, parse Excel/PDF, fetch URLs, or persist anything.

Phase 41 adds a local file-reader dry-run wrapper in `FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`. It validates a caller-provided local `.csv`/`.txt` path, reads UTF-8 text, and then calls this Phase 40 parser bridge; it still does not write DB rows, import real BCTC data, fetch URLs, parse Excel/PDF, or wire Financials UI runtime behavior.

Phase 42 adds a dry-run-only CLI runner in `FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`. It uses the Phase 41 wrapper and this parser bridge through the existing dry-run chain; it still does not add a write flag, write DB rows, import real BCTC data, fetch URLs, parse Excel/PDF, or wire Financials UI runtime behavior.

Phase 43 records synthetic CLI verification evidence in `FINANCIAL_STATEMENTS_CLI_DRY_RUN_VERIFICATION_EVIDENCE.md`. The evidence confirms the parser bridge participates in the CLI dry-run path for accepted, rejected, skipped, missing-value, and production approval attempt cases without committing raw CSV or JSON artifacts.

Phase 44 adds a controlled local write trial plan in `FINANCIAL_STATEMENTS_CONTROLLED_LOCAL_WRITE_TRIAL_PLAN.md`. The plan keeps this parser bridge as part of the required dry-run prerequisite and does not add persistence behavior.

Phase 45 adds a separate controlled local write trial in `FINANCIAL_STATEMENTS_FIRST_LOCAL_DB_WRITE_TRIAL.md`. The parser bridge remains dry-run parsing/validation input and does not write DB rows directly.

## 4. Supported Headers

Exact case-insensitive headers supported:

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
- `productionApproved`

## 5. Header Alias Policy

Supported aliases include:

- `symbol` -> `ticker`
- `year` -> `fiscalYear`
- `quarter` -> `fiscalQuarter`
- `period` -> `periodType`
- `reportDate` -> `statementDate`
- `assets` -> `totalAssets`
- `liabilities` -> `totalLiabilities`
- `equity` -> `totalEquity`
- `cash` -> `cashAndEquivalents`
- `cfo` -> `operatingCashFlow`
- `capex` -> `capitalExpenditure`

Headers are normalized by lowercasing and removing non-alphanumeric characters before matching. Ambiguous or unknown headers are not guessed.

## 6. Missing Data Policy

The parser keeps empty cells as empty strings and passes them to the Phase 39 dry-run contract.

Phase 39 then normalizes missing numeric cells to `null`. Missing data is not replaced with `0`, inferred, scaled, or filled.

## 7. Numeric String Policy

The parser does not perform financial numeric interpretation.

It preserves cell text such as:

- `1000`
- `"1,234"`
- empty cell
- non-numeric text

The Phase 39 contract handles safe numeric normalization. Quoted comma numeric values can normalize to numbers because Phase 39 supports comma separators. Non-numeric text remains invalid and is reported by the dry-run contract.

No unit scaling is performed.

## 8. Unknown Header Behavior

Unknown headers:

- do not crash parsing
- are listed in `unknownHeaders`
- add `parseWarnings`
- are ignored when building dry-run rows

If `strictHeaders` is true, unknown headers make parsing fail before import dry-run validation.

## 9. Required Header Behavior

The parser warns when `ticker` or `fiscalYear` are missing from headers.

It still builds rows from known columns and lets the Phase 39 contract reject rows that lack required ticker/year data.

## 10. Dry-run Integration With Phase 39

The combined report includes:

- top-level `status`
- `parseStatus`
- `dryRun:true`
- `writePlanned:false`
- `noDbWrite:true`
- `productionApproved:false`
- `parseWarnings`
- `parseErrors`
- `detectedHeaders`
- `unknownHeaders`
- `rowCount`
- `parse`
- `importDryRun`

The nested `importDryRun` is exactly the Phase 39 dry-run report for parsed rows.

## 11. No DB Write Guarantee

Phase 40 has no DB write path.

The parser bridge:

- does not import Prisma
- does not call persistence APIs
- does not read local files
- does not expose a write flag
- does not add API routes
- does not add CLI import commands
- does not seed or reset the database

## 12. Tests And Validation Evidence

Phase 40 adds tests for:

- valid CSV parsing into dry-run accepted rows
- missing numeric cells staying `null`
- quoted comma numeric values
- unknown header warnings
- missing required header warnings plus dry-run rejection
- duplicate rows reported through Phase 39
- production approval attempts from CSV blocked from output
- quoted delimiter text in mapped cells
- malformed quote parse failure
- wording safety

Expected validation commands:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test`

## 13. Safety Notes

Phase 40 does not:

- commit raw CSV files
- import real BCTC data
- write DB rows
- call external APIs
- scrape or download data
- parse Excel/PDF
- wire Financials UI runtime
- approve a production provider
- claim official/realtime/production financial data
- create investment action outputs

## 14. Limitations

- CSV text input only.
- No file-system reader is included.
- No Excel/PDF parser is included.
- No real financial statement file is imported.
- No persistence behavior exists.
- No source/legal review is completed for a production provider.
- Financials UI runtime is unchanged.
- Phase 41 adds local file reading only as a dry-run wrapper and keeps this parser bridge plus the Phase 39 contract as the parsing/validation boundary.
- Phase 42 adds CLI access only as a dry-run runner and keeps this parser bridge plus the Phase 39 contract as the parsing/validation boundary.
- Phase 43 records CLI verification evidence only and keeps this parser bridge plus the Phase 39 contract as the parsing/validation boundary.
- Phase 44 records controlled local write trial policy only and keeps this parser bridge plus the Phase 39 contract as the parsing/validation boundary.
- Phase 45 keeps this parser bridge as the dry-run parsing boundary before a separate guarded write service consumes accepted rows.

## 15. Files Changed

- `src/lib/data-sources/financial-statement-file-parser.ts`
- `src/lib/data-sources/__tests__/financial-statement-file-parser.test.ts`
- `src/lib/data-sources/financial-statement-import-contract.ts`
- `src/lib/data-sources/__tests__/financial-statement-import-contract.test.ts`
- `src/lib/data-sources/index.ts`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
