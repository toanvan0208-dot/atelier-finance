# Phase 152F - External HPG/VNM/MWG Deep Analysis Source Workspaces Dry Run

## Goal

Dry-run inspect two external review workspaces and determine whether they contain safe source-package data for later deep-analysis confirm-write for HPG, VNM, and MWG.

This phase is read-only. It does not write database rows, does not change schema, does not fetch providers, and does not copy raw external files into this repository.

## Scope

- Target tickers: HPG, VNM, MWG.
- External workspaces inspected:
  - `D:\AtelierFinanceFinancialsReview`
  - `D:\AtelierFinanceBusinessReview`
- Candidate domains inspected:
  - CompanyIndustry
  - FinancialStatement
  - Business profile / Hieu doanh nghiep
- Excluded from this phase:
  - DB writes
  - schema changes
  - provider fetch
  - UI or Assistant changes
  - Company, MarketPrice, DataSource, ScreeningCandidate, ScreeningCandidateMetric writes
  - CompanyIndustry, FinancialStatement, BusinessProfile writes
  - IndustryMetric, benchmark, ranking, scoring, stock attractiveness score

## Why This Phase Is Needed After 152E

Phase 152E confirmed that HPG/VNM/MWG are Screening-ready but not deep-analysis-ready because active PostgreSQL is still missing CompanyIndustry rows, FinancialStatement rows, and dedicated Business profile data. The deep-analysis gates were locked correctly, so Phase 152F checks whether the user's external review workspaces contain reviewed/manual source packages that can safely support a later bounded confirm-write.

## Files Changed

- `scripts/dry-run-external-hpg-vnm-mwg-deep-analysis-source-workspaces.ts`
- `docs/product/evidence/PHASE152F_EXTERNAL_HPG_VNM_MWG_DEEP_ANALYSIS_SOURCE_WORKSPACES_DRY_RUN.md`

No raw external files were copied into the repo.

## External Source Files Found

Financials workspace relevant files:

- `D:\AtelierFinanceFinancialsReview\FINANCIALS_DATA_PREP_HANDOFF.md`
- `D:\AtelierFinanceFinancialsReview\FINANCIALS_SCOPE3_FIELD_REQUIREMENTS.md`
- `D:\AtelierFinanceFinancialsReview\annual-reports\HPG_annual_report_2025.pdf`
- `D:\AtelierFinanceFinancialsReview\annual-reports\MWG_annual_report_2025.pdf`
- `D:\AtelierFinanceFinancialsReview\annual-reports\VNM_annual_report_2025.pdf`
- `D:\AtelierFinanceFinancialsReview\extracted\financials_review_HPG.md`
- `D:\AtelierFinanceFinancialsReview\extracted\financials_review_MWG.md`
- `D:\AtelierFinanceFinancialsReview\extracted\financials_review_VNM.md`
- `D:\AtelierFinanceFinancialsReview\financials_scope3_source_inventory.md`
- `D:\AtelierFinanceFinancialsReview\normalized\financials_scope3_normalized_candidate.csv`
- `D:\AtelierFinanceFinancialsReview\normalized\financials_scope3_normalized_candidate.md`

Business workspace relevant files:

- `D:\AtelierFinanceBusinessReview\BUSINESS_DATA_PREP_HANDOFF.md`
- `D:\AtelierFinanceBusinessReview\annual-reports\HPG_annual_report_2025.pdf`
- `D:\AtelierFinanceBusinessReview\annual-reports\MWG_annual_report_2025.pdf`
- `D:\AtelierFinanceBusinessReview\annual-reports\VNM_annual_report_2025.pdf`
- `D:\AtelierFinanceBusinessReview\business_review_upgrade_HPG.md`
- `D:\AtelierFinanceBusinessReview\business_review_upgrade_MWG.md`
- `D:\AtelierFinanceBusinessReview\business_review_upgrade_VNM.md`
- `D:\AtelierFinanceBusinessReview\business_financial_check_mapping.md`

## Storage / Schema Availability

| Storage area | Available | Note |
| --- | ---: | --- |
| CompanyIndustry | yes | Prisma model exists. |
| FinancialStatement | yes | Prisma model exists. |
| CompanyBusinessProfile | yes | Prisma model exists. |
| Business profile read-path | yes | `src/features/business/lib/load-company-business-profile.ts` exists. |

