# Controlled FPT Financial Statement DB Write Trial

## 1. Phase Purpose

Phase 79 verifies that the Phase 78 FPT local research draft/write-intent can pass a controlled FinancialStatement DB write trial and read-back boundary.

The phase proves that:

- validated FPT draft data can be persisted through the existing FinancialStatement local write service;
- explicit unit metadata can be persisted as FinancialStatementUnitMetadata sidecar rows;
- persisted values and sidecar metadata can be read back through the Financials read path;
- Valuation consumes only valid explicit Financials metadata;
- local research data remains `productionApproved:false`.

## 2. Controlled Trial, Not CSV Importer

This is a controlled DB write trial, not a CSV importer.

The trial uses only the already validated inline Phase 78 fixture and its draft/write-intent output. It does not read files, parse CSV, import a real CSV, expose upload behavior, or add a broad ingestion path.

## 3. Trial Identity

```text
ticker: FPT
scenario: phase79_fpt_financial_statement_db_write_trial
source baseline: phase78_fpt_local_research_financial_statement_trial
period: 2024
periodType: annual persisted as year
basis: consolidated
dataMode: research_only
productionApproved: false
source approval: not approved
```

## 4. DB/Test DB Setup

The automated test uses an in-memory Prisma-compatible fake store implementing the existing local write service transaction surface and read-service `findMany` surface.

No SQLite DB file is created. `prisma/dev.db` is not mutated. No temp DB file is committed. The fake store is discarded after each test.

## 5. Source/Data Approval Boundary

The trial source remains local research/user-provided evidence only. It is not official, not realtime, not source-approved, and not production-approved.

Source approval added: no.

## 6. Fields Persisted

The controlled payload persists one FPT annual 2024 FinancialStatement row with the supported Phase 78 fields:

```text
revenue
netIncome
operatingCashFlow
totalAssets
equity/totalEquity
totalDebt
currentAssets
currentLiabilities
eps
sharesOutstanding
```

Unsupported/candidate source fields remain null and are not broadened in this phase.

## 7. Unit Metadata Persisted

The write trial persists explicit sidecar metadata for the supported fields using `FinancialStatementUnitMetadata`.

Required examples:

```text
revenue: billion_vnd
equity: billion_vnd
sharesOutstanding: million_shares
eps: vnd_per_share
```

Missing units, invalid units, non-explicit units, and unit inference from magnitude are blocked before write.

## 8. Source/Evidence Metadata Persisted

The persisted FinancialStatement row carries:

```text
sourceLabel: phase79_fpt_financial_statement_db_write_trial
dataMode: research_only
sourceType: user_input
productionApproved: false
```

Sidecar rows also keep `sourceLabel`, `dataMode`, and `productionApproved:false`.

## 9. Read-back Verification

Read-back verifies:

- the FPT / 2024 / annual/year row is readable;
- unit metadata sidecar rows are linked by `financialStatementId` and `field`;
- revenue metadata reads back as explicit `billion_vnd`;
- equity/totalEquity metadata reads back as explicit `billion_vnd`;
- sharesOutstanding metadata reads back as explicit `million_shares`;
- EPS metadata reads back as explicit `vnd_per_share`;
- source/evidence metadata remains research-only and unapproved.

Old rows without sidecar metadata remain `unknown_unit` and not ready for unit-sensitive calculations. Invalid persisted metadata cannot be bypassed by numeric financial values.

## 10. Valuation Handoff Boundary

Valuation receives Financials fields only with valid explicit units. The trial keeps these boundaries:

- revenue, equity, sharesOutstanding, and EPS can normalize only from explicit metadata;
- P/E is not applicable when EPS is `<= 0`;
- P/B/BVPS/ROE-style interpretation remains blocked or not applicable when equity or share inputs are invalid;
- sharesOutstanding `<= 0` blocks share-based metric interpretation;
- Financials DB-backed does not imply Valuation is fully DB-backed;
- no EV, EV/EBITDA, DCF, fair value, target price, recommendation, or Risk scoring is introduced.

## 11. Missing/Invalid Behavior

Missing numeric values stay null and are not converted to zero.

Missing unit metadata blocks the controlled DB write gate. Invalid unit metadata blocks the controlled DB write gate. No default unit is applied, and no unit is inferred from magnitude.

## 12. productionApproved:false Rule

All local research/manual data remains `productionApproved:false` in payloads, write reports, read-back metadata, sidecar rows, and Valuation boundary results.

## 13. What Was Not Done

```text
Raw CSV committed: no
Real CSV import performed: no
General importer added: no
DB write performed: controlled trial only
DB file committed: no
External API/vnstock used: no
Source approval added: no
productionApproved:false
Browser verification not required unless UI changed
```

Also not done:

- no schema migration;
- no `prisma db push`;
- no `db:reset`;
- no `db:seed`;
- no Excel/PDF parser;
- no provider;
- no UI/browser behavior change;
- no new financial or valuation metric.

## 14. Validation Results

Validated commands:

```text
npx vitest run src/features/financials/lib/__tests__/fpt-financial-statement-db-write-trial.test.ts
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
```

The focused Phase 79 tests verify controlled write/read-back behavior using an in-memory test fixture only, with no DB file produced.

## 15. Future Phase 80 Recommendation

Phase 80 should remain narrow. Recommended next step: decide whether to run a similarly controlled temporary-DB integration test using an isolated SQLite DB outside the repo, or keep the write trial at the dependency-injected service boundary until source approval and real-file evidence are available.

Do not move to real CSV import, production ingestion, or expanded ticker/year coverage until the source/evidence review is complete.
