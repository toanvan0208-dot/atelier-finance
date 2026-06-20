# Financial Statements Local Data Foundation

Phase: 38 - Financial Statements Local Data Foundation

Date: 2026-06-20

## 1. Goal

Phase 38 starts a safe local/research-only foundation for financial statement data.

The goal is to let the repo read and normalize local financial statement records in the future without claiming that any dataset is official, realtime, production-approved, or complete.

This phase does not wire a full Financials UI runtime path and does not import real financial statement data.

Phase 39 extends this foundation with a local import dry-run contract in `FINANCIAL_STATEMENTS_LOCAL_IMPORT_DRY_RUN_CONTRACT.md`. That later phase validates and normalizes parsed object rows for review only; it still does not import real BCTC data, write DB rows, approve a provider, or change UI behavior.

Phase 40 adds a CSV/text parser dry-run bridge in `FINANCIAL_STATEMENTS_LOCAL_FILE_PARSER_DRY_RUN_BRIDGE.md`. It converts CSV text into Phase 39 dry-run rows only; it still does not import real BCTC data, write DB rows, approve a provider, or change UI behavior.

Phase 41 adds a local file-reader dry-run wrapper in `FINANCIAL_STATEMENTS_LOCAL_FILE_READER_DRY_RUN_WRAPPER.md`. It validates local `.csv`/`.txt` paths, reads UTF-8 text, and then calls the Phase 40/39 dry-run chain; it still does not import real BCTC data, write DB rows, approve a provider, parse Excel/PDF, fetch URLs, or change UI behavior.

Phase 42 adds a dry-run-only CLI runner in `FINANCIAL_STATEMENTS_LOCAL_DRY_RUN_CLI_RUNNER.md`. It accepts local file options from terminal and calls the Phase 41/40/39 dry-run chain; it still does not import real BCTC data, write DB rows, add a write flag, approve a provider, parse Excel/PDF, fetch URLs, or change UI behavior.

Phase 43 records synthetic CLI verification evidence in `FINANCIAL_STATEMENTS_CLI_DRY_RUN_VERIFICATION_EVIDENCE.md`. It verifies the terminal dry-run path with a temporary synthetic CSV outside the repo; it still does not import real BCTC data, write DB rows, commit raw CSV/JSON artifacts, approve a provider, parse Excel/PDF, fetch URLs, or change UI behavior.

Phase 44 adds a controlled local write trial plan in `FINANCIAL_STATEMENTS_CONTROLLED_LOCAL_WRITE_TRIAL_PLAN.md`. It defines future write eligibility, confirmations, verification, and recovery policy only; it still does not import real BCTC data, write DB rows, approve a provider, parse Excel/PDF, fetch URLs, or change UI behavior.

Phase 45 adds the first controlled local DB write trial in `FINANCIAL_STATEMENTS_FIRST_LOCAL_DB_WRITE_TRIAL.md`. It writes synthetic accepted dry-run rows only to a local SQLite/dev DB with `productionApproved:false`; it still does not import real BCTC data, approve a provider, parse Excel/PDF, fetch URLs, or change UI behavior.

Phase 46 records read-back evidence and cleanup policy in `FINANCIAL_STATEMENTS_READ_BACK_AND_CLEANUP_POLICY.md`. It verifies the Phase 45 synthetic rows through the local read service and adapter while keeping UI runtime unchanged.

Phase 47 adds a Financials DB-backed runtime boundary in `FINANCIALS_DB_BACKED_RUNTIME_BOUNDARY.md`. It keeps default behavior on sample/static fallback and requires explicit `preferDb` or `ATELIER_FINANCIALS_DB_SOURCE=enabled` for local DB reads.

Phase 48 wires that runtime boundary into the Financials UI in `FINANCIALS_UI_RUNTIME_WIRING_BOUNDARY.md`. The UI receives serialized runtime data from the server boundary, displays source transparency, and keeps DB-backed rendering default-off.

## 2. Why This Follows Technical/PVT DB-backed Work

Technical/PVT now has a local DB-backed market-price path with explicit source boundaries:

- market price source transparency
- issuer metadata boundary
- derived metrics boundary
- chart series boundary
- `productionApproved:false`

Financial statements need the same discipline before any local/research data can be used safely.

## 3. What Was Added

Phase 38 adds:

- `src/lib/data-sources/financial-statement-read-service.ts`
- `src/features/financials/lib/adapt-financial-statement-records.ts`
- tests for read-service and adapter behavior
- source/data boundary documentation

The existing Prisma `FinancialStatement` model was reused. No schema change or migration was needed.

## 4. Data Contract

The read service returns records with three explicit layers.

Source metadata:

- `sourceLabel`
- `dataMode`
- `productionApproved:false`
- `importedAt`
- `asOf`
- `fiscalPeriod`
- `ticker`
- `statementType`
- `currency`
- `periodType`
- limitations
- warnings

Normalized values:

- `revenue`
- `grossProfit`
- `operatingIncome`
- `netIncome`
- `totalAssets`
- `totalLiabilities`
- `totalEquity`
- `cashAndEquivalents`
- `currentAssets`
- `currentLiabilities`
- `operatingCashFlow`
- `capitalExpenditure`
- `sharesOutstanding`
- `eps`

