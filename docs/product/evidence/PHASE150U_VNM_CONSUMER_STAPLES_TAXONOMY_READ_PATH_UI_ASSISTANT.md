# Phase 150U — VNM Consumer Staples / Dairy Taxonomy Read Path / UI / Assistant

## Phase Objective

Expose the written `VNM -> CONSUMER_STAPLES_DAIRY` taxonomy mapping through runtime/API/Assistant/UI with clear `research_only` and `needsReview` caveats.

Phase 150U did not write DB rows, fetch providers, import CSV, change schema, create `IndustryPeerGroup`, create VNM peers, create `IndustryMetric`, create valuation/risk benchmarks, add peer-based comparisons, or redesign the UI.

## Starting Commit

`c77bc15e12c7d7960655c729a6ed5ff12e101897`

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
rg -n "taxonomySummary|IndustryTaxonomy|loadIndustryTaxonomyRuntimeByTicker|peerGroupSummary|TAXONOMY_NOT|PEER_GROUP_UNAVAILABLE|IndustryCurrentHeader|DB taxonomy detail|industryContextGuardrail" src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts src/app/api/companies/[ticker]/route.ts src/app/workspace/page.tsx
Get-Content scripts/smoke-mwg-retail-taxonomy-runtime-ui-assistant.ts
Get-Content scripts/smoke-vnm-consumer-staples-taxonomy-read-path.ts
Get-Content docs/product/evidence/PHASE150T_VNM_CONSUMER_STAPLES_TAXONOMY_CONFIRM_WRITE.md
```

Validation / smoke:

```text
node scripts/run-staging.mjs npx eslint scripts/smoke-vnm-consumer-staples-taxonomy-runtime-ui-assistant.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-vnm-consumer-staples-taxonomy-runtime-ui-assistant.ts
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
```

Note: an initial `npm run typecheck` was run in parallel with `npm run build` and hit generated-file timing errors. After build completed, `npm run typecheck` was rerun sequentially and passed.

## Files Changed

```text
scripts/smoke-vnm-consumer-staples-taxonomy-runtime-ui-assistant.ts
docs/product/evidence/PHASE150U_VNM_CONSUMER_STAPLES_TAXONOMY_READ_PATH_UI_ASSISTANT.md
```

## Runtime / API Payload Summary

No runtime code change was required. The existing generic taxonomy read-path added in earlier phases already exposes `taxonomy.taxonomySummary` for every reviewed `CompanyIndustry` mapping.

For `VNM`, runtime/API now reads:

```text
taxonomySummary.status=available
ticker=VNM
industryCode=CONSUMER_STAPLES_DAIRY
industryName=Consumer Staples - Dairy
displayNameVi=Hang tieu dung thiet yeu - Sua
roleType=primary
mappingConfidence=medium
dataMode=research_only
productionApproved=false
needsReview=true
sourceType=provider_taxonomy
warnings=TAXONOMY_RESEARCH_ONLY, TAXONOMY_NEEDS_REVIEW, TAXONOMY_NOT_INVESTMENT_ADVICE, TAXONOMY_NOT_VALUATION_BENCHMARK, TAXONOMY_NOT_RISK_BENCHMARK
```

The existing company API remains additive: `GET /api/companies/VNM` returns `industryContext`, including the VNM taxonomy summary.

## Assistant Grounding Summary

Assistant runtime receives VNM taxonomy context through the existing `industryContext` module context:

```text
VNM
CONSUMER_STAPLES_DAIRY
research_only
needsReview
productionApproved=false
TAXONOMY_NOT_INVESTMENT_ADVICE
TAXONOMY_NOT_VALUATION_BENCHMARK
TAXONOMY_NOT_RISK_BENCHMARK
peerGroupSummary.status=missing
peers=[]
```

Assistant guardrails from the existing route continue to prevent using taxonomy as investment advice, valuation/risk benchmark, or a basis for ticker quality conclusions.

## UI Caveat Summary

No UI code change was required. The existing Industry header warning box already includes the generic taxonomy line:

```text
DB taxonomy detail: ... Taxonomy is not investment advice or a valuation/risk benchmark.
```

No sidebar, navigation, module order, route, dense table, or layout redesign was made.

## VNM Read-Path Result

Smoke result:

```text
vnmTaxonomyReadable=true
vnmApiTaxonomyReadable=true
vnmIndustryCode=CONSUMER_STAPLES_DAIRY
vnmRoleType=primary
vnmMappingConfidence=medium
vnmDataMode=research_only
vnmProductionApprovedFalse=true
vnmNeedsReviewTrue=true
vnmSourceType=provider_taxonomy
vnmSourceUrlPresent=true
taxonomyWarningsVisible=true
```

## VNM Peer-Group Missing-Safe Result

```text
vnmPeerGroupMissingSafe=true
vnmPeerGroupRows=0
peerGroupSummary.status=missing
peers=[]
No VNM peer group was created or inferred.
```

## Regression Results

HPG:

```text
hpgSteelPeerGroupIntact=true
STEEL_MATERIALS peer count=3
HSG=direct_peer
NKG=direct_peer
TVN=adjacent_peer
```

MWG:

```text
mwgRetailTaxonomyIntact=true
MWG -> RETAIL primary mapping remains readable
```

VCB:

```text
vcbMissingSafe=true
VCB taxonomy status=missing
VCB peerGroupSummary.status=missing
No fallback taxonomy or peer group was created.
```

## Guardrail Results

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
IndustryPeerGroup created=false
VNM peer group invented=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
uiLayoutRedesigned=false
productionApprovedTrueCount=0
investmentAdviceAdded=false
taxonomyUsedAsInvestmentAdvice=false
taxonomyUsedAsValuationBenchmark=false
taxonomyUsedAsRiskBenchmark=false
peerGroupUsedAsValuationBenchmark=false
peerGroupUsedAsRiskBenchmark=false
```

## Smoke Result

Script:

```text
scripts/smoke-vnm-consumer-staples-taxonomy-runtime-ui-assistant.ts
```

Result:

```text
phase=150U
vnmTaxonomyReadable=true
vnmApiTaxonomyReadable=true
vnmIndustryCode=CONSUMER_STAPLES_DAIRY
vnmRoleType=primary
vnmMappingConfidence=medium
vnmPeerGroupMissingSafe=true
assistantVnmTaxonomyContextInjected=true
assistantReceivesNoInventedVnmPeerGroup=true
uiTaxonomyCaveatVisible=true
hpgSteelPeerGroupIntact=true
mwgRetailTaxonomyIntact=true
vcbMissingSafe=true
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
productionApprovedTrueCount=0
smokePassed=true
```

## Validation Results

```text
targeted lint for Phase 150U file: pass
smoke-vnm-consumer-staples-taxonomy-runtime-ui-assistant: pass
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass after sequential rerun
npm run lint: fail due old/out-of-scope lint debt, not Phase 150U files
```

Global lint failing files remain older macro, market-price, technical, and audit-script debt. New/touched Phase 150U files passed targeted lint.

## Known Limitations

```text
VNM taxonomy remains research_only and needsReview.
No VNM peer group exists.
No numeric industry metrics exist.
No valuation/risk benchmarks exist.
No new VNM UI section was added; the existing generic taxonomy caveat line is reused.
The mapping is not production-approved.
```

## Recommended Phase 150V

Pick the next source-backed taxonomy candidate for reviewed mapping or define a reviewed VNM peer-group source package only if product owners provide explicit peer evidence. Keep metrics and benchmarks out of scope until their source/unit contract is separately reviewed.

## Commit

Pending.
