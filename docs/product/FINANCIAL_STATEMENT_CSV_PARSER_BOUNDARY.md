# Financial Statement CSV Parser Boundary

## 1. Phase Purpose

Phase 81 adds a narrow CSV parser boundary for financial statement rows. It accepts small CSV string input and returns safe draft/write-intent rows only.

The boundary validates columns, row fields, numeric values, units, source/evidence metadata, duplicate row keys, and `productionApproved:false`.

## 2. Why Phase 81 Follows Phase 80

Phase 80 proved that a validated FPT payload can be persisted and read back through actual Prisma and a temp SQLite DB.

Phase 80 did not prove CSV parsing, column validation, duplicate row detection, or CSV-to-draft mapping. Phase 81 fills that gap without writing to DB.

## 3. Parser Boundary

The parser receives CSV text as a string. It does not read files, write files, expose upload behavior, call APIs, or write DB rows.

The parser is for controlled local/research/manual CSV text boundaries only.

## 4. Required CSV Columns

Required columns:

```text
ticker
period
periodType
statementType
field
value
unit
currency
sourceLabel
sourceOwner
sourceUrl
sourceDocumentRef
asOf
dataMode
productionApproved
evidenceNote
basis
```

Missing columns fail closed.

## 5. Required Source/Evidence Fields

Required source/evidence values:

```text
sourceLabel
sourceOwner
asOf
dataMode
evidenceNote
```

At least one of `sourceUrl` or `sourceDocumentRef` must be present. Both missing fails closed.

## 6. Required Unit Metadata

Every parsed row must carry an explicit valid unit.

Rules:

- missing unit blocks the row;
- invalid unit blocks the row;
- `unknown` blocks the row;
- no default unit is applied;
- no unit is inferred from value magnitude.

## 7. Supported Fields

Supported fields:

```text
revenue
grossProfit
netIncome
totalAssets
totalLiabilities
totalEquity
cashAndEquivalents
currentAssets
currentLiabilities
operatingCashFlow
capitalExpenditure
sharesOutstanding
eps
```

Unsupported fields fail closed.

## 8. Numeric Parsing Rules

Allowed numeric examples:

```text
1000
1000.5
-1000
0
```

Empty values do not become zero. `NaN`, `Infinity`, non-numeric text, and comma-formatted values are blocked. No unit or scale is inferred from value magnitude.

## 9. Duplicate Row Rules

Duplicate key:

```text
ticker + period + periodType + statementType + field + basis + sourceLabel
```

Duplicates fail closed. The parser does not silently keep the first row, keep the last row, or aggregate duplicates.

## 10. Output Contract

The parser returns a result object with:

```text
ok
parsedRows
blockedRows
drafts
warnings
writeIntent: draft_only_no_db_write
productionApproved:false
noDbWrite:true
```

Drafts group parsed rows into safe write-intent objects. They are not DB write payloads and do not execute persistence.

## 11. Fail-closed Behavior

The parser blocks rows for:

- missing required columns;
- missing source/evidence values;
- missing `sourceUrl` and `sourceDocumentRef`;
- unsupported fields;
- invalid period, statement, basis, or data mode;
- missing or invalid numeric values;
- missing or invalid units;
- duplicate row keys;
- `productionApproved:true`.

## 12. productionApproved:false Rule

Local/research/manual CSV text must remain `productionApproved:false`. `productionApproved:true` is blocked in Phase 81.

## 13. What Was Not Done

```text
Raw CSV committed: no
Real CSV import performed: no
Filesystem CSV reading: no
General importer added: no
DB write performed: no
Migration/schema changed: no
External API/vnstock used: no
Excel/PDF parser added: no
Public upload UI/API added: no
productionApproved:false for local/research/manual data
Browser verification not required unless UI changed
```

Also not done:

- no provider;
- no real data file;
- no new financial metric;
- no new valuation metric;
- no EV, EV/EBITDA, DCF, fair value, target price, recommendation, or Risk scoring.

## 14. Validation Results

Validated commands:

```text
npx vitest run src/features/financials/lib/__tests__/financial-statement-csv-parser-boundary.test.ts
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
```

Focused tests use inline CSV strings only.

## 15. Future Phase 82 Recommendation

Phase 82 should remain controlled. Recommended next step: decide whether this parser boundary should feed a dry-run-only mapper into the existing Phase 78/79/80 FPT write-intent flow, still without reading files or writing DB.

Do not add public upload, real CSV file import, provider ingestion, DB writes, or production-approved claims until source/evidence review is complete.
