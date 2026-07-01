# Phase 150S - MWG Retail Taxonomy Read Path / UI / Assistant

## Phase Objective

Expose the written `MWG -> RETAIL` taxonomy mapping through runtime/API/Assistant/UI with clear `research_only` and `needsReview` caveats.

Phase 150S did not write DB rows, fetch providers, import CSV, change schema, create `IndustryPeerGroup`, create a RETAIL peer group, create `IndustryMetric`, create valuation/risk benchmarks, infer peers, add investment advice, or redesign the UI.

## Starting Commit

`7b1d467ec2c39ef13a61d6e07b945d70778ad901`

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
```

Inspection:

```text
Get-Content -Raw src/features/industry/lib/load-industry-context.ts
Get-Content -Raw src/features/industry/components/IndustryCompassSections.tsx
Get-Content -Raw src/app/api/assistant/route.ts
Get-Content -Raw -LiteralPath src/app/api/companies/[ticker]/route.ts
Get-Content -Raw src/app/workspace/page.tsx
Get-Content -Raw scripts/smoke-mwg-retail-taxonomy-read-path.ts
Get-Content -Raw docs/product/evidence/PHASE150R_MWG_RETAIL_TAXONOMY_CONFIRM_WRITE.md
Get-Content -Raw docs/product/evidence/PHASE150Q_INDUSTRY_PEER_GROUP_READ_PATH_UI_ASSISTANT.md
rg -n "moduleContext|industryContext|JSON.stringify|promptText|build.*Prompt|AssistantModuleContext" src/lib/ai-rag src/app/api/assistant/route.ts
rg -n "IndustryCurrentHeader|initialIndustryContexts|industryContexts" src/components src/features src/app
Get-Content -Raw scripts/smoke-industry-peer-group-read-path.ts
```

Validation / smoke:

```text
node scripts/run-staging.mjs npx eslint src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts scripts/smoke-mwg-retail-taxonomy-runtime-ui-assistant.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-mwg-retail-taxonomy-runtime-ui-assistant.ts
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts scripts/smoke-mwg-retail-taxonomy-runtime-ui-assistant.ts
```

## Files Changed

```text
src/features/industry/lib/load-industry-context.ts
src/features/industry/components/IndustryCompassSections.tsx
src/app/api/assistant/route.ts
scripts/smoke-mwg-retail-taxonomy-runtime-ui-assistant.ts
docs/product/evidence/PHASE150S_MWG_RETAIL_TAXONOMY_READ_PATH_UI_ASSISTANT.md
```

## Runtime / API Payload Summary

`loadIndustryTaxonomyRuntimeByTicker("MWG")` and `loadIndustryContextRuntimeByTicker("MWG")` now expose an additive `taxonomySummary` while preserving the existing `taxonomy.mappings` payload.

MWG taxonomy summary:

```text
status=available
ticker=MWG
industryCode=RETAIL
industryName=Retail
displayNameVi=Bán lẻ
roleType=primary
mappingConfidence=medium
dataMode=research_only
productionApproved=false
needsReview=true
sourceType=provider_taxonomy
sourceUrl=https://finance.vietstock.vn/MWG/ho-so-doanh-nghiep.htm
warnings=TAXONOMY_RESEARCH_ONLY, TAXONOMY_NEEDS_REVIEW, TAXONOMY_NOT_INVESTMENT_ADVICE, TAXONOMY_NOT_VALUATION_BENCHMARK, TAXONOMY_NOT_RISK_BENCHMARK
```

The existing company API remains additive: `GET /api/companies/MWG` continues returning `industryContext`, now including `taxonomy.taxonomySummary` and the existing mapping array.

## Assistant Grounding Summary

Assistant runtime receives MWG taxonomy context through the existing `industryContext` module context. The prompt contains:

```text
MWG
RETAIL
research_only
needsReview
productionApproved=false
TAXONOMY_NOT_INVESTMENT_ADVICE
TAXONOMY_NOT_VALUATION_BENCHMARK
TAXONOMY_NOT_RISK_BENCHMARK
peerGroupSummary.status=missing
peers=[]
```

Assistant guardrail now explicitly states taxonomy is not investment advice, not a valuation benchmark, not a risk benchmark, and must not be used to say one ticker is better/worse.

## UI Caveat Summary

The existing Industry header warning box now includes one small additive line when DB taxonomy mappings are available:

```text
DB taxonomy detail: MWG -> Bán lẻ (research_only, needsReview=true). Taxonomy is not investment advice or a valuation/risk benchmark.
```

No sidebar, navigation, module order, route, dense table, or layout redesign was made.

## MWG Read-Path Result

Smoke result:

```text
mwgTaxonomyReadable=true
mwgApiTaxonomyReadable=true
mwgIndustryCode=RETAIL
mwgIndustryName=Retail
mwgDisplayNameVi=Bán lẻ
mwgRoleType=primary
mwgMappingConfidence=medium
mwgDataMode=research_only
mwgProductionApprovedFalse=true
mwgNeedsReviewTrue=true
mwgSourceType=provider_taxonomy
mwgSourceUrlPresent=true
taxonomyWarningsVisible=true
```

## MWG Peer-Group Missing-Safe Result

```text
mwgPeerGroupMissingSafe=true
mwgRetailPeerRows=0
peerGroupSummary.status=missing
peers=[]
warnings include PEER_GROUP_UNAVAILABLE, PEER_GROUP_NOT_VALUATION_BENCHMARK, PEER_GROUP_NOT_RISK_BENCHMARK
No RETAIL peer group was created or inferred.
```

## HPG Regression Result

```text
hpgSteelPeerGroupIntact=true
industryCode=STEEL_MATERIALS
peerCount=3
HSG=direct_peer
NKG=direct_peer
TVN=adjacent_peer
```

## VCB Missing-Safe Result

```text
vcbMissingSafe=true
VCB taxonomy status=missing
VCB taxonomy mappings=[]
VCB peerGroupSummary.status=missing
VCB peers=[]
No fallback taxonomy or peer group was created.
```

## Guardrail Results

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
IndustryPeerGroup created=false
RETAIL peer group created=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
inventedRetailPeers=false
uiLayoutRedesigned=false
productionApprovedTrueCount=0
investmentAdviceAdded=false
buySellHoldLanguageAdded=false
targetPriceFairValueUpsideDownsideAdded=false
taxonomyUsedAsValuationBenchmark=false
taxonomyUsedAsRiskBenchmark=false
peerGroupUsedAsValuationBenchmark=false
peerGroupUsedAsRiskBenchmark=false
```

