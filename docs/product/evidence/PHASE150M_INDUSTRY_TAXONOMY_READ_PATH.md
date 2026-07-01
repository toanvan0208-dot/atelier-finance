# Phase 150M - Industry Taxonomy Read-Path

## Phase Objective

Wire the HPG `CompanyIndustry` taxonomy mapping created in Phase 150L into runtime/API/Assistant read paths with research-only and needs-review caveats.

Phase 150M did not write DB rows, fetch providers, import CSV, apply schema migrations, create peer groups, create `IndustryMetric`, create valuation/risk benchmarks, or redesign the Industry UI.

## Starting Commit

`397f3780bfa9e888e5f60261cc4ec72561410456`

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
Get-Content src/features/industry/lib/load-industry-context.ts
Get-Content src/features/industry/components/IndustryPage.tsx
Get-Content src/features/industry/components/IndustryCompassSections.tsx
Get-Content src/app/api/assistant/route.ts
Get-Content -LiteralPath src/app/api/companies/[ticker]/route.ts
Get-Content src/app/workspace/page.tsx
Get-Content scripts/smoke-industry-taxonomy-read-path.ts
Get-Content docs/product/evidence/PHASE150L_HPG_STEEL_TAXONOMY_CONFIRM_WRITE.md
```

Smoke and targeted lint:

```text
node scripts/run-staging.mjs npx eslint scripts/smoke-industry-taxonomy-read-path-runtime.ts src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-taxonomy-read-path-runtime.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
```

## Files Changed

```text
src/features/industry/lib/load-industry-context.ts
src/features/industry/components/IndustryCompassSections.tsx
src/app/api/assistant/route.ts
scripts/smoke-industry-taxonomy-read-path-runtime.ts
docs/product/evidence/PHASE150M_INDUSTRY_TAXONOMY_READ_PATH.md
```

## Read-Path Behavior

Added `loadIndustryTaxonomyRuntimeByTicker(ticker)` to the existing Industry runtime loader.

The taxonomy payload returns:

```text
ticker
status=available/missing
mappings[]
industryCode
industryName
displayNameVi
sectorCode/sectorName
classificationSystem
roleType
mappingConfidence
sourceLabel/sourceUrl/sourceType
dataMode
productionApproved=false
needsReview=true
warningCodes
caveats
peerGroupsAvailable=false
numericIndustryMetricsAvailable=false
valuationRiskBenchmarksAvailable=false
peerGroupInferred=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
```

The existing `loadIndustryContextRuntimeByTicker` now includes this taxonomy payload. That means the workspace preload, company API, and Assistant route receive the same additive taxonomy context without changing API route shape destructively.

## HPG Taxonomy Result

Smoke result:

```text
hpgTaxonomyReadable=true
hpgIndustryCode=STEEL_MATERIALS
hpgCompanyIndustryRole=primary
hpgResearchOnlyCaveatVisible=true
hpgNeedsReviewVisible=true
runtimeContextIncludesTaxonomy=true
```

The HPG taxonomy mapping remains:

```text
dataMode=research_only
productionApproved=false
needsReview=true
sourceType=provider_taxonomy
```

## VCB Missing Handling

Smoke result:

```text
vcbMissingSafe=true
noFallbackMappingForVcb=true
```

VCB has no taxonomy mapping. The loader returns a missing state and does not infer banking/financials from static guidance or ticker assumptions.

## Assistant Context Result

Assistant route still loads `industryContext` by ticker, and that runtime payload now includes `taxonomy`.

Smoke result:

```text
assistantReceivesHpgTaxonomy=true
assistantHandlesVcbMissing=true
```

The Assistant guardrail copy was updated to state:

```text
Industry taxonomy is research-only with productionApproved=false and needsReview=true.
Peer groups, numeric industry metrics, and valuation/risk benchmarks are unavailable unless explicitly present.
Do not infer peers, invent metrics, create benchmarks, or make deterministic macro-to-industry conclusions.
```

## UI Safety Result

No redesign was performed.

The only UI change is an additive line inside the existing Industry warning box:

```text
DB taxonomy: research_only mapping(s), productionApproved=false, needsReview=true.
Peer groups, numeric metrics, and valuation/risk benchmarks are not inferred.
```

Smoke result:

```text
uiLayoutChanged=false
```

## Peer Group / Metric / Benchmark Non-Creation

Smoke result:

```text
peerGroupInferred=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
```

Phase 150M did not create or infer peer groups, metrics, or benchmarks.

## Guardrail Results

```text
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
productionApprovedTrueCount=0
investmentAdviceAdded=false
missingDataZeroFilled=false
staticGuidancePromotedToRealData=false
noFallbackMappingForVcb=true
```

## Smoke Results

Script:

```text
scripts/smoke-industry-taxonomy-read-path-runtime.ts
```

Output:

```text
phase=150M
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
hpgTaxonomyReadable=true
hpgIndustryCode=STEEL_MATERIALS
hpgCompanyIndustryRole=primary
hpgResearchOnlyCaveatVisible=true
hpgNeedsReviewVisible=true
vcbMissingSafe=true
noFallbackMappingForVcb=true
peerGroupInferred=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
assistantReceivesHpgTaxonomy=true
assistantHandlesVcbMissing=true
uiLayoutChanged=false
productionApprovedTrueCount=0
investmentAdviceAdded=false
runtimeContextIncludesTaxonomy=true
smokePassed=true
```

## Validation Results

```text
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150M files
targeted lint for Phase 150M files: pass
runtime taxonomy smoke: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, assistant, and audit scripts/modules.
New/touched Phase 150M files passed targeted lint:
- scripts/smoke-industry-taxonomy-read-path-runtime.ts
- src/features/industry/lib/load-industry-context.ts
- src/features/industry/components/IndustryCompassSections.tsx
- src/app/api/assistant/route.ts
```

## Known Limitations

```text
Only HPG has taxonomy coverage.
No peer-group rows exist.
No IndustryMetric model exists.
No valuation/risk benchmarks exist.
Taxonomy remains research_only and needs review.
The UI only shows a compact taxonomy availability line; richer taxonomy UI is deferred.
```

## Recommended Next Phase

Phase 150N should add reviewed source packages for a very small peer-group subset only if source-backed:

```text
STEEL_MATERIALS peer candidates: HSG, NKG, TVN only with reviewed source URL/date/evidence.
No peer inference from static guidance.
No metrics or benchmarks until source/unit/frequency contracts are defined.
```

## Commit

Recorded in the Phase 150M Git commit.