Values not represented by the current DB model or source row remain `null`; they are not inferred or filled with `0`.

Data quality:

- `missingFields`
- `availableFields`
- `invalidFields`
- warnings
- status: `available`, `partial`, `insufficient_data`, or `unavailable`

## 5. Source Boundary

Financial statement local data is treated as:

- local/research-only
- not official product data
- not realtime data
- not production-approved data
- `productionApproved:false`

The read service does not approve any source and does not override legal/source-evidence requirements.

## 6. Missing Data Policy

Phase 38 preserves missing values as `null`.

It does not:

- replace missing values with `0`
- infer unsupported statement lines
- divide by zero
- treat EPS `<= 0` as a normal P/E input
- treat equity `<= 0` as a normal ROE/P/B/BVPS input

The adapter does not compute ratios. Ratio safety remains handled by financial logic when downstream modules consume the snapshot.

## 7. Read Service Behavior

`getFinancialStatementSeries()`:

- validates ticker input before DB access
- returns `invalid_input` without querying DB for empty ticker
- reads local `FinancialStatement` rows by ticker/source/data mode
- preserves numeric fields and `null` fields
- returns `unavailable` with empty records when no rows exist
- keeps `productionApproved:false`
- does not fallback to sample financials
- does not call external APIs
- does not write DB rows

## 8. Adapter Behavior

`adaptFinancialStatementSeries()`:

- maps local records into `FinancialsStatementSnapshot`
- preserves `null` values
- maps previous record values when available
- keeps metadata source/data mode and `productionApproved:false`
- keeps `fallbackUsed:false`
- returns empty/unavailable output instead of falling back to sample financials
- does not compute ratios
- does not interpret negative EPS or non-positive equity as normal valuation inputs

## 9. Tests And Validation Evidence

Phase 38 adds tests for:

- financial statement read service source metadata
- invalid ticker avoiding DB reads
- empty DB result returning unavailable/empty safely
- missing values staying `null`
- non-positive equity warning
- adapter preserving null values and source metadata
- adapter avoiding sample fallback
- prohibited recommendation/trading-signal wording absence

Targeted validation run:

- `npx tsc --noEmit`
- `npm test -- --run src/lib/data-sources/__tests__/financial-statement-read-service.test.ts src/features/financials/lib/__tests__/adapt-financial-statement-records.test.ts`

Full validation passed:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test` (`53` files / `373` tests)

## 10. Safety Notes

Phase 38 did not:

- call external APIs
- scrape or download data
- import real financial statements
- write DB rows
- add cron, public API, or auto sync
- reset or seed the DB
- add a destructive migration
- set `productionApproved:true`
- claim official/realtime/production financial data
- wire Financials UI as if real statement data exists
- create investment recommendations or trading signals

## 11. Limitations

- No real BCTC/financial statement file was imported.
- No production financial statement data provider was approved.
- No browser verification was run because no UI behavior was intentionally changed.
- Current Prisma model does not include every normalized field in the Phase 38 contract; unsupported fields remain `null`.
- Full UI runtime wiring can be handled in a later phase after source/file evidence is explicit.
- Phase 39 adds a dry-run validation/normalization contract only. It does not add persistence or a real file import workflow.
- Phase 40 adds a CSV/text parser dry-run bridge only. It does not add persistence, file-system reading, Excel/PDF parsing, or a real file import workflow.
- Phase 41 adds a local file-reader dry-run wrapper only. It does not add persistence, URL fetching, Excel/PDF parsing, public upload APIs, or a real file import workflow.
- Phase 42 adds a dry-run CLI runner only. It does not add persistence, write flags, URL fetching, Excel/PDF parsing, public upload APIs, or a real file import workflow.
- Phase 43 records CLI verification evidence only. It does not add persistence, write flags, URL fetching, Excel/PDF parsing, public upload APIs, or a real file import workflow.
- Phase 44 records controlled local write trial policy only. It does not add persistence, write flags, URL fetching, Excel/PDF parsing, public upload APIs, or a real file import workflow.
- Phase 45 adds a controlled local DB write trial for synthetic accepted rows only. It does not add URL fetching, Excel/PDF parsing, public upload APIs, real BCTC import, or Financials UI runtime behavior.
- Phase 46 adds read-back and cleanup policy only. It does not delete rows, add public cleanup behavior, import real BCTC data, or change Financials UI runtime behavior.
- Phase 47 adds runtime loader boundary only. It does not wire Financials UI, import real BCTC data, or approve a production provider.
- Phase 48 adds Financials UI runtime wiring only. It does not import real BCTC data, write/delete DB rows, or approve a production provider.

## 12. Files Changed

- `src/lib/data-sources/index.ts`
- `src/lib/data-sources/financial-statement-read-service.ts`
- `src/lib/data-sources/__tests__/financial-statement-read-service.test.ts`
- `src/features/financials/lib/adapt-financial-statement-records.ts`
- `src/features/financials/lib/__tests__/adapt-financial-statement-records.test.ts`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
