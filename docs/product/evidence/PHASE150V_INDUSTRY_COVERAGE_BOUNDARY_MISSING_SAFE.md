# Phase 150V - Industry Coverage Boundary / Missing-Safe Hardening

## Phase Objective

Lock the current Industry module milestone to exactly three reviewed industry coverage lanes and harden runtime/API/Assistant/UI behavior so unsupported tickers do not receive inferred taxonomy or peer groups.

Phase 150V did not write DB rows, fetch providers, import CSV, change schema, create `IndustryMetric`, create valuation/risk benchmarks, create peer groups, create taxonomy rows, or redesign the UI.

## Product Decision

The current reviewed Industry coverage milestone is intentionally limited to:

```text
STEEL_MATERIALS -> HPG
RETAIL -> MWG
CONSUMER_STAPLES_DAIRY -> VNM
```

Unsupported tickers, including `FPT`, `VCB`, and `MSN`, must remain missing-safe unless a future reviewed source package is added. Missing taxonomy means "not yet reviewed in system data", not "the company has no industry".

## Starting Commit

`85a112b4748adcc3357b214a0c17e7aabef8ef7d`

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
rg -n "taxonomySummary|peerGroupSummary|loadIndustryTaxonomy|loadIndustryPeer|IndustryPeerGroup|TAXONOMY|PEER_GROUP" src/features/industry/lib/load-industry-context.ts
rg -n "DB taxonomy|peer group|Taxonomy|taxonomy|reviewed|missing-safe|warning" src/features/industry/components/IndustryCompassSections.tsx
rg -n "industryContextGuardrail|taxonomy|peer group|IndustryContext|loadIndustryContextRuntimeByTicker|not valuation" src/app/api/assistant/route.ts
rg -n "industryContext|taxonomy|peerGroupSummary|loadIndustryContextRuntimeByTicker" src/app/api/companies/[ticker]/route.ts
Get-Content scripts/smoke-industry-peer-group-read-path.ts
Get-Content scripts/smoke-mwg-retail-taxonomy-runtime-ui-assistant.ts
Get-Content scripts/smoke-vnm-consumer-staples-taxonomy-runtime-ui-assistant.ts
Get-Content -LiteralPath src/app/api/companies/[ticker]/route.ts
Get-Content docs/product/evidence/PHASE150Q_INDUSTRY_PEER_GROUP_READ_PATH_UI_ASSISTANT.md
Get-Content docs/product/evidence/PHASE150S_MWG_RETAIL_TAXONOMY_READ_PATH_UI_ASSISTANT.md
Get-Content docs/product/evidence/PHASE150U_VNM_CONSUMER_STAPLES_TAXONOMY_READ_PATH_UI_ASSISTANT.md
```

Validation / smoke:

```text
node scripts/run-staging.mjs npx eslint src/features/industry/lib/reviewed-industry-coverage.ts src/features/industry/components/IndustryCompassSections.tsx src/app/api/assistant/route.ts scripts/smoke-industry-coverage-boundary.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-coverage-boundary.ts
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
```

## Files Changed

```text
src/features/industry/lib/reviewed-industry-coverage.ts
src/features/industry/components/IndustryCompassSections.tsx
src/app/api/assistant/route.ts
scripts/smoke-industry-coverage-boundary.ts
docs/product/evidence/PHASE150V_INDUSTRY_COVERAGE_BOUNDARY_MISSING_SAFE.md
```

## Reviewed Coverage Table

```text
reviewedIndustryCount=3
reviewedIndustries=STEEL_MATERIALS, RETAIL, CONSUMER_STAPLES_DAIRY
reviewedMappedTickers=HPG, MWG, VNM
```

Peer group coverage:

```text
STEEL_MATERIALS: HSG direct_peer, NKG direct_peer, TVN adjacent_peer
RETAIL: missing-safe, no peer group
CONSUMER_STAPLES_DAIRY: missing-safe, no peer group
```

## Unsupported Ticker Policy

A small guardrail module now documents the milestone boundary:

```text
src/features/industry/lib/reviewed-industry-coverage.ts
```

The module does not replace DB truth and does not create data. It only records the reviewed boundary, supported tickers, reviewed peer groups, and unsupported ticker policy for smoke/Assistant/UI guardrails.

Policy:

```text
FPT, VCB, MSN, and all other unsupported tickers must remain missing-safe until a reviewed source package is added.
Do not infer taxonomy or peers from common knowledge, company descriptions, static UI guidance, or AI reasoning.
```

## Runtime / API Result

Smoke verified:

```text
hpgTaxonomyAvailable=true
hpgApiTaxonomyAvailable=true
hpgSteelPeerGroupIntact=true
hpgPeerCount=3
mwgRetailTaxonomyIntact=true
mwgApiTaxonomyAvailable=true
mwgPeerGroupMissingSafe=true
vnmConsumerStaplesDairyTaxonomyIntact=true
vnmApiTaxonomyAvailable=true
vnmPeerGroupMissingSafe=true
fptTaxonomyMissingSafe=true
fptApiTaxonomyNotInferred=true
vcbTaxonomyMissingSafe=true
msnTaxonomyMissingSafe=true
msnApiTaxonomyNotInferred=true
noInferredUnsupportedTaxonomy=true
```

## Assistant Guardrail Result

Assistant grounding now includes the reviewed coverage boundary and unsupported ticker policy. It explicitly says missing taxonomy means not yet reviewed in system data, not that the company has no industry.

Smoke verified:

```text
assistantGuardrailContainsCoverageBoundary=true
assistantContextDoesNotInferFptTaxonomy=true
inventedPeers=false
```

## UI Caveat Result

The existing Industry header warning box received one small additive line:

```text
Reviewed coverage boundary: STEEL_MATERIALS, RETAIL, CONSUMER_STAPLES_DAIRY for mapped tickers HPG, MWG, VNM. Unsupported tickers stay missing-safe; no automatic taxonomy or peer inference.
```

No sidebar, navigation, route, module order, dense table, or layout redesign was made.

## HPG / MWG / VNM Result

```text
HPG: STEEL_MATERIALS taxonomy readable; steel peer group intact with HSG, NKG, TVN.
MWG: RETAIL taxonomy readable; peer group missing-safe.
VNM: CONSUMER_STAPLES_DAIRY taxonomy readable; peer group missing-safe.
```

## FPT / VCB / MSN Missing-Safe Result

```text
FPT: taxonomy missing-safe; legacy IndustryContext does not imply taxonomy.
VCB: taxonomy missing-safe; no fallback mapping.
MSN: taxonomy missing-safe; legacy IndustryContext does not imply taxonomy.
```

## Guardrail Results

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
newIndustryRows=0
newCompanyIndustryRows=0
newIndustryPeerGroupRows=0
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
uiLayoutRedesigned=false
productionApprovedTrueCount=0
investmentAdviceAdded=false
```

