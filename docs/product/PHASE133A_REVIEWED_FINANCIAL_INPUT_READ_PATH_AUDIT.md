# Phase 133A Reviewed Financial Input Read-Path Audit

## 1. Scope
- HEAD: `41c60292718e38c3dc4193c627f078ce999947ec Phase 132 fix business valuation ticker fidelity`
- Date/time: `2026-06-22T20:10:00Z`
- Audit-only: Yes
- No data write: Yes
- No runtime change: Yes

## 2. Fields and tickers audited
| Ticker | Field | DB/reviewed record status | Runtime Financials | Runtime Valuation | Runtime Risk | Finding |
|---|---|---|---|---|---|---|
| FPT | eps | Exists | null | N/A | N/A | DB has value but runtime mapper does not merge it |
| FPT | sharesOutstanding | Exists | null | N/A | N/A | DB has value but runtime mapper does not merge it |
| FPT | totalDebt | Exists | null | N/A | Missing | DB has value but runtime mapper does not merge it |
| MWG | eps | Exists | null | N/A | N/A | DB has value but runtime mapper does not merge it |
| MWG | sharesOutstanding | Exists | null | N/A | N/A | DB has value but runtime mapper does not merge it |
| MWG | totalDebt | Exists | null | N/A | Missing | DB has value but runtime mapper does not merge it |
| VNM | eps | Exists | null | N/A | N/A | DB has value but runtime mapper does not merge it |
| VNM | sharesOutstanding | Exists | null | N/A | N/A | DB has value but runtime mapper does not merge it |
| VNM | totalDebt | Exists | null | N/A | Missing | DB has value but runtime mapper does not merge it |

## 3. DB / reviewed records audit
| Ticker | Field | Exists | Value | Unit | Period | Source label | Data mode | Production approved |
|---|---|---|---|---|---|---|---|---|
| FPT | eps | Yes | 4944 | vnd_per_share | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| FPT | sharesOutstanding | Yes | 1471069183 | shares | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| FPT | totalDebt | Yes | 14947.354 | billion_vnd | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| MWG | eps | Yes | 2546 | vnd_per_share | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| MWG | sharesOutstanding | Yes | 1454644497 | shares | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| MWG | totalDebt | Yes | 27300.247 | billion_vnd | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| VNM | eps | Yes | 4130 | vnd_per_share | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| VNM | sharesOutstanding | Yes | 2089955445 | shares | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |
| VNM | totalDebt | Yes | 10059.066 | billion_vnd | 2024 | manual_reviewed_financial_statement_2024 | research_only | false |

*Note*: These values reside in their own standalone `FinancialStatement` records with `sourceLabel: manual_reviewed_financial_statement_2024`.

## 4. Financials read-path
- **What loader/mapper reads**: `loadFinancialsRuntimeData` specifically queries the database for `sourceLabel: phase109_controlled_local_financials` by default.
- **Which fields are present/null**: The `phase109` records only have `revenue`, `totalAssets`, `netIncome`, `equity`, `currentAssets`, `currentLiabilities`, `operatingCashFlow`, and `totalDebt`.
- **Missing reason if known**: 
  - `eps` and `sharesOutstanding` do not exist on the `phase109` records, so they become `null`.
  - The DB `totalDebt` field on `phase109` records actually stores `totalLiabilities`. The mapper (`financial-statement-read-service.ts`) detects this legacy storage and moves the value to `totalLiabilities`, leaving `totalDebt` explicitly `null`.
  - The runtime does not merge or read from the parallel `manual_reviewed_financial_statement_2024` records.

## 5. Valuation read-path
- **Inputs expected**: `eps`, `sharesOutstanding`, `equity`, `netIncome`, `revenue`, `operatingCashFlow`, `totalAssets`.
- **Inputs received**: Receives `null` for `eps` and `sharesOutstanding` from the Financials statement snapshot.
- **Why each metric is N/A or unavailable**: Valuation calculation components require `eps` and `sharesOutstanding` to proceed with per-share valuation logic. Since Financials provides `null`, the valuation remains blocked (`financials_runtime_partial` or `not_ready`) and outputs N/A.

