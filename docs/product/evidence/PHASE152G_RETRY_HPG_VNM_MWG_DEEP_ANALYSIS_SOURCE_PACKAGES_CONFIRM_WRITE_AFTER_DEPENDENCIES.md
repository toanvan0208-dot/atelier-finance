# Phase 152G-retry — HPG/VNM/MWG CompanyIndustry, FinancialStatement, and BusinessProfile Confirm-Write After Dependencies

## Context
In Phase 152G-prereq, we successfully confirmed the creation of the required `Industry` definitions (`STEEL_MATERIALS`, `CONSUMER_STAPLES_DAIRY`, `RETAIL`) and the `DataSource` dependencies (`External financials review workspace`, `External business review workspace`). These steps were necessary after the initial 152G phase was correctly blocked by guardrails due to missing taxonomy constraints. 

In this Phase 152G-retry, we are returning to the core operation of ingesting the manually-curated external review data for our three target tickers (HPG, VNM, MWG) across three key models: `CompanyIndustry`, `FinancialStatement`, and `CompanyBusinessProfile`.

## Implementation Details

The previous execution script (`confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts`) and the read-path smoke test (`smoke-hpg-vnm-mwg-deep-analysis-source-packages-read-path.ts`) were modified to dynamically hook into the exact `DataSource` instances created during 152G-prereq. 

Strict guardrails remained in place to enforce constraints:
- Data was parsed strictly from the local external workspaces.
- Non-allowed DB writes (e.g., creating ranks, benchmarks) were prevented.
- `capitalExpenditure` and `cashAndEquivalents` were validated in memory and purposefully omitted from database persistence to prevent overloading potentially misaligned fields (`cashAndEquivalents` does not exist in `FinancialStatement`, and `capitalExpenditure` must remain null as there is no pure Capex field).
- `productionApproved` remains at `0`.
- HSG/NKG remained untouched, and TVN remains absent.

## Verification Log

Execution pipeline results from the strict dry run, execution run, idempotency run, and smoke tests have confirmed complete safety and validity:

```json
{
  "phase": "152G-retry",
  "smoke": "hpg_vnm_mwg_deep_analysis_source_packages_read_path",
  "financialsWorkspaceFound": true,
  "businessWorkspaceFound": true,
  "hpgCompanyIndustryPresent": true,
  "vnmCompanyIndustryPresent": true,
  "mwgCompanyIndustryPresent": true,
  "hpgFinancialStatementPresent": true,
  "vnmFinancialStatementPresent": true,
  "mwgFinancialStatementPresent": true,
  "hpgBusinessProfilePresent": true,
  "vnmBusinessProfilePresent": true,
  "mwgBusinessProfilePresent": true,
  "capitalExpenditureNotForceStored": true,
  "cashAndEquivalentsStoredSafely": true,
  "totalDebtMisuseDetected": false,
  "zeroFillDetected": false,
  "productionApprovedTrueCount": 0,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "companyRows": 6,
  "marketPriceRows": 6,
  "dataSourceRows": 3,
  "screeningCandidateRows": 8,
  "screeningCandidateMetricRows": 26,
  "companyWriteAttempted": false,
  "marketPriceWriteAttempted": false,
  "dataSourceWriteAttempted": false,
  "screeningCandidateWriteAttempted": false,
  "screeningCandidateMetricWriteAttempted": false,
  "industryMetricCreated": false,
  "benchmarkCreated": false,
  "rankingCreated": false,
  "stockAttractivenessScoreCreated": false,
  "rawExternalFilesCopiedToRepo": false,
  "rawManualInputCommitted": false,
  "forbiddenAdviceDetected": false,
  "smokePassed": true
}
```

## Summary
The pipeline effectively fetched, verified, and mapped external financial and business profile metrics into the internal PostgreSQL models. Data lineage is fully traceable back to `curated_internal` Data Sources, and safety assertions (such as rejecting zero-fill approximations or forcing missing values) were honored perfectly. Idempotency passed. All smoke verifications are `true`.
