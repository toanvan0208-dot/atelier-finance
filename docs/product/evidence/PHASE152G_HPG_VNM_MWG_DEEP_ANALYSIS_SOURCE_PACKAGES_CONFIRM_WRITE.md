# Phase 152G - HPG/VNM/MWG Deep Analysis Source Packages Confirm-Write

## Goal

Attempt a guarded confirm-write for validated external source package data for HPG, VNM, and MWG into the active PostgreSQL database.

Target write domains were:

- CompanyIndustry
- FinancialStatement
- CompanyBusinessProfile

## Scope

This phase added confirm-write and read-path smoke scripts only.

Allowed writes were restricted to CompanyIndustry, FinancialStatement, and CompanyBusinessProfile. The confirm-write script defaulted to dry-run and required `--confirm-write`.

Forbidden in this phase:

- schema change
- provider fetch
- UI change
- Assistant change
- Company write
- MarketPrice write
- DataSource write
- ScreeningCandidate write
- ScreeningCandidateMetric write
- IndustryMetric
- benchmark/ranking/scoring
- stock attractiveness score
- HSG/NKG mutation
- TVN inclusion
- raw external file copy into repo
- raw manual input commit

## Why This Phase Is Needed After 152F

Phase 152F found that the external Financials and Business review workspaces contain ready candidate packages for HPG, VNM, and MWG. Phase 152G attempted to move from source-package readiness to active PostgreSQL persistence, but only if all required schema dependencies already existed and could be used safely.

## Files Changed

- `scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts`
- `scripts/smoke-hpg-vnm-mwg-deep-analysis-source-packages-read-path.ts`
- `docs/product/evidence/PHASE152G_HPG_VNM_MWG_DEEP_ANALYSIS_SOURCE_PACKAGES_CONFIRM_WRITE.md`

## External Workspaces Inspected

- `D:\AtelierFinanceFinancialsReview`
- `D:\AtelierFinanceBusinessReview`

Source files used by path/name only:

- `D:\AtelierFinanceFinancialsReview\normalized\financials_scope3_normalized_candidate.csv`
- `D:\AtelierFinanceFinancialsReview\normalized\financials_scope3_normalized_candidate.md`
- `D:\AtelierFinanceFinancialsReview\extracted\financials_review_HPG.md`
- `D:\AtelierFinanceFinancialsReview\extracted\financials_review_VNM.md`
- `D:\AtelierFinanceFinancialsReview\extracted\financials_review_MWG.md`
- `D:\AtelierFinanceBusinessReview\business_review_upgrade_HPG.md`
- `D:\AtelierFinanceBusinessReview\business_review_upgrade_VNM.md`
- `D:\AtelierFinanceBusinessReview\business_review_upgrade_MWG.md`
- `D:\AtelierFinanceBusinessReview\business_financial_check_mapping.md`

No raw external file content was copied into the repo.

## Schema / Storage Notes

CompanyIndustry:

- Model exists.
- Write is blocked because active PostgreSQL does not currently contain required `Industry` rows for:
  - `STEEL_MATERIALS`
  - `CONSUMER_STAPLES_DAIRY`
  - `RETAIL`

FinancialStatement:

- Model exists.
- Write is blocked because FinancialStatement requires `sourceId`, but active PostgreSQL does not contain a semantically correct DataSource for the external financials review package.
- The only DataSource found before this phase was the existing market-price source, which is not safe to reuse for financial statements.

CompanyBusinessProfile:

- Model exists.
- Could be stored independently, but the script fail-closed the whole confirm-write because the phase goal is a bounded deep-analysis source package write across the required domains and required dependencies were missing.

## Storage Limitations

Validated but not stored because current FinancialStatement schema has no direct safe field:

- `capitalExpenditure`
- `cashAndEquivalents`

The script does not force either field into unrelated schema columns.

Business profile validated but not stored because current CompanyBusinessProfile schema has no direct safe field:

- `mainCostItems`

## Dry-Run Result

Dry-run command:

- `npx tsx scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts`

Summary:

- `companyIndustryCandidatesPrepared=3`
- `financialStatementCandidatesPrepared=3`
- `businessProfileCandidatesPrepared=3`
- `validationBlockers=[]`
- `dependencyBlockers=["HPG_industry_dependency_missing","VNM_industry_dependency_missing","MWG_industry_dependency_missing","financial_statement_dataSource_dependency_missing"]`
- `blockedTickers=["HPG","VNM","MWG"]`
- `capitalExpenditureValidatedButNotStored=true`
- `cashAndEquivalentsValidatedButNotStored=true`
- `totalDebtMisuseDetected=false`
- `zeroFillDetected=false`
- `productionApprovedTrueCount=0`
- `smokePassed=false`

## Confirm-Write Result

Confirm-write command:

- `npx tsx scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts --confirm-write`

Result:

- No DB write was attempted because dependency blockers remained.
- `companyIndustryRowsWritten=0`
- `financialStatementRowsWritten=0`
- `businessProfileRowsWritten=0`
- `companyIndustryRowsSkipped=3`
- `financialStatementRowsSkipped=3`
- `businessProfileRowsSkipped=3`
- `dbWriteAttempted=false`
- `nonAllowedWritesDetected=false`
- `productionApprovedTrueCount=0`