## Smoke Result

Script:

```text
scripts/smoke-industry-coverage-boundary.ts
```

Result:

```text
phase=150V
reviewedIndustryCount=3
reviewedIndustriesExactly=true
supportedMappedTickersExactly=true
hpgSteelPeerGroupIntact=true
mwgRetailTaxonomyIntact=true
vnmConsumerStaplesDairyTaxonomyIntact=true
fptTaxonomyMissingSafe=true
vcbTaxonomyMissingSafe=true
msnTaxonomyMissingSafe=true
assistantGuardrailContainsCoverageBoundary=true
uiCoverageBoundaryVisible=true
productionApprovedTrueCount=0
smokePassed=true
```

## Validation Results

```text
targeted lint for Phase 150V files: pass
smoke-industry-coverage-boundary: pass
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150V files
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, financials, screening, and audit scripts/modules.
Examples include:
- scripts/audit-assistant-macro-context-readiness.ts
- scripts/audit-macro-frontend-indicator-scope.ts
- scripts/confirm-write-market-price-daily-provider-refresh.ts
- scripts/dry-run-market-price-daily-provider-refresh.ts
- scripts/smoke-market-price-* files
- scripts/verify-macro-policy-rate-source.ts
- src/features/macro/types.ts
- src/features/technical/lib/load-technical-runtime-data.ts
- src/lib/market-data/market-price-provider-metadata-normalization.ts

New/touched Phase 150V files passed targeted lint:
- src/features/industry/lib/reviewed-industry-coverage.ts
- src/features/industry/components/IndustryCompassSections.tsx
- src/app/api/assistant/route.ts
- scripts/smoke-industry-coverage-boundary.ts
```

## Known Limitations

```text
Only three reviewed industry mappings are in scope for the current milestone.
FPT, VCB, and MSN remain unsupported for reviewed taxonomy.
No peer groups exist for RETAIL or CONSUMER_STAPLES_DAIRY.
No numeric IndustryMetric exists.
No valuation/risk industry benchmark exists.
The coverage boundary is a guardrail/helper, not a substitute for DB-reviewed source packages.
```

## Recommended Phase 150W

Run an end-to-end Industry milestone smoke across runtime/API/Assistant/UI for the locked three-industry boundary, then move to the next module in the product flow. Do not expand industry coverage unless product owners provide reviewed source packages.

## Commit

Pending.
