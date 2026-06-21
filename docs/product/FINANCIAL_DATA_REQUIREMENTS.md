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