## 6. Risk read-path
- **totalDebt vs totalLiabilities distinction**: The Financials read service correctly prevents using `totalLiabilities` as `totalDebt`. Risk sees `totalLiabilities` via the snapshot.
- **fields received**: Risk receives `totalLiabilities`, `totalAssets`, `equity`, `currentAssets`, `currentLiabilities`, `operatingCashFlow`, `netIncome`, `revenue`. It receives `null` for `totalDebt`.
- **missing/limitation**: Without `totalDebt`, leverage/solvency ratios requiring explicit interest-bearing debt cannot be calculated, leaving Risk limited/partial.

## 7. Browser/DOM smoke
| Route | Render | Ticker correct | Missing friendly | Raw leak | Overclaim | Notes |
|---|---|---|---|---|---|---|
| /workspace?module=financials&ticker=FPT | Yes | Yes | Yes | No | No | Fields render friendly missing data labels |
| /workspace?module=valuation&ticker=FPT | Yes | Yes | Yes | No | No | Blocked readiness gracefully handled |
| /workspace?module=risk&ticker=FPT | Yes | Yes | Yes | No | No | Uses totalLiabilities correctly |
| /workspace?module=financials&ticker=MWG | Yes | Yes | Yes | No | No | Fields render friendly missing data labels |
| /workspace?module=valuation&ticker=MWG | Yes | Yes | Yes | No | No | Blocked readiness gracefully handled |
| /workspace?module=risk&ticker=MWG | Yes | Yes | Yes | No | No | Uses totalLiabilities correctly |
| /workspace?module=financials&ticker=VNM | Yes | Yes | Yes | No | No | Fields render friendly missing data labels |
| /workspace?module=valuation&ticker=VNM | Yes | Yes | Yes | No | No | Blocked readiness gracefully handled |
| /workspace?module=risk&ticker=VNM | Yes | Yes | Yes | No | No | Uses totalLiabilities correctly |

*Note: UI components handle `insufficient_data` or `partial` states cleanly by showing friendly text without exposing underlying raw variable names (no raw leak).*

## 8. Root cause candidates
- **Candidate 1**: `loadFinancialsRuntimeData` defaults to querying only `phase109_controlled_local_financials`.
- **Candidate 2**: The `getFinancialStatementSeries` in `financial-statement-read-service.ts` correctly reads supplemental `Phase 116` missing fields from `manualImportRecords`, but it does not merge fields from parallel `FinancialStatement` records like `manual_reviewed_financial_statement_2024`.
- **Evidence**: DB queries confirm `manual_reviewed_financial_statement_2024` records exist and are correctly populated, but `loadFinancialsRuntimeData` never requests them.

## 9. Recommended Phase 133B
- **Exact minimal fix target**: Update `getFinancialStatementSeries` or `buildValues` in `src/lib/data-sources/financial-statement-read-service.ts` to merge `eps`, `sharesOutstanding`, and `totalDebt` from the `manual_reviewed_financial_statement_2024` DB records into the `phase109` statement series result. Alternatively, update the Phase 114 import to write these missing fields into `ManualImportRecord` sidecars (similar to Phase 116) so the existing `supplementalValuesFromManualRecords` pattern can pick them up cleanly.
- **Files likely involved**: 
  - `src/lib/data-sources/financial-statement-read-service.ts`
  - `src/features/financials/lib/load-financials-runtime-data.ts`
- **Tests needed**: Update or add a test in `financial-statement-read-service.test.ts` to verify merging of Phase 114 fields (`totalDebt`, `eps`, `sharesOutstanding`) into the main snapshot.
- **What remains out of scope**: Generating new UI or rewriting Valuation/Risk logic.

## 10. Constraints confirmation
- No DB write: Confirmed.
- No import: Confirmed.
- No schema change: Confirmed.
- No runtime change: Confirmed.