## Smoke Result

Script:

```text
scripts/smoke-mwg-retail-taxonomy-runtime-ui-assistant.ts
```

Result:

```text
phase=150S
mwgTaxonomyReadable=true
mwgApiTaxonomyReadable=true
mwgIndustryCode=RETAIL
mwgRoleType=primary
mwgMappingConfidence=medium
mwgPeerGroupMissingSafe=true
assistantMwgTaxonomyContextInjected=true
assistantReceivesNoInventedMwgPeerGroup=true
uiTaxonomyCaveatVisible=true
hpgSteelPeerGroupIntact=true
vcbMissingSafe=true
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
uiLayoutRedesigned=false
productionApprovedTrueCount=0
investmentAdviceAdded=false
smokePassed=true
```

## Validation Results

```text
targeted lint for Phase 150S files: pass
smoke-mwg-retail-taxonomy-runtime-ui-assistant: pass
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150S files
```

Global lint failing files included:

```text
scripts/audit-assistant-macro-context-readiness.ts
scripts/audit-macro-frontend-indicator-scope.ts
scripts/audit-macro-indicator-universe-current-state.ts
scripts/audit-macro-ui-db-readiness.ts
scripts/audit-market-price-scheduled-readiness-gates.ts
scripts/check-market-price-provenance-migration-draft.ts
scripts/confirm-write-fred-global-macro-candidates.ts
scripts/confirm-write-macro-data-ingestion.ts
scripts/confirm-write-market-price-daily-provider-refresh.ts
scripts/confirm-write-market-price-provenance-sidecar.ts
scripts/decide-schema-db-alignment.ts
scripts/dry-run-fred-global-macro-candidates.ts
scripts/dry-run-market-price-daily-provider-refresh.ts
scripts/dry-run-market-price-provenance-sidecar-mapping.ts
scripts/dry-run-market-technical-provider-ingestion-contract.ts
scripts/fetch_html.ts
scripts/inspect-market-technical-provider-metadata-gaps.ts
scripts/inspect-market-technical-provider-payload.ts
scripts/job-market-price-daily-refresh.ts
scripts/preview-macro-data-ingestion-to-schema.ts
scripts/preview-macro-data-ingestion.ts
scripts/smoke-fred-global-macro-confirm-write.ts
scripts/smoke-fred-global-macro-db-read-path.ts
scripts/smoke-fred-global-macro-dry-run.ts
scripts/smoke-macro-data-after-write.ts
scripts/smoke-macro-module-candidate-data-e2e.ts
scripts/smoke-macro-schema-and-read-path.ts
scripts/smoke-market-macro-unavailable-provider-boundary.ts
scripts/smoke-market-price-daily-refresh-after-write.ts
scripts/smoke-market-price-daily-refresh-job-no-auto-run.ts
scripts/smoke-market-price-provenance-full-http-ssr.ts
scripts/smoke-market-price-provenance-schema-after-migration.ts
scripts/smoke-market-price-provenance-sidecar-after-write.ts
scripts/smoke-market-price-provenance-ui-transparency.ts
scripts/smoke-market-price-provenance-user-facing-ui.ts
scripts/smoke-post-resolve-macro-industry-read-path.ts
scripts/verify-macro-policy-rate-source.ts
src/features/macro/types.ts
src/features/technical/lib/load-technical-runtime-data.ts
src/lib/market-data/market-price-provider-metadata-normalization.ts
```

## Known Limitations

```text
MWG taxonomy remains research_only and needsReview.
No RETAIL/MWG peer group exists.
No numeric industry metrics exist.
No valuation/risk benchmarks exist.
No IndustryContextProvenance rows were added.
The mapping is not production-approved.
UI exposure is a small caveat line only, not a redesigned industry taxonomy table.
```

## Recommended Phase 150T

Add source-backed `IndustryContextProvenance` or a dedicated MWG taxonomy context provenance read path. Keep RETAIL peer groups, metrics, and benchmarks out of scope unless a separate reviewed-source phase explicitly approves them with the same no-advice caveats.
