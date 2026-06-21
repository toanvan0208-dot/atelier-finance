# Financial Data Requirements

## Phase 78 Financial Statement Trial Requirements

Phase 78 records the controlled FPT local research data trial in `CONTROLLED_FPT_LOCAL_RESEARCH_DATA_TRIAL.md`.

Financial statement rows used for local research validation must preserve these requirements:

- numeric values must remain missing/null when absent;
- missing values must not be converted to `0`;
- units must be explicit per field;
- units must match the existing Financials unit metadata contract;
- units must not be inferred from numeric magnitude;
- source/evidence metadata must be present before future write trials;
- local research/manual/user-provided data must remain `productionApproved:false`;
- Financials DB-backed data must not imply Valuation is fully DB-backed;
- unsupported fields must remain blocked until a later contract/schema review.

For the current Financials unit contract, supported write-ready trial fields are:

```text
revenue
netIncome
operatingCashFlow
totalAssets
equity
totalDebt
currentAssets
currentLiabilities
eps
sharesOutstanding
```

Candidate source fields such as `grossProfit`, `totalLiabilities`, and `capitalExpenditure` require a later mapping review before they can become write-ready.

## Phase 79 Controlled DB Write Trial Requirements

Phase 79 records the controlled FPT FinancialStatement DB write trial in `CONTROLLED_FPT_FINANCIAL_STATEMENT_DB_WRITE_TRIAL.md`.

Controlled DB write trials must preserve these additional requirements:

- only validated Phase 78 draft/write-intent data can enter the Phase 79 write payload;
- the trial remains one ticker only: `FPT`;
- the trial remains one annual period only: `2024`;
- write behavior must use an injected safe test DB/store or an isolated temp DB outside tracked repo paths;
- `prisma/dev.db` must not be mutated;
- DB files, raw CSV files, JSON outputs, and generated artifacts must not be committed;
- `FinancialStatementUnitMetadata` rows must be linked by `financialStatementId` and `field`;
- old rows without sidecar metadata remain `unknown_unit`;
- invalid persisted sidecar metadata cannot be bypassed by numeric values;
- read-back source metadata remains `research_only` and `productionApproved:false`;
- Financials DB-backed read-back does not make Valuation fully DB-backed.

## Phase 80 Prisma Temp DB Verification Requirements

Phase 80 records Prisma-backed FPT FinancialStatement temp DB verification in `PRISMA_BACKED_FPT_FINANCIAL_STATEMENT_TEMP_DB_WRITE_VERIFICATION.md`.

Prisma-backed temp DB verification must preserve these requirements:

- temp SQLite DB files must be created outside tracked repo paths or cleaned before final status;
- existing migration SQL may be applied to the temp DB with `prisma db execute --file`;
- `prisma db push`, `db:reset`, and `db:seed` must not be used;
- `prisma/dev.db` and production/dev databases must not be mutated;
- actual Prisma read-back must verify `FinancialStatement` and `FinancialStatementUnitMetadata`;
- revenue, equity/totalEquity, sharesOutstanding, and EPS units must be explicit and valid;
- temp DB files must never be committed or left visible in git status;
- source/evidence status remains not approved and `productionApproved:false`.
