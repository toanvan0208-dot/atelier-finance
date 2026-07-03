# Phase 153A - Valuation Module Reality Audit For HPG/VNM/MWG

## Goal

Audit the current Valuation module reality for HPG, VNM, and MWG before making improvements. This phase is audit-only and does not introduce valuation improvements, provider fetches, schema changes, DB writes, target prices, fair values, upside/downside, recommendations, rankings, benchmark logic, scoring, or stock attractiveness scores.

## Scope

- Read-only DB/read-path inspection.
- No DB writes.
- No provider fetch.
- No schema change.
- No Company, MarketPrice, DataSource, Industry, CompanyIndustry, FinancialStatement, CompanyBusinessProfile, ScreeningCandidate, ScreeningCandidateMetric, or IndustryMetric writes.
- Missing values remain null, N/A, needs_review, or "Chua du du lieu"; no zero-fill policy is introduced.

## Current Valuation Data Sources

The live Valuation page builds runtime valuation data through:

- `src/features/valuation/components/ValuationPage.tsx`
- `src/lib/data-sources/valuation-api-client.ts`
- `src/app/api/companies/[ticker]/financials/route.ts`
- `src/app/api/companies/[ticker]/market-prices/route.ts`
- `src/lib/database/services/financial-statement-service.ts`
- `src/lib/database/services/market-price-service.ts`
- `src/features/valuation/lib/build-valuation-desk-data.ts`
- `src/features/valuation/lib/controlled-valuation-calculation.ts`

The read path uses latest persisted FinancialStatement data for EPS, equity, revenue, net income, and sharesOutstanding, plus latest persisted MarketPrice data for close/adjusted close price. The API metadata marks fallback as false. The UI also shows research-only / not-production-approved caveats through `DataQualityBanner`, `ValuationFinancialsRuntimeNote`, and `ControlledValuationCalculationPanel`.

## HPG/VNM/MWG Valuation Readiness

Run:

```bash
npx tsx scripts/audit-valuation-module-hpg-vnm-mwg.ts
```

The script prints a JSON audit summary with:

- `hpgValuationDataPresent`
- `vnmValuationDataPresent`
- `mwgValuationDataPresent`
- close price presence
- EPS presence
- safe P/E computability
- safe P/B computability
- forbidden output/wording detections
- display-only guard status for FPT/MSN/VCB
- `productionApprovedTrueCount`

Latest audit result from this phase:

| Ticker | Valuation data | Close price | EPS | P/E safely computable | P/B safely computable | Financial source | Market source | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HPG | yes | yes | yes | yes | yes | External financials review workspace | VNStock market price snapshot | needs_review |
| VNM | yes | yes | yes | yes | yes | External financials review workspace | VNStock market price snapshot | needs_review |
| MWG | yes | yes | yes | yes | yes | External financials review workspace | VNStock market price snapshot | needs_review |

## P/E Computability

P/E is considered computable only when:

- Market price is present and positive.
- EPS is present and positive.

The controlled calculation helper returns `not_applicable` when EPS is non-positive and `insufficient_data` when EPS or market price is missing/non-positive. No missing EPS is substituted with 0.

## P/B Computability

P/B is considered computable only when:

- Market price is present and positive.
- Equity is present and positive.
- Shares outstanding is present and positive.
- BVPS can be derived safely from equity / sharesOutstanding.

The controlled calculation helper returns `not_applicable` when equity is non-positive and `insufficient_data` when equity, sharesOutstanding, or market price is missing/non-positive. No missing equity or sharesOutstanding value is substituted with 0.

## Missing Fields

The audit script reports missing fields by ticker from persisted financial/market records plus derived valuation requirements:

- `eps`
- `close_price`
- `equity`
- `shares_outstanding`
- `financial_statement`
- `market_price`

UI missing fields are visible through the DataQuality banner and the controlled calculation input/metric table. Missing values render as "Chua du du lieu" or N/A wording, not as a computed valuation.

Latest audit result: no derived missing valuation fields were reported for HPG, VNM, or MWG in the current local DB snapshot. The source/readiness state remains `research_only` / `needs_review`, so the UI must continue to show caveats even when ratios are computable.

## UI Wording Audit

The user-facing Valuation UI currently emphasizes:

- Valuation ratios are reference/educational data checks.
- Current data is research-only and not production approved.
- The page is not investment advice.
- Advanced valuation models remain blocked when required inputs are absent.
- Missing values remain unavailable/N/A.

The audit scans runtime valuation source files for target price, fair value-as-output, upside/downside, buy/sell/hold recommendations, benchmark, ranking, scoring, and stock-attractiveness wording. Internal blocked metric identifiers are treated as guardrail labels, not as user-facing valuation output.

Latest audit result:

- `targetPriceDetected=false`
- `fairValueDetected=false`
- `upsideDownsideDetected=false`
- `buySellHoldDetected=false`
- `benchmarkDetected=false`
- `rankingDetected=false`
- `scoringDetected=false`
- `stockAttractivenessDetected=false`

## Fake/Mock/Fallback Audit

The current valuation API read path uses persisted local DB routes and marks API fallback as false. The page explicitly blocks ticker mismatch and does not use another ticker's data as fallback.

No fake/mock/sample/fallback-as-real data should be presented for HPG, VNM, or MWG. If a ticker is missing required persisted records, the UI should show empty/insufficient states rather than substitute sample data.

Latest audit result:

- `fakeFallbackDetected=false`
- `mockDataDetected=false`
- `zeroFillDetected=false`

## Guardrail Confirmation

FPT, MSN, and VCB remain display-only if their ScreeningCandidate rows have `analysisEligible=false`. They must not receive fake deep valuation data through this phase.

The audit script confirms:

- `fptMsnVcbRemainDisplayOnly`
- `productionApprovedTrueCount=0`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `providerFetchAttempted=false`

Latest audit result:

- `fptMsnVcbRemainDisplayOnly=true`
- `productionApprovedTrueCount=0`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `providerFetchAttempted=false`
- `smokePassed=true`

## Recommended Next Phase

Phase 153B - Valuation Module Safe Ratio Cards And Caveat UI

Recommended follow-up:

- Keep the same read-only guarded data path.
- Improve ratio cards for P/E, P/B, BVPS, market cap, and P/S.
- Make caveats easier for low-financial-literacy users.
- Preserve null/N/A behavior for missing data.
- Continue to block target price, fair value, upside/downside, recommendation, benchmark, ranking, scoring, and attractiveness outputs.
