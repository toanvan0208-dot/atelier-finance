# Phase 152K-fix - Business UI Runtime Ticker Read-Path Fix

## Screenshot Issue Summary

Manual browser review showed the Business / Hieu doanh nghiep page for HPG still rendering the old prototype fallback:

- "Chua co du lieu mo hinh kinh doanh cho ma HPG."
- "Prototype hien co du lieu mau MWG. Hay chon MWG..."

That contradicted the runtime/database state where CompanyBusinessProfile rows exist for HPG, VNM, and MWG.

## Root Cause

`BusinessPage.tsx` was still selecting UI content from the old static `businessJourney.data.ts` / `business-company-selection` path. HPG was not present in that old journey map, so the component fell into the obsolete MWG-only prototype fallback instead of reading `CompanyBusinessProfile` through the real runtime read-path.

The stale fallback copy also still lived in `businessJourney.data.ts`.

## Files Changed

- `src/features/business/components/BusinessPage.tsx`
- `src/features/business/data/businessJourney.data.ts`
- `scripts/smoke-business-ui-runtime-ticker-read-path.ts`
- `docs/product/evidence/PHASE152K_FIX_BUSINESS_UI_RUNTIME_TICKER_READ_PATH.md`

## Fix Summary

- Added a runtime Business profile fetch in `BusinessPage.tsx` using `/api/companies/{ticker}`.
- If the selected ticker has a stored `CompanyBusinessProfile`, the page now renders the real profile data instead of the old static journey fallback.
- HPG, VNM, and MWG now render source-backed business profile sections:
  - business model / description
  - products or services
  - next checks / risk notes
  - source and caveats
- Replaced the obsolete MWG-only prototype fallback text with neutral missing-data copy.
- Did not fake content for unsupported or display-only tickers.

## Before Behavior

For HPG, Business UI showed:

- old missing-state copy
- old MWG-only prototype guidance
- no real HPG CompanyBusinessProfile content

## After Behavior

For HPG/VNM/MWG:

- Business UI reads the runtime CompanyBusinessProfile path.
- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`
- copy explicitly says the section is not investment advice and not a valuation/risk benchmark.

For FPT/MSN/VCB:

- no Business profile is fabricated.
- they remain display-only / guarded in the smoke result because they do not have CompanyBusinessProfile rows and do not have analysis eligibility.

## Smoke Summary

Command:

- `npx tsx scripts/smoke-business-ui-runtime-ticker-read-path.ts`

Result:

- `hpgBusinessProfilePresent=true`
- `vnmBusinessProfilePresent=true`
- `mwgBusinessProfilePresent=true`
- `hpgBusinessProfileRendersRealData=true`
- `vnmBusinessProfileRendersRealData=true`
- `mwgBusinessProfileRendersRealData=true`
- `oldPrototypeFallbackDetected=false`
- `fptMsnVcbRemainDisplayOnlyGuarded=true`
- `benchmarkCreated=false`
- `rankingCreated=false`
- `stockAttractivenessScoreCreated=false`
- `targetPriceFairValueUpsideDownsideIntroduced=false`
- `forbiddenAdviceDetected=false`
- `productionApprovedTrueCount=0`
- `dbWriteAttempted=false`
- `schemaChanged=false`
- `providerFetchAttempted=false`
- `smokePassed=true`

## Validation

Commands run:

- `npx eslint src/features/business/components/BusinessPage.tsx src/features/business/data/businessJourney.data.ts scripts/smoke-business-ui-runtime-ticker-read-path.ts`
- `npx tsx scripts/smoke-business-ui-runtime-ticker-read-path.ts`
- `npx prisma validate`
- `npx prisma generate`
- `npm run typecheck`

All passed.

## Guardrail Confirmation

- DB write: no
- Schema change: no
- Provider fetch: no
- Company write: no
- MarketPrice write: no
- DataSource write: no
- Industry write: no
- CompanyIndustry write: no
- FinancialStatement write: no
- CompanyBusinessProfile write: no
- ScreeningCandidate write: no
- ScreeningCandidateMetric write: no
- IndustryMetric: no
- Benchmark/ranking/scoring: no
- Stock attractiveness score: no
- Target price/fair value/upside/downside: no
- Buy/sell/hold recommendation: no
- Raw external file copy: no
- Raw manual input commit: no
- productionApprovedTrueCount: 0

## Next Recommended Phase

Phase 152K - Manual Browser Screenshot Evidence For Screening And HPG/VNM/MWG Deep Modules.
