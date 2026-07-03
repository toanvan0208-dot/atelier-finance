# Phase 152H — HPG/VNM/MWG Deep Analysis Gating Recompute And Read-Path Smoke

## Goal
Recompute and verify deep-analysis gating for target tickers (HPG, VNM, MWG) after their successful source package confirm-write in Phase 152G-retry. Ensure these three tickers are unlocked for deep analysis while ensuring others (FPT, MSN, VCB) remain visible but display-only in Screening.

## Scope
Strict read-path gating update. The only allowed DB writes were updating the `analysisEligible` flag on existing `ScreeningCandidate` rows.
* No source metrics or data rows were created or modified.
* No provider fetch.
* No schema change.
* HSG/NKG remain completely untouched. TVN remains completely absent.

## Why this phase is needed after 152G-retry
In Phase 152G-retry, all prerequisite deep-analysis dependency data (`CompanyIndustry`, `FinancialStatement`, `CompanyBusinessProfile`) for HPG, VNM, and MWG were manually seeded. However, their `ScreeningCandidate.analysisEligible` flags were not updated in that phase since that script was scoped tightly to writes for those specific domain models. This phase runs the recompute algorithm to unlock the downstream deep-link UI gating for those 3 tickers, dynamically confirming prerequisites are present and fully mapped before unlocking them.

## Current source availability by ticker
* **HPG**: Company, MarketPrice, CompanyIndustry, FinancialStatement, CompanyBusinessProfile
* **VNM**: Company, MarketPrice, CompanyIndustry, FinancialStatement, CompanyBusinessProfile
* **MWG**: Company, MarketPrice, CompanyIndustry, FinancialStatement, CompanyBusinessProfile
* **FPT**: Company, MarketPrice
* **MSN**: Company, MarketPrice
* **VCB**: Company, MarketPrice

## Deep-analysis gating criteria
Deep-analysis eligibility was recomputed for each candidate ticker using the following strict prerequisites:
* `Company` exists
* `MarketPrice` exists
* `ScreeningCandidate` exists
* `CompanyIndustry` exists and correctly links to taxonomy
* `FinancialStatement` exists with safe core fields (`revenue`, `netIncome`, `eps`, `sharesOutstanding`, `equity`, `totalDebt`, `operatingCashFlow`, `totalAssets`)
* `CompanyBusinessProfile` exists
* `totalDebtMisuseDetected=false`
* `zeroFillDetected=false`
* `productionApproved=0` (no bypass of curation review)

## Missing field behavior
* `capitalExpenditure`: Remains missing/un-stored to prevent schema abuse, but does not block analysis gating.
* `cashAndEquivalents`: Remains missing/un-stored as it lacks a designated safe database column. Modules requiring it must safely fallback to `needs_review`/`N/A`.

## Script Results

### Dry-run result
```json
{
  "phase": "152H",
  "mode": "dry_run",
  "hpgDeepAnalysisPrerequisitesMet": true,
  "vnmDeepAnalysisPrerequisitesMet": true,
  "mwgDeepAnalysisPrerequisitesMet": true,
  "hpgAnalysisEligibleBefore": false,
  "vnmAnalysisEligibleBefore": false,
  "mwgAnalysisEligibleBefore": false,
  "hpgAnalysisEligibleAfter": true,
  "vnmAnalysisEligibleAfter": true,
  "mwgAnalysisEligibleAfter": true,
  "fptDisplayOnly": true,
  "msnDisplayOnly": true,
  "vcbDisplayOnly": true,
  ...
  "dbWriteAttempted": false,
  ...
}
```

### Confirm-write result
```json
{
  ...
  "hpgAnalysisEligibleAfter": true,
  "vnmAnalysisEligibleAfter": true,
  "mwgAnalysisEligibleAfter": true,
  "screeningCandidateRowsUpdated": 3,
  "dbWriteAttempted": true,
  "screeningCandidateWriteAttempted": true,
  ...
}
```

### Idempotency rerun result
The script safely detected the gating flags were already set to true on a subsequent run and bypassed all writes.
```json
{
  ...
  "screeningCandidateRowsUpdated": 0,
  "dbWriteAttempted": true,
  "idempotencyPassed": true,
  ...
}
```

### Read-path smoke result
```json
{
  "phase": "152H",
  "smoke": "hpg_vnm_mwg_deep_analysis_gating_read_path",
  "hpgVisibleInScreening": true,
  "vnmVisibleInScreening": true,
  "mwgVisibleInScreening": true,
  "hpgHasCompanyIndustry": true,
  "vnmHasCompanyIndustry": true,
  "mwgHasCompanyIndustry": true,
  "hpgHasFinancialStatement": true,
  "vnmHasFinancialStatement": true,
  "mwgHasFinancialStatement": true,
  "hpgHasCompanyBusinessProfile": true,
  "vnmHasCompanyBusinessProfile": true,
  "mwgHasCompanyBusinessProfile": true,
  "hpgAnalysisEligibilityMatchesPrerequisites": true,
  "vnmAnalysisEligibilityMatchesPrerequisites": true,
  "mwgAnalysisEligibilityMatchesPrerequisites": true,
  "fptVisibleButDisplayOnly": true,
  "msnVisibleButDisplayOnly": true,
  "vcbVisibleButDisplayOnly": true,
  ...
  "smokePassed": true
}
```

## Confirmations
* **DB writes**: Yes (only `ScreeningCandidate.analysisEligible` flag updates)
* **Company write**: No
* **MarketPrice write**: No
* **DataSource write**: No
* **Industry write**: No
* **CompanyIndustry write**: No
* **FinancialStatement write**: No
* **CompanyBusinessProfile write**: No
* **ScreeningCandidateMetric write**: No
* **Schema change**: No
* **Provider fetch**: No
* **UI change**: No
* **Assistant change**: No
* **HPG/VNM/MWG deep-analysis gating recomputed**: Yes
* **FPT/MSN/VCB remain display-only**: Yes
* **HSG/NKG untouched**: Yes
* **TVN absent**: Yes
* **raw external files copied into repo**: No
* **raw manual input committed**: No
* **IndustryMetric created**: No
* **benchmark/ranking/scoring created**: No
* **target price/fair value/upside/downside introduced**: No
* **forbidden advice wording introduced**: No
* **productionApprovedTrueCount**: 0

## Next Recommended Phase
Phase 152I — HPG/VNM/MWG Deep Module Read-Path Smoke For Business, Financials, Valuation, Risk, Assistant
