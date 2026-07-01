# Phase 150P - Steel Peer-Group Confirm-Write

## Phase Objective

Confirm-write only the three eligible `IndustryPeerGroup` rows from Phase 150O, idempotently, then smoke/read-back the written rows.

Rows written:

```text
STEEL_MATERIALS -> HSG, peerRole=direct_peer
STEEL_MATERIALS -> NKG, peerRole=direct_peer
STEEL_MATERIALS -> TVN, peerRole=adjacent_peer
```

Phase 150P did not write `Industry`, `CompanyIndustry`, `IndustryContext`, or `IndustryContextProvenance` rows. It did not create `IndustryMetric`, valuation/risk benchmarks, UI wiring, Assistant peer-group wiring, provider fetches, CSV imports, schema migrations, or `productionApproved=true`.

## Starting Commit

`6185249e68beee873e400e6386fd7f08ec7f2ad2`

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
Select-String -Path prisma/schema.prisma -Pattern "model Industry|model CompanyIndustry|model IndustryPeerGroup" -Context 0,90
Get-Content docs/product/evidence/PHASE150O_STEEL_PEER_GROUP_SOURCE_PACKAGE_DRY_RUN.md
```

Confirm-write and smoke:

```text
node scripts/run-staging.mjs npx eslint scripts/industry-taxonomy-reviewed-sources.ts scripts/dry-run-steel-peer-group-reviewed-sources.ts scripts/confirm-write-steel-peer-group-reviewed-sources.ts scripts/smoke-steel-peer-group-read-path.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-steel-peer-group-reviewed-sources.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-steel-peer-group-reviewed-sources.ts --confirm-write
node scripts/run-staging.mjs npx tsx scripts/confirm-write-steel-peer-group-reviewed-sources.ts --confirm-write
node scripts/run-staging.mjs npx tsx scripts/smoke-steel-peer-group-read-path.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/industry-taxonomy-reviewed-sources.ts scripts/dry-run-steel-peer-group-reviewed-sources.ts scripts/confirm-write-steel-peer-group-reviewed-sources.ts scripts/smoke-steel-peer-group-read-path.ts
```

## Files Changed

```text
scripts/confirm-write-steel-peer-group-reviewed-sources.ts
scripts/smoke-steel-peer-group-read-path.ts
docs/product/evidence/PHASE150P_STEEL_PEER_GROUP_CONFIRM_WRITE.md
```

## Source Package Summary

Phase 150P reused the Phase 150O reviewed source packages:

```text
sourcePackagesLoaded=3
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

```text
HSG: https://finance.vietstock.vn/HSG/ho-so-doanh-nghiep.htm
NKG: https://finance.vietstock.vn/NKG/ho-so-doanh-nghiep.htm
TVN: https://finance.vietstock.vn/TVN/ho-so-doanh-nghiep.htm
```

The broken Vietstock industry URL was not used:

```text
https://finance.vietstock.vn/nganh/34/san-xuat-thep
```

## Dry-Run Result

Script:

```text
scripts/confirm-write-steel-peer-group-reviewed-sources.ts
```

Dry-run output:

```text
mode=dry-run
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
targetIndustryFound=true
anchorCompanyIndustryMappingFound=true
existingPeerGroupRowsBefore=0
existingPeerGroupRowsAfter=0
sourcePackagesLoaded=3
eligiblePeerGroupRows=3
blockedPeerGroupRows=0
rowsCreated=0
rowsUpdated=0
acceptedTickers=HSG, NKG, TVN
readyForConfirmWrite=true
productionApprovedTrueCount=0
smokePassed=true
```

## Confirm-Write Result

First confirm-write:

```text
mode=confirm-write
dbWriteAttempted=true
existingPeerGroupRowsBefore=0
existingPeerGroupRowsAfter=3
rowsCreated=3
rowsUpdated=0
eligiblePeerGroupRows=3
blockedPeerGroupRows=0
productionApprovedTrueCount=0
needsReviewTrueCount=3
smokePassed=true
```

Runtime DB writes were limited to:

```text
IndustryPeerGroup
```

## Idempotency Result

Second confirm-write:

```text
existingPeerGroupRowsBefore=3
existingPeerGroupRowsAfter=3
rowsCreated=0
rowsUpdated=3
idempotencyPassed=true
productionApprovedTrueCount=0
needsReviewTrueCount=3
smokePassed=true
```

No duplicate rows were created.

## Smoke / Read-Back Result

Script:

```text
scripts/smoke-steel-peer-group-read-path.ts
```

Output summary:

```text
industrySteelMaterialsExists=true
companyIndustryHpgSteelMaterialsExists=true
peerGroupRowsFound=3
hsgDirectPeerExists=true
nkgDirectPeerExists=true
tvnAdjacentPeerExists=true
allPeerRowsResearchOnlyNeedsReview=true
allPeerRowsHaveProviderSource=true
productionApprovedTrueCount=0
industryMetricCreated=false
valuationRiskBenchmarkCreated=false
uiLayoutChanged=false
assistantPeerGroupWired=false
smokePassed=true
```

## Rows Created / Updated

First confirm-write:

```text
IndustryPeerGroup created=3
IndustryPeerGroup updated=0
```

Idempotency rerun:

```text
IndustryPeerGroup created=0
IndustryPeerGroup updated=3
```

## Affected Industry / Tickers

```text
industryCode=STEEL_MATERIALS
anchorTicker=HPG
affectedPeerTickers=HSG, NKG, TVN
```

## Role Decisions Written

```text
HSG=direct_peer
NKG=direct_peer
TVN=adjacent_peer
```

These rows are taxonomy/peer grouping candidates only. They are not valuation or risk benchmarks.

## Guardrail Results

```text
dbWriteAttempted=true, limited to IndustryPeerGroup
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
industryRowsWritten=0
companyIndustryRowsWritten=0
industryContextRowsUpdated=0
industryContextProvenanceRowsWritten=0
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
uiLayoutChanged=false
assistantPeerGroupWired=false
productionApprovedTrueCount=0
needsReviewTrueCount=3
fakePeerGroupsCreated=false
staticGuidancePromotedToRealData=false
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
npm run lint: fail due old/out-of-scope lint debt, not Phase 150P files
targeted lint for Phase 150P files: pass
confirm-write dry-run: pass
confirm-write first run: pass
confirm-write idempotency rerun: pass
smoke read-back: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, assistant, screening, financials, and audit scripts/modules.
New/touched Phase 150P files passed targeted lint:
- scripts/confirm-write-steel-peer-group-reviewed-sources.ts
- scripts/smoke-steel-peer-group-read-path.ts
```

## Known Limitations

```text
Peer groups are written but not yet wired into UI or Assistant runtime.
Rows remain research_only and needsReview=true.
No IndustryMetric model exists.
No valuation/risk benchmarks exist.
No exact extractedQuote is stored.
```

## Recommended Phase 150Q

Wire steel peer groups into read-path/API/Assistant safely without UI redesign:

```text
Expose HSG/NKG/TVN peer-group rows as research_only and needsReview.
Keep peer groups distinct from valuation/risk benchmarks.
Do not create metrics.
Do not create buy/sell/hold conclusions.
```

## Commit

Pending.
