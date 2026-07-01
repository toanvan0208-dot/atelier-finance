# Phase 150Q — Industry Peer Group Read Path / UI / Assistant

## Phase Objective

Expose the written `STEEL_MATERIALS` peer group rows through runtime/API/Assistant/UI with clear `research_only` and `needsReview` caveats.

Phase 150Q did not write DB rows, fetch providers, import CSV, change schema, create `IndustryMetric`, create valuation/risk benchmarks, infer peer groups, or redesign the UI.

## Starting Commit

`ecca483a1566ca7cba64b96da0b71414e9d53af0`

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
rg -n "IndustryTaxonomyRuntimePayload|IndustryContextRuntimePayload|loadIndustryTaxonomyRuntimeByTicker|loadIndustryContextRuntimeByTicker|peerGroupsAvailable|taxonomy|IndustryCurrentHeader|industryContext" src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts src/app/api/companies/[ticker]/route.ts src/app/workspace/page.tsx
rg -n "industryPeerGroup|IndustryPeerGroup|peerGroup|STEEL_MATERIALS|assistantReceivesHpgTaxonomy|loadIndustryContextRuntimeByTicker" scripts src/features/industry src/app/api/assistant/route.ts docs/product/evidence/PHASE150P_STEEL_PEER_GROUP_CONFIRM_WRITE.md
Get-Content scripts/smoke-industry-taxonomy-read-path-runtime.ts
Get-Content -LiteralPath src/app/api/companies/[ticker]/route.ts
Select-String -Path prisma/schema.prisma -Pattern "model IndustryPeerGroup" -Context 0,70
Get-Content scripts/smoke-steel-peer-group-read-path.ts
```

Validation / smoke:

```text
node scripts/run-staging.mjs npx eslint src/features/industry/lib/load-industry-context.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts scripts/smoke-industry-peer-group-read-path.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-peer-group-read-path.ts
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
scripts/smoke-industry-peer-group-read-path.ts
docs/product/evidence/PHASE150Q_INDUSTRY_PEER_GROUP_READ_PATH_UI_ASSISTANT.md
```

## Runtime / API Payload Summary

`loadIndustryContextRuntimeByTicker` now returns a top-level `peerGroupSummary`.

For `HPG`, `peerGroupSummary` is available:

```text
industryCode=STEEL_MATERIALS
anchorTicker=HPG
peers=HSG direct_peer, NKG direct_peer, TVN adjacent_peer
dataMode=research_only
productionApproved=false
needsReview=true
warnings=PEER_GROUP_RESEARCH_ONLY, PEER_GROUP_NEEDS_REVIEW, PEER_GROUP_NOT_VALUATION_BENCHMARK, PEER_GROUP_NOT_RISK_BENCHMARK
```

The existing company API payload remains additive because it already returns `industryContext`.

## Assistant Grounding Summary

Assistant runtime now receives `peerGroupSummary` through the existing `industryContext` module context. The guardrail says peer groups are taxonomy/context comparison only, research-only, needs-review, and must not be used as valuation/risk benchmarks or to infer one ticker is better/worse from peer membership.

## UI Caveat Summary

The Industry header warning box adds one small existing-slot line:

```text
DB peer group: HSG (peer truc tiep), NKG (peer truc tiep), TVN (peer lien quan / can ra soat). research_only, needsReview=true. Peer group is not a valuation or risk benchmark.
```

No sidebar, navigation, module order, route, or layout redesign was made.

## HPG Read-Path Result

```text
hpgPeerGroupReadable=true
hpgPeerCount=3
hsgDirectPeerVisible=true
nkgDirectPeerVisible=true
tvnAdjacentPeerVisible=true
allPeerRowsResearchOnlyNeedsReview=true
peerGroupWarningsVisible=true
apiPeerGroupSummaryVisible=true
```

## VCB Missing-Safe Result

```text
vcbPeerGroupMissingSafe=true
VCB peerGroupSummary.status=missing
VCB peers=[]
No fallback peer group is used.
```

## Guardrail Results

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
peerGroupUsedAsValuationBenchmark=false
peerGroupUsedAsRiskBenchmark=false
peerGroupInferred=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
uiLayoutRedesigned=false
productionApprovedTrueCount=0
needsReviewTrueCount=3
investmentAdviceAdded=false
```

## Smoke Result

Script:

```text
scripts/smoke-industry-peer-group-read-path.ts
```

Result:

```text
phase=150Q
hpgPeerGroupReadable=true
hpgPeerCount=3
assistantPeerGroupContextInjected=true
uiPeerGroupCaveatVisible=true
vcbPeerGroupMissingSafe=true
smokePassed=true
```

## Validation Results

```text
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
targeted lint for Phase 150Q files: pass
smoke-industry-peer-group-read-path: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150Q files
```

Global lint failure boundary remains older script/module debt, including macro, market-price, technical, and audit files. New/touched Phase 150Q files passed targeted lint.

## Known Limitations

```text
Peer groups are only wired for read-path visibility and caveated context.
Peer group is not an IndustryMetric, valuation benchmark, or risk benchmark.
No peer group UI redesign was done.
Only source-backed STEEL_MATERIALS rows currently exist.
VCB remains taxonomy/peer-group missing-safe.
```

## Recommended Phase 150R

Add a small read-path smoke or source package dry-run for the next reviewed taxonomy/peer group candidate only after product owners provide reviewed source metadata. Do not create peer-based comparisons, metrics, or benchmarks until the data contract is separately reviewed.

## Commit

Pending.
