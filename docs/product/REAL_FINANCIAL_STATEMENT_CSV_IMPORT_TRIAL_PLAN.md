# Real Financial Statement CSV Import Trial Plan

## 1. Purpose And Phase Boundary

Phase 77 defines the controlled plan for a later real financial statement CSV import trial. It prepares the CSV contract, unit metadata requirements, source evidence requirements, validation gates, and fail-closed behavior for a future small local research trial.

This phase does not import real data, parse a real CSV, write a database row, create a migration, edit Prisma schema, add UI, approve a source, or add financial/valuation metrics.

## 2. Why This Is Plan-only

The current repo already has Financials CSV dry-run/import contract history, `FinancialStatement` persistence, and `FinancialStatementUnitMetadata` sidecar support. A real local research CSV trial still needs a written source/unit/evidence contract before any real file is used.

Phase 77 therefore creates documentation plus a pure checklist helper only. The helper does not read files, parse CSV, call APIs, or write to DB.

## 3. Allowed Future CSV Source Type

A future trial may use a very small local research CSV supplied by the user and kept outside the repository. The first candidate should be one ticker only, preferably FPT, reviewed as local research/manual data.

Allowed future source mode: local/user-provided/research-only CSV with `productionApproved:false`.

## 4. Forbidden Source Assumptions

The CSV must not be treated as official, realtime, legally approved, production-approved, or production-ready. Missing source evidence must block any production-approved claim even if a local research dry-run is otherwise allowed.

## 5. Required CSV Columns

Required columns for a future trial:

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
sourceUrl
sourceDocumentRef
sourceOwner
asOf
dataMode
productionApproved
evidenceNote
basis
```

At least one of `sourceUrl` or `sourceDocumentRef` must be present.

## 6. Required Unit Metadata

Every numeric row must include an explicit `unit`. Missing unit, `unknown`, or invalid unit blocks any future write.

Current supported Financials fields and accepted units follow the existing Financials unit contract:

| Field | Accepted units |
| --- | --- |
| `revenue` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `netIncome` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `operatingCashFlow` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `totalAssets` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `equity` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `totalDebt` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `currentAssets` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `currentLiabilities` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` |
| `eps` | `vnd_per_share` |
| `sharesOutstanding` | `shares`, `thousand_shares`, `million_shares` |

No magnitude guessing is allowed. No blank unit defaults to VND, million VND, shares, or any other unit.

## 7. Required Source/Evidence Metadata

Rows must carry:

```text
sourceLabel
sourceOwner
sourceUrl or sourceDocumentRef
asOf
dataMode
productionApproved
evidenceNote
```

Local research/manual CSV rows must use `productionApproved:false`. Missing evidence may still allow a research-only dry-run in a later phase, but it must block DB write and all production-approved claims.

## 8. Ticker Mapping Rules

Ticker must be non-empty, uppercase-normalizable, and mapped to one issuer at a time. The first real trial should use one ticker only. Ticker aliases, exchange conflicts, and multi-company files must be rejected until a later mapping review exists.

## 9. Period Mapping Rules

Allowed future `periodType` values:

```text
annual
quarterly
```

Examples:

```text
2024
2024Q4
2025Q1
```

The future mapper must translate these to existing `FinancialStatement.periodType` values only after validation. Ambiguous period labels must be rejected before write.

## 10. Statement Type Rules

Allowed `statementType` values:

```text
income_statement
balance_sheet
cash_flow
```

The current normalized write target is still `FinancialStatement`, so `statementType` is evidence and validation context. It must not create new metrics or new tables in Phase 77.

## 11. Missing Data Behavior

Missing data must remain null/not available. It must not become `0`. Rows with missing `value` are blocked from future write until the future trial explicitly decides whether to omit the row or record a missing-field diagnostic.

## 12. Invalid Value Behavior

Invalid numbers, non-finite numbers, EPS `<= 0`, sharesOutstanding `<= 0`, and other invalid values must fail closed for calculations. They must not unlock valuation readiness or normal ratio interpretation.

## 13. Invalid/Missing Unit Behavior

Missing unit blocks future write. Invalid unit blocks future write. Unknown unit blocks unit-sensitive calculations. Persisted numeric values must not bypass missing or invalid unit metadata.

## 14. Duplicate Row Behavior

The duplicate key for a future trial should be:

```text
ticker + period + periodType + statementType + field + basis + sourceLabel
```

Duplicate rows in the same file must be rejected or require an explicit deterministic rule before write. Silent overwrite is not allowed.

## 15. Consolidated Vs Standalone Handling

Required `basis` values:

```text
consolidated
standalone
```

The first trial should prefer consolidated statements when available. Mixing consolidated and standalone rows in one derived snapshot is forbidden unless an explicit reconciliation rule is added in a later phase.

## 16. Currency/Unit Scale Handling

`currency` should be `VND` for the first Vietnam equity trial. Scale belongs in `unit`, not in inferred numeric magnitude. A value such as `1000` with `billion_vnd` means something different from `1000` with `million_vnd`; the importer must not infer or convert without explicit unit metadata.

## 17. productionApproved:false Rule

Local research, manual, user-provided, sample, or synthetic data must remain `productionApproved:false`. A future trial cannot promote source status merely because a CSV row passes validation.

## 18. Financials-to-Valuation Handoff Boundary

Financials DB-backed data does not make Valuation fully DB-backed. Valuation readiness still requires valid Financials units, valid Market/PVT metadata, and separate source boundaries. Missing or invalid Financials units keep scale-sensitive calculations unavailable or insufficient.

No target price, fair value, recommendation, Risk scoring, EV, EV/EBITDA, or DCF is added by this plan.

## 19. Pre-write Validation Gates

Before any future write trial:

- CSV file must stay outside the repo.
- dry-run validation must pass.
- required columns must exist.
- every supported field must have an explicit accepted unit.
- source evidence metadata must exist.
- `productionApproved` must be false.
- missing values must remain null/not available.
- duplicates must be rejected or explicitly resolved.
- no unit may be inferred from magnitude.
- no DB reset, seed, or `db push` may be used.

## 20. Future Phase 78 Trial Gates

Phase 78 may proceed only if it uses a tiny controlled local research dataset, preferably one ticker first, and all gates pass:

- real CSV remains outside the repo;
- no raw CSV/JSON/report output is committed;
- source/evidence metadata is complete enough for research-only review;
- unit metadata is explicit for every supported field;
- dry-run is reviewed before any controlled write;
- `productionApproved:false` is preserved;
- no source approval overclaim is introduced;
- no real import occurs unless all gates pass.

## 21. Explicit Non-goals

Phase 77 does not:

- import real financial statement data;
- create or commit CSV files;
- parse a real CSV;
- write DB rows;
- create migration or edit Prisma schema;
- reset, seed, or push DB schema;
- call external APIs or Vnstock;
- add provider, Excel parser, PDF parser, public upload API, or UI;
- add financial or valuation metrics;
- calculate EV, EV/EBITDA, DCF, fair value, target price, upside, downside, or recommendation;
- add Risk scoring;
- claim official, realtime, production-approved, or production-ready data.