This is an intentional fail-closed result, not a successful data persistence.

## Idempotency Rerun Result

Rerun command:

- `npx tsx scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts --confirm-write`

Result:

- `idempotencyPassed=true`
- no duplicate rows created
- no rows written
- no non-allowed writes detected

## Read-Path Smoke Result

Smoke command:

- `npx tsx scripts/smoke-hpg-vnm-mwg-deep-analysis-source-packages-read-path.ts`

Result:

- `hpgCompanyIndustryPresent=false`
- `vnmCompanyIndustryPresent=false`
- `mwgCompanyIndustryPresent=false`
- `hpgFinancialStatementPresent=false`
- `vnmFinancialStatementPresent=false`
- `mwgFinancialStatementPresent=false`
- `hpgBusinessProfilePresent=false`
- `vnmBusinessProfilePresent=false`
- `mwgBusinessProfilePresent=false`
- `capitalExpenditureNotForceStored=true`
- `cashAndEquivalentsNotForceStored=true`
- `totalDebtMisuseDetected=false`
- `zeroFillDetected=false`
- `productionApprovedTrueCount=0`
- `hsgNkgUntouched=true`
- `tvnPresent=false`
- `smokePassed=false`

The smoke correctly reports missing rows because the confirm-write was blocked before DB writes.

## Rows Written By Ticker And Domain

| Ticker | CompanyIndustry | FinancialStatement | BusinessProfile |
| --- | ---: | ---: | ---: |
| HPG | 0 | 0 | 0 |
| VNM | 0 | 0 | 0 |
| MWG | 0 | 0 | 0 |

## CompanyIndustry Values Prepared

| Ticker | Industry code |
| --- | --- |
| HPG | STEEL_MATERIALS |
| VNM | CONSUMER_STAPLES_DAIRY |
| MWG | RETAIL |

## FinancialStatement Values Prepared

Stored-field candidates, all units in VND except EPS and shares:

| Ticker | revenue | grossProfit | netIncome | operatingCashFlow | totalAssets | equity | totalDebt | eps | sharesOutstanding |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| HPG | 156116094618482 | 24497788183182 | 15514931571606 | 17365859056591 | 257899200817547 | 131220010876575 | 92174151302217 | 1973 | 7675465855 |
| VNM | 54248830000000 | 15542110000000 | 8506546000000 | 8948878000000 | 56091826000000 | 35569652000000 | 9456645000000 | 4070 | 2089955445 |
| MWG | 155928145619367 | 31001877399821 | 7033730770169 | 6096140690215 | 83945619612034 | 33176117374577 | 29930942961668 | 4774 | 1468456763 |

Validated but not stored:

- HPG/VNM/MWG `cashAndEquivalents`
- HPG/VNM/MWG `capitalExpenditure`

## BusinessProfile Fields Prepared

Prepared and schema-mapped:

- `flow` -> `businessDescription` and `businessModelSummary`
- `nextFinancialChecks.checks` plus `keySignalsToWatch` -> `businessRiskNotes`

Validated but not stored:

- `mainCostItems`

## Source / Caveat Summary

- Source mode remains external manual/review workspace.
- Data mode remains `research_only` / reviewed candidate semantics.
- `needsReview=true` where schema supports it.
- `productionApproved=false` where schema supports it.
- No buy/sell/hold, target price, fair value, upside/downside, recommendation, ranking, scoring, or benchmark was introduced.

## Guardrail Confirmation

- DB writes: no, fail-closed before write because dependencies are missing
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
- IndustryMetric created: no
- Benchmark/ranking/scoring created: no
- HSG/NKG untouched: yes
- TVN absent: yes
- Raw external files copied into repo: no
- Raw manual input committed: no
- Forbidden advice wording introduced: no
- productionApprovedTrueCount: 0
- totalDebtMisuseDetected: false
- zeroFillDetected: false

## Validation Results

Commands run:

- `npx eslint scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts scripts/smoke-hpg-vnm-mwg-deep-analysis-source-packages-read-path.ts`
- `npx tsx scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts`
- `npx tsx scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts --confirm-write`
- `npx tsx scripts/confirm-write-hpg-vnm-mwg-deep-analysis-source-packages.ts --confirm-write`
- `npx tsx scripts/smoke-hpg-vnm-mwg-deep-analysis-source-packages-read-path.ts`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`

Lint, Prisma validation/generation, and typecheck passed.

Read-path smoke reported `smokePassed=false` because no rows were written after dependency guard blocked the confirm-write.

## Next Recommended Phase

Phase 152G-fix or 152H-prep - bounded prerequisite confirm-write for:

1. Reviewed `Industry` rows for `STEEL_MATERIALS`, `CONSUMER_STAPLES_DAIRY`, and `RETAIL`, if not already present in the target PostgreSQL environment.
2. A semantically correct `DataSource` row for the external financials review workspace.

After those dependencies exist, rerun the Phase 152G confirm-write script to persist CompanyIndustry, FinancialStatement, and CompanyBusinessProfile rows.
