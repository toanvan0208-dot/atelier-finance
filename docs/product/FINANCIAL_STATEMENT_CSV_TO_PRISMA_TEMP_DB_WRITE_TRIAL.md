# Financial Statement CSV To Prisma Temp DB Write Trial

## 1. Phase Purpose

Phase 82 verifies the controlled integration path from inline CSV string input to parser output, Prisma temp DB persistence, and Prisma read-back.

The flow is:

```text
inline CSV string fixture
-> Phase 81 CSV parser
-> valid draft/write-intent rows only
-> Prisma temp SQLite DB write
-> FinancialStatement + FinancialStatementUnitMetadata persisted
-> Prisma read-back verified
```

## 2. Why Phase 82 Follows Phase 80 And Phase 81

Phase 80 proved Prisma-backed temp DB persistence for a validated FPT payload.

Phase 81 proved string-only CSV parsing and fail-closed draft/write-intent output.

Phase 82 connects those two boundaries in a test-only controlled path.

## 3. Trial Identity

```text
ticker: FPT
scenario: phase82_csv_parser_to_prisma_temp_db_write_trial
period: 2024
periodType: annual persisted/read as year
basis: consolidated
dataMode: research_only
productionApproved: false
source approval: not approved
input type: inline CSV string fixture only
```

## 4. Inline CSV Input Boundary

The input is a tiny inline CSV string fixture built in code/test. It includes all Phase 81 required columns and uses `sourceDocumentRef` rather than a real source URL.

No CSV file is created, read, staged, or committed.

## 5. Parser Result Boundary

The parser must return:

```text
writeIntent: draft_only_no_db_write
blockedRows: []
productionApproved:false
noDbWrite:true
```

For Phase 82, any blocked row prevents Prisma write. Partial valid rows are not written if parser output contains blocked rows.

## 6. Prisma Temp DB Setup And Cleanup

The focused test uses the existing Phase 80 temp DB pattern:

- OS temp SQLite DB outside the repo;
- existing migration SQL applied with `prisma db execute --file`;
- Prisma Client connected only to the temp DB;
- temp DB directory deleted after test.

`prisma/dev.db` and production/dev databases are not mutated.

## 7. Persisted FinancialStatement Fields

The controlled write persists one FPT 2024 annual FinancialStatement row with values including:

```text
revenue
netIncome
operatingCashFlow
totalAssets
equity/totalEquity
currentAssets
currentLiabilities
sharesOutstanding
eps
```

## 8. Persisted FinancialStatementUnitMetadata Fields

The write persists explicit sidecar metadata for Financials-owned fields.

Required read-back checks:

```text
revenue: billion_vnd
totalEquity/equity: billion_vnd
sharesOutstanding: million_shares
eps: vnd_per_share
```

## 9. Read-back Verification

Prisma read-back verifies:

- FinancialStatement row exists;
- unit metadata rows exist;
- sidecar rows link to the FinancialStatement id;
- revenue/equity/shares/EPS metadata is explicit and valid;
- source/evidence metadata remains research-only and unapproved;
- `productionApproved:false` remains preserved.

## 10. Fail-closed Parser-to-write Rules

The integration blocks Prisma write when parser output includes:

- missing required column;
- missing unit;
- invalid unit;
- missing value;
- invalid numeric value;
- unsupported field;
- duplicate row key;
- `productionApproved:true`.

Missing values are not converted to zero. No unit or scale is inferred from magnitude.

## 11. productionApproved:false Rule

All parser output, write payload, write report, read-back source metadata, sidecar metadata, and Valuation handoff remain `productionApproved:false`.

## 12. Valuation Handoff Boundary

Valuation remains explicit-unit-only:

- Financials DB-backed does not imply Valuation fully DB-backed;
- local/research DB-backed data does not imply production approval;
- unknown/missing/invalid units block unit-sensitive calculations;
- no EV, EV/EBITDA, DCF, fair value, target price, recommendation, or Risk scoring is introduced.

## 13. What Was Not Done

```text
Raw CSV committed: no
CSV fixture file committed: no
Filesystem CSV reading: no
Real CSV import performed: no
General importer added: no
Prisma temp DB write performed: yes, test-only
Production/dev DB mutated: no
DB file committed: no
Migration/schema changed: no
External API/vnstock used: no
Excel/PDF parser added: no
Public upload UI/API added: no
productionApproved:false
Browser verification not required unless UI changed
```

Also not done:

- no provider;
- no new financial metric;
- no new valuation metric;
- no public endpoint;
- no browser/UI change.

## 14. Validation Results

Validated commands:

```text
npx vitest run src/features/financials/lib/__tests__/financial-statement-csv-to-prisma-temp-db-write-trial.test.ts
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
```

The focused test performs actual Prisma temp DB persistence from parsed inline CSV output and cleans the temp DB afterward.

## 15. Future Phase 83 Recommendation

Phase 83 should remain controlled and dry-run-first. Recommended next step: add a read-only runtime loader integration check using the Phase 82 persisted temp DB row, or stop until source/evidence review is ready.

Do not add filesystem CSV import, public upload/API, provider ingestion, production DB writes, or production-approved claims.
