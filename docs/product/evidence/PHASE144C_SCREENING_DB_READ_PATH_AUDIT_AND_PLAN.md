# Phase 144C: Screening DB/Read-Path Audit and Safe Integration Plan

## Overview
This document outlines the audit of the current `Screening` module to prepare for safe DB read-path integration. 
The Screening module is intended to serve as a "Data Readiness Filter" rather than a stock picker or recommendation engine.

## Current Screening Architecture
- **UI Implemented:** Yes, via `src/features/screening/components/ScreeningPage.tsx`
- **Data Source:** Currently using mock/static data from `src/features/screening/data/screeningRedesign.data.ts`
- **Current Scope:** Only 3 tickers (FPT, MWG, VNM) are mocked in the data file.
- **Guardrails Status:** The mock UI already adheres strictly to guardrails (e.g., "Đây không phải bảng xếp hạng cổ phiếu tốt/xấu", "Screener chỉ lọc theo mức độ đủ dữ liệu"). No buy/sell/hold wording is present.

## DB / Runtime Field Mapping
To transition from `screeningRedesign.data.ts` to live staging PostgreSQL data, the following mapping is established:

| Screening Field | Current Mock Source | Target Runtime Source | Risk / Notes |
|---|---|---|---|
| `ticker`, `companyName`, `industry`, `sector` | `buildCandidate` arguments | `loadBusinessRuntimeData` / `Company` model | Safe. Data exists for FPT/HPG/VNM/MSN/MWG. |
| `eps`, `totalDebt`, `sharesOutstanding` | `buildCandidate` checks | `loadFinancialsRuntimeData` | Needs fallback handling (`null` if missing). No missing-to-zero. |
| `pe`, `pb` readiness | `canCalculatePE`, `canCalculatePB` | `buildControlledValuationIntegrationBoundary` (`canCalculatePe`, `canCalculatePb`) | Read directly from the valuation boundary. |
| `risk_readiness` | `canAssessRisk` | `buildRiskDeskData` or custom check | Safe. Only determines if enough fields exist to run risk logic. |
| `sourceStatus`, `sourceAsOf` | `sourceStatus`, `sourceAsOf` | `financialsData.source` metadata | Must clearly state `research_only` and not `production-approved`. |

## Approved Ticker Readiness
Based on the Phase 144B Checklist and recent data audits:
- **FPT, HPG, VNM, MSN, MWG:** Have base `Company`, `BusinessProfile`, and `FinancialStatement` data loaded via seeder scripts in `research_only` mode. They are ready to be integrated into a screening data engine.
- **VCB:** Remains explicitly excluded. Screening should filter this out or mark it as `Chưa đủ dữ liệu` / `not_supported`.

## Guardrail Observations
- The current implementation correctly frames screening as a **readiness funnel** (Cửa 1: Thông tin doanh nghiệp, Cửa 2: Ngành, Cửa 3: Tài chính, v.v.).
- There are no ranking mechanics or "Top 10 Stocks to Buy". 
- Missing fields logic (`N/A`) is accounted for in the UI. 

## Integration Decision
**Classification: B. Can integrate partially as screening readiness table using existing runtime loaders.**

No new DB schema is required. The Screening data engine (`loadScreeningRuntimeData.ts`) can be constructed purely by composing existing modular runtime loaders:
1. `loadBusinessRuntimeData`
2. `loadFinancialsRuntimeData`
3. `buildControlledValuationIntegrationBoundary`

## Recommended Next Phase
**Phase 144D: Screening DB Read-Path Integration**
- Create `src/features/screening/lib/load-screening-runtime-data.ts`.
- Fetch `Company` list from DB where `dataMode` is `research_only`.
- Run parallel runtime loads to map actual values into `RedesignedScreeningCandidate`.
- Remove `screeningRedesign.data.ts` mock instances where applicable.
- Add `scripts/smoke-staging-screening-read-path.ts`.

## Execution Status
- **DB write:** No
- **Data seed/import:** No
- **Schema migration:** No
- **Production deploy:** No
- **Validation:** Clean. (Local `npm test` infrastructure errors persist but are classified and unrelated to read paths).
- **readyForNextPhase:** Yes
