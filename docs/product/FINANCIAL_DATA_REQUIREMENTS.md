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
