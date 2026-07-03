# Phase 157C - Industry Read-Path And UI Wiring

## Goal
Wire the Industry UI to the existing runtime Industry read-path so the product can display DB-backed company-to-industry mapping before any Layer 4 qualitative context work.

## Scope
- UI read-path wiring only.
- No DB writes.
- No schema change.
- No provider fetch.
- No new data import.
- No Industry, IndustryMetric, CompanyIndustry, or IndustryContext writes.
- No Assistant prompt change.
- No benchmark, ranking, scoring, trading signal, stock attractiveness score, buy/sell/hold recommendation, target price, fair value, upside, or downside.

## What Changed
- `IndustryPage` now consumes `initialIndustryContexts` instead of ignoring it.
- Added a read-path panel showing DB-backed taxonomy mapping for the currently selected Industry option.
- The panel displays ticker, industry code, display name, role type, source label, data mode, and qualitative-context availability.
- Missing qualitative context remains explicit: the UI says source-backed qualitative context is not available yet.
- Added a regression test proving the page renders `HPG -> STEEL_MATERIALS` from runtime payload and does not promote missing `IndustryContext` as available.

## Current Layer After Fix
`scripts/audit-industry-current-layer.ts` now reports:
- `industryPageReadsInitialRuntime`: true
- `industryPageReadsCompanyIndustryMapping`: true
- `showsOnlyTaxonomyLabels`: false
- `layer1Complete`: true
- `layer2Complete`: true
- `layer3Complete`: true
- `layer4Complete`: false
- `currentIndustryLayer`: 3

## DB Snapshot
Read-only audit result:
- `Industry` rows: 3
- `CompanyIndustry` rows: 3
- `IndustryContext` rows: 0
- `IndustryContextProvenance` rows: 0
- `IndustryMetric` rows: 0
- `productionApprovedTrueCount`: 0

Target mappings still found:
- `HPG -> STEEL_MATERIALS`
- `VNM -> CONSUMER_STAPLES_DAIRY`
- `MWG -> RETAIL`

## Remaining Blockers To Layer 4
- `IndustryContext` qualitative rows are missing.
- `IndustryContextProvenance` source rows are missing.
- Existing static Industry educational copy must not be promoted to reviewed/source-backed context.

## Validation
- `npx eslint src/features/industry/components/IndustryPage.tsx src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `npx vitest run src/features/industry/components/__tests__/IndustryCompassSections.test.ts`
- `npx tsx scripts/audit-industry-current-layer.ts`
- `npm run typecheck`

## Safety Confirmations
- DB writes: no
- Schema change: no
- Provider fetch: no
- IndustryMetric introduced: no
- benchmark/ranking/scoring introduced: no
- buy/sell/hold introduced: no
- target price/fair value/upside/downside introduced: no
- stock attractiveness introduced: no
- fake/mock/fallback-as-real introduced: no
- `productionApprovedTrueCount`: 0

## Recommended Next Phase
Phase 157D - Industry Layer 4 Qualitative Context Dry Run
