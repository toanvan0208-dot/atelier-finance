# Financials DB-backed Runtime Boundary

Phase: 47 - Financials DB-backed Runtime Boundary

Date: 2026-06-20

## 1. Goal

Phase 47 adds a Financials runtime loader boundary that can read local DB-backed financial statement rows only when explicitly enabled.

This phase does not wire the Financials UI runtime, does not run browser verification, does not write DB rows, does not cleanup/delete rows, does not import real BCTC data, and does not approve any production source.

## 2. Why This Follows Phase 46

Phase 46 verified that Phase 45 synthetic rows can be read back through:

`local SQLite/dev DB -> getFinancialStatementSeries() -> adaptFinancialStatementSeries()`

Phase 47 wraps that read path in a runtime boundary:

`Financials runtime loader -> optional local DB read -> adapter -> serializable runtime data`

Default behavior remains sample/static fallback. DB-backed behavior requires `preferDb:true` or `ATELIER_FINANCIALS_DB_SOURCE=enabled`.

## 3. Runtime Boundary Design

New module:

- `src/features/financials/lib/load-financials-runtime-data.ts`

Exported through:

- `src/features/financials/index.ts`

Primary function:

- `loadFinancialsRuntimeData(options, deps)`

Options:

- `ticker`
- `preferDb`
- `allowFallback`
- `sourceLabel`
- `dataMode`
- `env`

Runtime data includes:

- `runtimeStatus`
- `source`
- `dataQuality`
- `statementSnapshot`
- `readResult`

## 4. Default Sample/Fallback Behavior

When `preferDb` is not true and `ATELIER_FINANCIALS_DB_SOURCE` is not `enabled`:

- DB is not read
- runtime status is `sample_fallback`
- read path is `sample_static`
- `fallbackUsed:true`
- `productionApproved:false`
- no DB-backed success is claimed

The static/sample fallback keeps numeric statement values `null` instead of inventing DB values.

## 5. Explicit DB-backed Behavior

DB-backed mode is enabled by either:

- `preferDb:true`
- `ATELIER_FINANCIALS_DB_SOURCE=enabled`

Default DB read metadata for Phase 47:

- ticker default: `FPT`
- sourceLabel default: `phase45_synthetic_financial_statement_local_write`
- dataMode default: `research_only`

The loader:

1. calls `getFinancialStatementSeries()`
2. passes the result to `adaptFinancialStatementSeries()`
3. returns `runtimeStatus:db_backed` only when adapted statements exist
4. keeps `fallbackUsed:false`
5. keeps `productionApproved:false`

## 6. Runtime Source Metadata

Runtime source metadata includes:

- `sourceLabel`
- `dataMode`
- `productionApproved:false`
- `fallbackUsed`
- `readPath`
- `ticker`
- `asOf`
- `fiscalYear`
- `periodType`

DB-backed read path is labeled `local_db`. Sample fallback is labeled `sample_static`. Unavailable/read-error states do not claim DB-backed success.

## 7. Empty Or Error Behavior

If DB-backed mode returns no usable adapted statements:

- with `allowFallback:true`, loader returns `sample_fallback` with warnings/errors
- with `allowFallback:false`, loader returns `unavailable`

If DB read throws:

- with `allowFallback:true`, loader returns `sample_fallback` with warning/error metadata
- with `allowFallback:false`, loader returns `read_error`

The loader does not throw uncaught runtime errors for normal empty/error DB states.

## 8. Missing Data Policy

Missing values stay missing:

- no missing value is replaced with `0`
- MWG read-back `revenue:null` remains `null`
- MWG read-back `operatingCashFlow:null` remains `null`
- missing fields are surfaced in `dataQuality.missingFields`

The loader does not compute ratios, fair values, investment actions, or trading signals.

## 9. Client/Server Boundary

The runtime loader dynamically imports the DB read service only in DB-backed mode.

Client components should not import Prisma, database client modules, Node `fs`, or call this loader directly unless a future server boundary wires serialized data into the UI. Phase 47 does not wire Financials UI runtime and does not claim browser verification.

## 10. Tests

Phase 47 adds:

- `src/features/financials/lib/__tests__/load-financials-runtime-data.test.ts`

Tests cover:

- default runtime does not read DB
- explicit DB mode reads local DB path through injected read service
- source metadata is preserved
- `productionApproved:false`
- `fallbackUsed:false` in DB-backed mode
- missing values stay `null`
- empty DB result fallback behavior
- empty DB no-fallback behavior
- read error behavior
- wording safety

Targeted validation:

- `npm test -- --run src/features/financials/lib/__tests__/load-financials-runtime-data.test.ts` (`1` file / `7` tests)

## 11. Actual Local DB Runtime Verification

Read-only verification was run with:

- `DATABASE_URL=file:./dev.db`
- `ATELIER_FINANCIALS_DB_SOURCE=enabled`
- `sourceLabel:phase45_synthetic_financial_statement_local_write`
- `dataMode:research_only`
- `allowFallback:false`

Observed:

| Ticker | Runtime status | Read path | Fallback used | Production approved | Data quality | Revenue | Operating cash flow |
| --- | --- | --- | --- | --- | --- | ---: | ---: |
| `FPT` | `db_backed` | `local_db` | `false` | `false` | `available` | `1000` | `300` |
| `MWG` | `db_backed` | `local_db` | `false` | `false` | `partial` | `null` | `null` |
| `VCB` | `db_backed` | `local_db` | `false` | `false` | `available` | `2000` | `500` |

MWG missing fields included:

- `revenue`
- `operatingCashFlow`

Verification was read-only. No DB write, cleanup, or delete was run.

## 12. Safety Notes

Phase 47 did not:

- write DB rows
- delete/cleanup DB rows
- run `db:reset`
- run `db:seed`
- import real BCTC data
- call external APIs
- scrape or download data
- parse Excel/PDF
- add public upload/API behavior
- wire Financials UI runtime
- run browser UI verification
- approve a production provider
- claim official/realtime/production financial data
- commit `dev.db`
- commit raw CSV or report output
- create investment action outputs

## 13. Limitations

- Runtime loader boundary only.
- No Financials UI/browser verification in this phase.
- DB-backed verification uses synthetic Phase 45 local research rows only.
- No real financial statement source was reviewed or approved.
- No production database or production provider is involved.
- Future UI wiring must preserve this source boundary and be verified in a separate browser/UI phase.

## 14. Files Changed

- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/__tests__/load-financials-runtime-data.test.ts`
- `src/features/financials/index.ts`
- `docs/product/FINANCIALS_DB_BACKED_RUNTIME_BOUNDARY.md`
- `docs/product/FINANCIAL_STATEMENTS_READ_BACK_AND_CLEANUP_POLICY.md`
- `docs/product/FINANCIAL_STATEMENTS_FIRST_LOCAL_DB_WRITE_TRIAL.md`
- `docs/product/FINANCIAL_STATEMENTS_CONTROLLED_LOCAL_WRITE_TRIAL_PLAN.md`
- `docs/product/FINANCIAL_STATEMENTS_LOCAL_DATA_FOUNDATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 15. Validation Evidence

Final validation commands passed for this phase:

- `npx tsc --noEmit`
- `npx prisma validate`
- `npm run lint`
- `npm test` (`61` files / `433` tests)
