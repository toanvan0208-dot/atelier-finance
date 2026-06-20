# Financial Statements Read-back And Cleanup Policy

Phase: 46 - Financial Statements Read-back Evidence & Cleanup Policy

Date: 2026-06-20

## 1. Goal

Phase 46 verifies that the synthetic local financial statement rows written in Phase 45 can be read back through the local read service and adapter boundary.

This phase also defines cleanup and rollback policy for those synthetic local research rows. It does not write new DB rows, delete rows, reset/seed DB, import real BCTC data, add public API behavior, or wire Financials UI runtime behavior.

## 2. Why This Follows Phase 45

Phase 45 added the first controlled local DB write trial for synthetic accepted dry-run rows.

Phase 46 verifies the downstream read path:

`local SQLite/dev DB -> getFinancialStatementSeries() -> adaptFinancialStatementSeries()`

The goal is to prove the written synthetic rows remain source-scoped, research-only, null-safe, and unapproved when read back.

Phase 47 adds a Financials DB-backed runtime boundary in `FINANCIALS_DB_BACKED_RUNTIME_BOUNDARY.md`. It wraps this read path behind explicit `preferDb`/environment gating.

Phase 48 wires that runtime boundary into the Financials UI in `FINANCIALS_UI_RUNTIME_WIRING_BOUNDARY.md`. The UI wiring remains default-off for DB reads, uses server-side loading only, keeps source transparency visible, and does not write/delete DB rows or change the cleanup policy.

## 3. Read-back Verification Setup

Environment:

- `DATABASE_URL=file:./dev.db`

Read-back filters:

- `sourceLabel:phase45_synthetic_financial_statement_local_write`
- `dataMode:research_only`

Read targets:

- `FPT`
- `MWG`
- `VCB`

Verification was read-only. No additional DB rows were written and no cleanup/delete command was run.

## 4. Read-back Observations

Read-only DB verification by `sourceLabel` and `dataMode` confirmed:

- total row count: `3`
- tickers: `FPT`, `MWG`, `VCB`
- FPT 2024 annual count: `1`
- blank ticker count: `0`
- MWG `revenue:null`
- MWG `operatingCashFlow:null`
- all rows scoped to `dataMode:research_only`
- all rows scoped to `sourceLabel:phase45_synthetic_financial_statement_local_write`

Interpretation:

- rejected row from the synthetic CSV was not written
- skipped duplicate FPT row was not written twice
- missing numeric values stayed `null`
- source label and data mode were preserved
- synthetic rows remain local/research-only evidence

## 5. Read Service Observations

`getFinancialStatementSeries()` read-back results:

| Ticker | Status | Record count | Source label | Data mode | Production approved | Null/missing behavior |
| --- | --- | ---: | --- | --- | --- | --- |
| `FPT` | `available` | `1` | `phase45_synthetic_financial_statement_local_write` | `research_only` | `false` | revenue `1000`, operating cash flow `300` |
| `MWG` | `partial` | `1` | `phase45_synthetic_financial_statement_local_write` | `research_only` | `false` | revenue `null`, operating cash flow `null`, missing fields reported |
| `VCB` | `available` | `1` | `phase45_synthetic_financial_statement_local_write` | `research_only` | `false` | revenue `2000`, operating cash flow `500` |

The read service preserved:

- `productionApproved:false`
- `sourceLabel`
- `dataMode`
- `periodType:year`
- missing fields for MWG
- local/research-only source boundary warnings

## 6. Adapter Observations

`adaptFinancialStatementSeries()` was run on the read-back service outputs.

Adapter verification confirmed:

- `productionApproved:false`
- `fallbackUsed:false`
- source labels remained `phase45_synthetic_financial_statement_local_write`
- data modes remained `research_only`
- FPT adapter status: `available`
- MWG adapter status: `partial`
- VCB adapter status: `available`
- MWG snapshot `revenue:null`
- MWG snapshot `operatingCashFlow:null`
- MWG missing fields included `revenue` and `operatingCashFlow`

The adapter did not compute ratios, fair value, investment actions, or trading signals. Missing values were not replaced with `0`.

## 7. Cleanup Policy

Synthetic Phase 45 rows may be kept temporarily when:

- they are needed as local evidence for read-back verification
- they are needed for a future runtime-boundary phase
- the local dev DB is not shared externally
- the rows remain clearly source-scoped by `sourceLabel` and `dataMode`

Synthetic rows should be cleaned up when:

- evidence is no longer needed
- a real-source trial is planned and contamination risk exists
- the local DB will be shared externally
- sourceLabel-specific rows could confuse later UI/read-path verification

## 8. Cleanup Rules

Cleanup must be source-scoped:

- `sourceLabel = phase45_synthetic_financial_statement_local_write`
- `dataMode = research_only`

Cleanup must not:

- broadly delete all `FinancialStatement` rows
- run `db:reset` by default
- run `db:seed` by default
- delete unrelated local research evidence
- run against a production DB
- commit the DB file after cleanup

A future cleanup should verify counts before and after cleanup. Phase 46 does not add a cleanup CLI or destructive script.

## 9. Rollback Notes

If rollback is needed later:

- restore a local DB backup if one exists
- keep the backup outside the repo
- do not commit DB backups
- if no backup exists, use a sourceLabel-scoped delete only after explicit user confirmation
- avoid broad destructive commands
- keep a read-only verification record before and after cleanup

## 10. Safety Notes

Phase 46 did not:

- write additional DB rows
- delete DB rows
- run `db:reset`
- run `db:seed`
- import real BCTC data
- call external APIs
- scrape or download data
- parse Excel/PDF
- add public upload/API behavior
- change Financials UI runtime behavior
- approve a production provider
- claim official/realtime/production financial data
- commit `dev.db`
- commit raw CSV
- commit JSON/report output
- create investment action outputs

## 11. Limitations

- Synthetic local research data only.
- Read-back evidence depends on local Phase 45 rows being present in `dev.db`.
- No real financial statement source was reviewed or approved.
- No Financials UI runtime behavior was changed.
- No production database or production provider is involved.
- Cleanup policy is documented, but cleanup was not executed.
- Phase 47 adds runtime loader boundary only. It does not cleanup/delete rows or claim Financials UI browser verification.
- Phase 48 adds controlled Financials UI wiring/browser verification only. It does not cleanup/delete rows, write new rows, import real BCTC data, or approve a production source.

## 12. Files Changed

- `docs/product/FINANCIAL_STATEMENTS_READ_BACK_AND_CLEANUP_POLICY.md`
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

Final validation commands passed for this phase:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test` (`60` files / `426` tests)