Storage gap:

- `capitalExpenditure` is present in the financial source package, but the current FinancialStatement schema does not expose a direct safe storage field for it. It was validated as source data but should not be forced into unrelated columns.

## Candidate Readiness By Ticker

| Ticker | CompanyIndustry prepared | CompanyIndustry ready | FinancialStatement prepared | FinancialStatement ready | Business profile prepared | Business profile ready |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| HPG | yes | yes | yes | yes | yes | yes |
| VNM | yes | yes | yes | yes | yes | yes |
| MWG | yes | yes | yes | yes | yes | yes |

## CompanyIndustry Dry-Run Result

| Ticker | Industry code | Ready |
| --- | --- | ---: |
| HPG | STEEL_MATERIALS | yes |
| VNM | CONSUMER_STAPLES_DAIRY | yes |
| MWG | RETAIL | yes |

No industry benchmark, ranking, scoring, or investment conclusion was created from these mappings.

## FinancialStatement Dry-Run Result

Validated fields for all three tickers:

- revenue
- grossProfit
- netIncome
- operatingCashFlow
- totalAssets
- equity
- totalDebt
- cashAndEquivalents
- eps
- sharesOutstanding

Validated but not stored in current schema:

- capitalExpenditure

Financial source rules passed:

- units were explicit and accepted
- EPS was positive
- missing values were not zero-filled
- totalDebt was not detected as total liabilities
- productionApproved remained false
- needsReview remained true

## Business Profile Dry-Run Result

Validated Business profile fields for all three tickers:

- flow
- mainCostItems
- nextFinancialChecks.checks
- keySignalsToWatch

Business profile source rules passed:

- source section / quote metadata was present
- data mode stayed reviewed_candidate or research_only
- needsReview stayed true
- productionApproved stayed false
- no forbidden advice wording was detected

## Missing Fields / Ambiguous Units / Blockers

| Ticker | Missing fields | Ambiguous units | Blockers |
| --- | --- | --- | --- |
| HPG | none | none | none |
| VNM | none | none | none |
| MWG | none | none | none |

## Guardrail Confirmation

- DB writes: no
- Schema change: no
- Provider fetch: no
- UI change: no
- Assistant change: no
- Company write: no
- MarketPrice write: no
- DataSource write: no
- ScreeningCandidate write: no
- ScreeningCandidateMetric write: no
- CompanyIndustry write: no
- FinancialStatement write: no
- BusinessProfile write: no
- HSG/NKG untouched: yes
- TVN absent: yes
- Raw external files copied into repo: no
- Raw manual input committed: no
- IndustryMetric created: no
- Benchmark/ranking/scoring created: no
- Stock attractiveness score created: no
- Forbidden advice wording introduced: no
- productionApprovedTrueCount: 0
- totalDebtMisuseDetected: false
- zeroFillDetected: false

## Validation Results

Commands run:

- `npx eslint scripts/dry-run-external-hpg-vnm-mwg-deep-analysis-source-workspaces.ts`
- `npx tsx scripts/dry-run-external-hpg-vnm-mwg-deep-analysis-source-workspaces.ts`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`

Dry-run summary:

- `phase=152F`
- `financialsWorkspaceFound=true`
- `businessWorkspaceFound=true`
- `blockedTickers=[]`
- `hpgReadyForCompanyIndustryConfirmWrite=true`
- `vnmReadyForCompanyIndustryConfirmWrite=true`
- `mwgReadyForCompanyIndustryConfirmWrite=true`
- `hpgReadyForFinancialStatementConfirmWrite=true`
- `vnmReadyForFinancialStatementConfirmWrite=true`
- `mwgReadyForFinancialStatementConfirmWrite=true`
- `hpgReadyForBusinessProfileConfirmWrite=true`
- `vnmReadyForBusinessProfileConfirmWrite=true`
- `mwgReadyForBusinessProfileConfirmWrite=true`
- `storageGaps=["capitalExpenditure"]`
- `productionApprovedTrueCount=0`
- `smokePassed=true`

## Next Recommended Phase

Phase 152G - HPG/VNM/MWG CompanyIndustry, FinancialStatement, and BusinessProfile confirm-write using the validated external source packages, while preserving the `capitalExpenditure` storage limitation unless a separate schema design phase is approved.
