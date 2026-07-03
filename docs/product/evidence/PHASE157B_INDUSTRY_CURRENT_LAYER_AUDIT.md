# Phase 157B - Industry Current Layer Audit

## Goal
Audit the current Industry module state and determine which layer it has actually reached before starting any new Industry Layer 4 work.

## Scope
- Audit only.
- No DB writes.
- No schema change.
- No provider fetch.
- No new data import.
- No Industry, IndustryMetric, CompanyIndustry, or IndustryContext writes.
- No UI or Assistant prompt changes.
- No benchmark, ranking, scoring, stock attractiveness score, buy/sell/hold recommendation, trading signal, target price, fair value, upside, or downside.

## Layer Definitions
- Layer 1: Industry taxonomy exists.
- Layer 2: Company-to-industry mapping exists.
- Layer 3: Industry is wired into product read-paths and visible user-facing context or routing.
- Layer 4: Source-backed qualitative industry context exists, research_only and needsReview, with provenance.
- Layer 5: Quantitative industry metrics/comparison. Not in scope.

## Schema Audit
- `Industry` model exists with taxonomy fields.
- `CompanyIndustry` model exists with ticker-to-industry mapping and source fields.
- `IndustryContext` model exists with qualitative context fields.
- `IndustryContextProvenance` model exists with source/provenance fields.
- `IndustryMetric` model does not exist.
- `IndustryQualitativeContext` model does not exist as a separate model.
- `DataSource` has no direct Industry relation; industry source labels/URLs are stored on industry-related models.

Script fields:
- `industryTaxonomyStorageExists`: true
- `companyIndustryMappingStorageExists`: true
- `industryContextStorageExists`: true
- `industryMetricStorageExists`: false
- `qualitativeContextSchemaMissing`: true
- `dataSourceIndustryRelationExists`: false

## DB Audit
Read-only counts from `npx tsx scripts/audit-industry-current-layer.ts`:
- `Industry` rows: 3
- `CompanyIndustry` rows: 3
- `IndustryContext` rows: 0
- `IndustryContextProvenance` rows: 0
- `IndustryMetric` rows: 0
- `productionApprovedTrueCount`: 0

Target industry rows found:
- `STEEL_MATERIALS`: found, `research_only`, `productionApproved=false`, `needsReview=true`
- `RETAIL`: found, `research_only`, `productionApproved=false`, `needsReview=true`
- `CONSUMER_STAPLES_DAIRY`: found, `research_only`, `productionApproved=false`, `needsReview=true`

Target company mappings found:
- `HPG -> STEEL_MATERIALS`: found
- `VNM -> CONSUMER_STAPLES_DAIRY`: found
- `MWG -> RETAIL`: found

## UI/API/Read-Path Audit
- Industry page exists: true.
- Workspace server load calls `loadIndustryContextRuntimeByTicker` for several tickers.
- `load-industry-context.ts` reads `CompanyIndustry`, `Industry`, `IndustryPeerGroup`, `IndustryContext`, and `IndustryContextProvenance` safely.
- `AppShell` passes `initialIndustryContexts` into `IndustryPage`.
- `IndustryPage` accepts the prop but does not consume it in rendering.
- The current Industry UI renders from `industryCompassData`, static research-only guidance, not live DB context rows.
- Because the UI does not consume the runtime payload, Layer 3 is not complete.

Script fields:
- `industryUiExists`: true
- `industryApiExists`: true
- `industryReadPathExists`: true
- `industryPageReadsInitialRuntime`: false
- `industryPageReadsCompanyIndustryMapping`: false
- `showsOnlyTaxonomyLabels`: true

## Assistant Context Audit
- Assistant/global context contains Industry references and broad constraints.
- The current screen context builder primarily exposes financials context and generic module/ticker facts.
- No new Assistant prompt changes were made in this phase.
- The audit script reports `assistantIndustryContextExists=true` because Industry context references exist in Assistant-adjacent code, but the Industry page still does not consume runtime Industry payloads.

## Guardrail Audit
The broad word scan detects existing risky strings in static educational copy and guardrail/safety language, including terms such as target price/fair value/upside/downside in negative constraints and words such as "hap dan" or "manh hon" in educational thesis copy.

Important conclusion:
- No new buy/sell/hold language was introduced by this phase.
- No target price/fair value/upside/downside feature was introduced by this phase.
- No benchmark/ranking/scoring feature was introduced by this phase.
- No stock attractiveness score was introduced by this phase.
- No IndustryMetric was introduced.
- `productionApprovedTrueCount` remains 0.

Script fields:
- `demoMockFallbackIndustryContentDetected`: false
- `benchmarkRankingScoringDetected`: false
- `forbiddenAdviceDetected`: true, from broad static/safety word scan
- `buySellHoldDetected`: true, from broad static/safety word scan
- `targetPriceFairValueUpsideDownsideDetected`: true, from broad static/safety word scan
- `stockAttractivenessDetected`: true, from broad static educational wording

## Current Layer Conclusion
Current Industry module layer: **Layer 2**.

Per target industry:
- `STEEL_MATERIALS`: Layer 1 complete, Layer 2 complete, Layer 3 incomplete, Layer 4 incomplete.
- `RETAIL`: Layer 1 complete, Layer 2 complete, Layer 3 incomplete, Layer 4 incomplete.
- `CONSUMER_STAPLES_DAIRY`: Layer 1 complete, Layer 2 complete, Layer 3 incomplete, Layer 4 incomplete.

Module overall:
- `layer1Complete`: true
- `layer2Complete`: true
- `layer3Complete`: false
- `layer4Complete`: false
- `currentIndustryLayer`: 2

## What Is Already Complete
- Target Industry taxonomy rows exist for all three target industries.
- CompanyIndustry mappings exist for HPG, VNM, and MWG.
- Storage for future source-backed qualitative context exists through `IndustryContext` and `IndustryContextProvenance`.
- No production-approved Industry rows were found.
- No IndustryMetric model or metric rows were introduced.

## Missing Before Layer 4
- Industry UI must consume runtime Industry payloads instead of only static compass data.
- CompanyIndustry mapping must be shown or routed through the product read-path.
- IndustryContext rows are missing.
- IndustryContextProvenance rows are missing.
- Qualitative context is not yet source-backed for the target industries.
- Existing static educational copy must not be promoted to reviewed/source-backed Layer 4 context.

## Recommended Next Phase
Because the module is currently Layer 1/2 only:

**Phase 157C - Industry Read-Path And UI Wiring Audit/Fix**

## Validation
Commands required for this phase:
- `npx eslint scripts/audit-industry-current-layer.ts`
- `npx tsx scripts/audit-industry-current-layer.ts`
- `npx prisma validate`
- `npx prisma generate`
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
- fake/mock/fallback-as-real detected: no
- productionApprovedTrueCount: 0
