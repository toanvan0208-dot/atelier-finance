# Prisma-backed FPT Financial Statement Temp DB Write Verification

## 1. Phase Purpose

Phase 80 verifies that the controlled Phase 78/79 FPT financial statement payload can be persisted and read back through actual Prisma Client against a test-only SQLite temp DB.

The phase proves real Prisma persistence for `FinancialStatement` and `FinancialStatementUnitMetadata` without touching `prisma/dev.db`.

## 2. Why Phase 80 Is Needed After Phase 79

Phase 79 verified the write/read boundary with an in-memory Prisma-compatible fake store. Phase 80 adds the next safety layer: actual Prisma Client, actual SQLite temp DB file, and existing SQL migrations applied to that temp DB.

This is still a controlled verification. It is not a CSV importer and not production ingestion.

## 3. Trial Identity

```text
ticker: FPT
scenario: phase80_prisma_backed_fpt_financial_statement_temp_db_write_verification
source baseline: phase78_fpt_local_research_financial_statement_trial
period: 2024
periodType: annual persisted/read as year
basis: consolidated
dataMode: research_only
productionApproved: false
source approval: not approved
```

## 4. Temp DB Setup And Cleanup

The focused Phase 80 test creates a SQLite DB under the operating-system temp directory with an `atelier-phase80-fpt-prisma-*` folder.

The temp DB path is outside the repo. The test disconnects Prisma Client and deletes the temp directory in cleanup. No DB file remains in git status.

## 5. Existing Migration/Schema Use

The test initializes the temp DB by applying existing migration SQL files with:

```text
prisma db execute --file <existing migration.sql>
```

Applied migrations:

```text
prisma/migrations/20260618162000_phase_29e_local_database_foundation/migration.sql
prisma/migrations/20260621070000_phase_68_financials_unit_metadata_sidecar/migration.sql
prisma/migrations/20260621093000_phase_75_market_pvt_unit_metadata_sidecar/migration.sql
```

No new migration is created. `prisma db push`, `db:reset`, and `db:seed` are not used.

## 6. Source/Data Approval Boundary

The source remains local research/user-provided evidence only. It is not official, not realtime, not source-approved, and not production-approved.

Source approval added: no.

## 7. Fields Persisted

The Prisma-backed temp DB write persists one FPT annual 2024 FinancialStatement row for the supported controlled fields:

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

## 8. Unit Metadata Persisted

The temp DB write persists `FinancialStatementUnitMetadata` sidecar rows linked by `financialStatementId` and `field`.

Required read-back units:

```text
revenue: billion_vnd
totalEquity/equity: billion_vnd
sharesOutstanding: million_shares
eps: vnd_per_share
```

## 9. Prisma Read-back Verification

Read-back through Prisma verifies:

- FinancialStatement row exists for FPT / 2024 / annual/year;
- ten unit metadata rows exist;
- sidecar rows link to the correct FinancialStatement id;
- revenue metadata is explicit and valid;
- equity metadata is explicit and valid;
- shares metadata is explicit and valid;
- EPS metadata is explicit and valid;
- source/evidence metadata remains research-only and unapproved.

Old rows without metadata remain `unknown_unit` through the existing helper, and invalid persisted metadata cannot be bypassed by numeric values.

## 10. Valuation Handoff Boundary

Valuation handoff remains explicit-unit-only:

- revenue/equity/shares/EPS use explicit metadata;
- Financials DB-backed read-back does not imply Valuation is fully DB-backed;
- local/research DB-backed data does not imply production approval;
- no EV, EV/EBITDA, DCF, fair value, target price, recommendation, or Risk scoring is introduced.

## 11. Missing/Invalid Behavior

Missing values are blocked before write and are not converted to zero.

Missing units block the Prisma write gate. Invalid units block the Prisma write gate. No default unit is applied and no unit is inferred from magnitude.

## 12. productionApproved:false Rule

All payload, write report, persisted sidecar, read-back, and Valuation boundary data remains `productionApproved:false`.

## 13. What Was Not Done

```text
Raw CSV committed: no
Real CSV import performed: no
General importer added: no
Prisma-backed temp DB write performed: yes, test-only
Production/dev DB mutated: no
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
- no public upload API;
- no UI/browser behavior change;
- no new financial or valuation metric.

## 14. Validation Results

Validated commands:

```text
npx vitest run src/features/financials/lib/__tests__/fpt-financial-statement-prisma-temp-db-write-verification.test.ts
npx prisma validate
npx tsc --noEmit
npm run lint
npm test
```

The focused test performs an actual Prisma-backed temp SQLite write/read-back and cleans the temp directory afterward.

## 15. Future Phase 81 Recommendation

Phase 81 should stay narrow and source-evidence driven. Recommended next step: decide whether to add a temp-DB runtime loader integration test using the same controlled FPT row, or pause write expansion until source approval and real-file evidence are available.

Do not move to real CSV import, provider ingestion, expanded ticker/year coverage, or production data claims until source/evidence review is complete.

## Phase 82 Follow-up

Phase 82 adds `FINANCIAL_STATEMENT_CSV_TO_PRISMA_TEMP_DB_WRITE_TRIAL.md`. It reuses the Phase 80 temp DB safety pattern after parsing an inline CSV string through the Phase 81 boundary. The Prisma write remains test-only and temp-DB-only, with cleanup verified. No production/dev DB mutation, CSV file, filesystem CSV read, public upload API/UI, source approval, or production-approved claim is added.
