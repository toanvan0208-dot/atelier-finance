# Phase 152I: HPG/VNM/MWG Deep Module Read-Path Smoke

## Objective
Smoke the read paths for Business, Financials, Valuation, Risk, and Assistant context modules for the newly unlocked tickers (HPG, VNM, MWG), while ensuring that FPT, MSN, and VCB remain correctly gated as display-only.

## Execution Details
- **Created Smoke Script**: `scripts/smoke-hpg-vnm-mwg-deep-module-read-paths.ts`.
- **Read Path Fixes**:
  - `load-company-business-profile.ts`: Adjusted the Prisma lookup to use `findFirst` by `ticker`, `profileLanguage`, and `dataMode`, instead of hardcoding `staging_company_business_profile_research_seed` as `sourceLabel`.
  - `load-financials-runtime-data.ts`: Included fallback logic to read from `External financials review workspace` for HPG, VNM, MWG before falling back to the PDF preview source, since the confirm-write script seeded data under `External financials review workspace`.
- **Smoke Tests Implemented**:
  - Verified `loadCompanyBusinessProfile` returns a valid profile for HPG, VNM, MWG without prohibited terminology.
  - Verified `loadFinancialsRuntimeData` correctly hits the database path (`runtimeStatus: "db_backed"`) and properly null-handles missing fields (e.g. `capitalExpenditure`, `cashAndEquivalents`).
  - Verified mock readiness for `Valuation` (EPS > 0, Price > 0) and `Risk` (Total Debt and Equity present).
  - Verified `loadAssistantMarketPriceContext` correctly builds JSON without injecting hidden forbidden terminology into the data blocks.
  - Verified FPT, MSN, and VCB remain as `analysisEligible: false` and their deep links remain blocked.

## Results
```json
{
  "phase": "152I",
  "mode": "smoke_only",
  "hpgBusinessReadPathPassed": true,
  "vnmBusinessReadPathPassed": true,
  "mwgBusinessReadPathPassed": true,
  "hpgFinancialsReadPathPassed": true,
  "vnmFinancialsReadPathPassed": true,
  "mwgFinancialsReadPathPassed": true,
  "hpgValuationReadPathPassed": true,
  "vnmValuationReadPathPassed": true,
  "mwgValuationReadPathPassed": true,
  "hpgRiskReadPathPassed": true,
  "vnmRiskReadPathPassed": true,
  "mwgRiskReadPathPassed": true,
  "hpgAssistantContextPassed": true,
  "vnmAssistantContextPassed": true,
  "mwgAssistantContextPassed": true,
  "fptDisplayOnly": true,
  "msnDisplayOnly": true,
  "vcbDisplayOnly": true,
  "fptDeepLinkBlocked": true,
  "msnDeepLinkBlocked": true,
  "vcbDeepLinkBlocked": true,
  "capitalExpenditureMissingHandledSafely": true,
  "cashAndEquivalentsMissingHandledSafely": true,
  "totalDebtMisuseDetected": false,
  "zeroFillDetected": false,
  "targetPriceOrFairValueDetected": false,
  "upsideDownsideDetected": false,
  "forbiddenAdviceDetected": false,
  "noBenchmarkDetected": true,
  "noRankingDetected": true,
  "noScoreDetected": true,
  "noStockAttractivenessScoreDetected": true,
  "productionApprovedTrueCount": 0,
  "hsgNkgUntouched": true,
  "tvnPresent": false,
  "dbWriteAttempted": false,
  "schemaChanged": false,
  "providerFetchAttempted": false,
  "uiChanged": false,
  "assistantChanged": false,
  "rawExternalFilesCopiedToRepo": false,
  "rawManualInputCommitted": false,
  "smokePassed": true
}
```

## Conclusion
The deep module read-paths have been properly proven for HPG, VNM, and MWG. They successfully consume the newly committed external review data without resorting to fake data, sample fallbacks, zero-fills, or triggering forbidden advice terminology. FPT, MSN, and VCB remain safely isolated in display-only mode. Typecheck passed successfully after aligning `dataMode` enum casting and safely resolving type access on `FinancialsStatementSnapshot`.
