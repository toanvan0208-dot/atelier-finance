# Phase 150O - Steel Peer-Group Source Package Dry-Run

## Phase Objective

Add reviewed `IndustryPeerGroup` source packages for `STEEL_MATERIALS` using readable Vietstock company profile URLs for:

```text
HSG
NKG
TVN
```

Then run dry-run validation only. Phase 150O did not write DB rows, run confirm-write, fetch providers, import CSV, change schema, redesign UI, wire Assistant/UI peer groups, create `IndustryMetric`, create valuation/risk benchmarks, or set `productionApproved=true`.

## Starting Commit

`e80cef67c5da68db04d9abc969279dcb6888576c`

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
Get-Content scripts/industry-taxonomy-reviewed-sources.ts
Get-Content scripts/dry-run-steel-peer-group-reviewed-sources.ts
```

Dry-run / targeted lint:

```text
node scripts/run-staging.mjs npx tsx scripts/dry-run-steel-peer-group-reviewed-sources.ts
node scripts/run-staging.mjs npx eslint scripts/industry-taxonomy-reviewed-sources.ts scripts/dry-run-steel-peer-group-reviewed-sources.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/industry-taxonomy-reviewed-sources.ts scripts/dry-run-steel-peer-group-reviewed-sources.ts
node scripts/run-staging.mjs npx tsx scripts/dry-run-steel-peer-group-reviewed-sources.ts
```

## Files Changed

```text
scripts/industry-taxonomy-reviewed-sources.ts
scripts/dry-run-steel-peer-group-reviewed-sources.ts
docs/product/evidence/PHASE150O_STEEL_PEER_GROUP_SOURCE_PACKAGE_DRY_RUN.md
```

## Source Package Summary

Added three reviewed peer-group source packages to:

```text
scripts/industry-taxonomy-reviewed-sources.ts
```

Shared policy:

```text
industryCode=STEEL_MATERIALS
sourceType=provider_taxonomy
publicationDate=null
retrievedAt=2026-07-01
extractedQuote=null
reviewNote used instead of exact quote
dataMode=research_only
productionApproved=false
needsReview=true
warningCodes=RESEARCH_ONLY, NEEDS_REVIEW, PROVIDER_TAXONOMY, PEER_GROUP_NEEDS_REVIEW
```

Sources:

| Peer ticker | Source URL | Peer role | Evidence mode |
| --- | --- | --- | --- |
| HSG | https://finance.vietstock.vn/HSG/ho-so-doanh-nghiep.htm | direct_peer | reviewNote only |
| NKG | https://finance.vietstock.vn/NKG/ho-so-doanh-nghiep.htm | direct_peer | reviewNote only |
| TVN | https://finance.vietstock.vn/TVN/ho-so-doanh-nghiep.htm | adjacent_peer | reviewNote only |

## Broken Industry URL Not Used

The broken Vietstock industry URL from the precheck was not used:

```text
https://finance.vietstock.vn/nganh/34/san-xuat-thep
```

Reason:

```text
Phase 150O precheck returned HTTP 404 for that URL.
```

The dry-run uses only the reviewed company profile URLs listed above.

## Accepted / Rejected Peer Packages

Accepted:

```text
HSG direct_peer
NKG direct_peer
TVN adjacent_peer
```

Rejected:

```text
none
```

## Role Decisions

```text
HSG: direct_peer because the reviewed Vietstock profile evidence shows materials/metallurgy taxonomy and coated/flat steel exposure.
NKG: direct_peer because the reviewed Vietstock profile evidence shows materials/metallurgy taxonomy and steel sheet/coated steel/pipe/box/shape exposure.
TVN: adjacent_peer because the reviewed Vietstock profile evidence is steel-sector relevant, but the package keeps it adjacent rather than a direct comparable benchmark.
```

These roles are taxonomy/peer grouping candidates only. They are not valuation or risk benchmarks.

## Dry-Run Result

Script:

```text
scripts/dry-run-steel-peer-group-reviewed-sources.ts
```

Output summary:

```text
phase=150O
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
sourcePackagesLoaded=3
scopedPeerPackagesLoaded=3
existingTargetIndustryFound=true
anchorCompanyIndustryMappingFound=true
existingPeerGroupRows=0
eligiblePeerGroupRows=3
blockedPeerGroupRows=0
acceptedTickers=HSG, NKG, TVN
blockedTickers=[]
blockedReasons=[]
duplicatePeerPackageKeys=[]
productionApprovedTrueCount=0
needsReviewTrueCount=0
fakePeerGroupsCreated=false
peerInferenceUsed=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
staticGuidancePromotedToRealData=false
companyAnnualReportsUsedAsPrimaryPeerSource=false
missingDataZeroFilled=false
investmentAdviceAdded=false
readyForConfirmWrite=true
smokePassed=true
```

## No DB Writes

Phase 150O is dry-run only:

```text
dbWriteAttempted=false
confirmWriteExecuted=false
IndustryPeerGroup rows written=0
```

## Guardrail Results

```text
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
uiLayoutChanged=false
assistantPeerGroupWiringChanged=false
productionApprovedTrueCount=0
fakePeerGroupsCreated=false
peerInferenceUsed=false
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
staticGuidancePromotedToRealData=false
companyAnnualReportsUsedAsPrimaryPeerSource=false
missingDataZeroFilled=false
investmentAdviceAdded=false
```

## Validation Results

```text
prisma validate: pass
prisma generate: pass
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150O files
targeted lint for Phase 150O files: pass
steel peer-group dry-run: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, assistant, screening, financials, and audit scripts/modules.
New/touched Phase 150O files passed targeted lint:
- scripts/industry-taxonomy-reviewed-sources.ts
- scripts/dry-run-steel-peer-group-reviewed-sources.ts
```

## Known Limitations

```text
No IndustryPeerGroup rows have been written yet.
Peer packages remain research_only and needs review.
No exact extractedQuote is used because exact wording was not considered safe.
No IndustryMetric model exists.
No valuation/risk benchmarks exist.
UI and Assistant are not wired to peer groups in this phase.
```

## Recommended Phase 150P

Confirm-write the three eligible `IndustryPeerGroup` rows only if product owner approves:

```text
HSG direct_peer
NKG direct_peer
TVN adjacent_peer
```

The confirm-write phase must remain idempotent, write only `IndustryPeerGroup`, keep `productionApproved=false`, keep `needsReview=true`, and avoid metrics/benchmarks/UI redesign.

## Commit

Pending.
