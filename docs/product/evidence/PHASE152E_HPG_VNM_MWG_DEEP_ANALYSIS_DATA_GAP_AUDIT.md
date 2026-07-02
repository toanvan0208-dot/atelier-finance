# Phase 152E — HPG/VNM/MWG Deep Analysis Data Gap Audit

## Goal
Audit deep-analysis readiness gaps for HPG, VNM, and MWG in the current PostgreSQL database without performing any data writes, schema changes, or provider fetches.

## Scope
- Read-only audit via Prisma.
- Check existence and eligibility of `Company`, `MarketPrice`, `CompanyIndustry`, `FinancialStatement`, and Business Profile.
- Evaluate module-level readiness (Screening, Hiểu doanh nghiệp, Báo cáo tài chính, Định giá, Rủi ro, AI context).
- Investigate the perceived inconsistency regarding `CompanyIndustry` existence.
- Strictly adhere to safety protocols (no DB writes, no forbidden investment advice wording, `productionApprovedTrueCount=0`).

## Why this audit is needed after 152D
Phase 152D revealed that `analysisEligible` evaluated to `false` for HPG, VNM, and MWG. This outcome contrasted with earlier context from Phases 151U/151Y, which suggested `CompanyIndustry` rows existed for these tickers (e.g., HPG as STEEL_MATERIALS). This audit explicitly queries the active PostgreSQL instance to determine if the data is genuinely missing, fails eligibility checks, or if there is a read-path mismatch.

## HPG CompanyIndustry Inconsistency Investigation
- **Finding**: `CompanyIndustry` rows for HPG (as well as VNM and MWG) are genuinely missing in the current active PostgreSQL database.
- **Reason**: The data may exist in local JSON snapshot files or an earlier isolated context, but it has not been confirm-written into this specific database environment.
- **Result**: No read-path mismatch or bug is suspected. The `analysisEligible=false` evaluation from Phase 152D is mathematically correct given the missing underlying relational records.

## Current Data Availability by Ticker
| Ticker | Company Present | MarketPrice Present | CompanyIndustry Present | FinancialStatement Present | BusinessProfile Present |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **HPG** | Yes | Yes | No | No | No |
| **VNM** | Yes | Yes | No | No | No |
| **MWG** | Yes | Yes | No | No | No |

## Current Gating Result by Ticker
| Ticker | Analysis Eligible (Current) | Blockers |
| :--- | :--- | :--- |
| **HPG** | False | `missing_company_industry`, `missing_financial_statement` |
| **VNM** | False | `missing_company_industry`, `missing_financial_statement` |
| **MWG** | False | `missing_company_industry`, `missing_financial_statement` |

## Module Readiness Table
| Module | HPG | VNM | MWG |
| :--- | :--- | :--- | :--- |
| **Screening** (Display Only) | Ready | Ready | Ready |
| **Hiểu doanh nghiệp** (Business) | Not Ready | Not Ready | Not Ready |
| **Báo cáo tài chính** (Financials) | Not Ready | Not Ready | Not Ready |
| **Định giá** (Valuation) | Not Ready | Not Ready | Not Ready |
| **Rủi ro** (Risk) | Not Ready | Not Ready | Not Ready |
| **AI Context** (Assistant) | Not Ready | Not Ready | Not Ready |

## Missing Data List
For HPG, VNM, and MWG, the following entities are strictly required to ungate deep analysis:
1. `CompanyIndustry`: Needs industry mapping and context.
2. `FinancialStatement`: Needs at least safe fundamentals (revenue, net income, equity, etc.).
3. **Business Profile / Description**: Currently no dedicated schema model or dataset exists for populating the qualitative "Hiểu doanh nghiệp" overview.

## Additional Manual Reviewed Source Packages Needed
Yes. Because the `CompanyIndustry` and `FinancialStatement` data is absent from the DB, we need to ingest and confirm-write the corresponding curated source packages (JSON files) into the database to unblock these tickers. A qualitative business profile data source may also need to be designed and populated.

## Confirmations
- **DB Writes**: No writes attempted.
- **Schema Change**: No.
- **Provider Fetch**: No.
- **UI Change**: No.
- **Assistant Change**: No.
- **HSG / NKG Untouched**: Yes (Verified present in DB).
- **TVN Absent**: Yes.
- **Raw JSON Committed**: No.
- **IndustryMetric Created**: No.
- **Benchmark / Ranking / Scoring Created**: No.
- **Forbidden Advice Wording**: None detected.
- **productionApprovedTrueCount**: 0.

## Next Recommended Phase
**Phase 152F — HPG/VNM/MWG Reviewed Source Package Dry Run**
