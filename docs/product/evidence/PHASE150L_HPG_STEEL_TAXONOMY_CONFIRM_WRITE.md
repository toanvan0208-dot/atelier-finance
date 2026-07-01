# Phase 150L - HPG Steel Taxonomy Confirm-Write

## Phase Objective

Confirm-write only the eligible reviewed taxonomy rows from Phase 150K:

```text
Industry: STEEL_MATERIALS
CompanyIndustry: HPG primary mapping to STEEL_MATERIALS
```

Phase 150L did not write `IndustryPeerGroup` rows, create `IndustryMetric`, create valuation/risk benchmarks, update `IndustryContext`, fetch providers, import CSV, redesign UI, or set `productionApproved=true`.

## Starting Commit

`dbe391a51c82b7ce20fc6de725def319726be074`

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
git checkout -- tsconfig.tsbuildinfo
```

Inspection:

```text
Get-Content scripts/industry-taxonomy-reviewed-sources.ts
Get-Content scripts/dry-run-industry-taxonomy-reviewed-sources.ts
Get-Content docs/product/evidence/PHASE150K_HPG_STEEL_TAXONOMY_SOURCE_DRY_RUN.md
Select-String prisma/schema.prisma for Industry taxonomy models
```

Dry-run / confirm-write / smoke:

```text
node scripts/run-staging.mjs npx eslint scripts/confirm-write-industry-taxonomy-reviewed-sources.ts scripts/smoke-industry-taxonomy-read-path.ts scripts/industry-taxonomy-reviewed-sources.ts scripts/dry-run-industry-taxonomy-reviewed-sources.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-industry-taxonomy-reviewed-sources.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-industry-taxonomy-reviewed-sources.ts --confirm-write
node scripts/run-staging.mjs npx tsx scripts/confirm-write-industry-taxonomy-reviewed-sources.ts --confirm-write
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-taxonomy-read-path.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/confirm-write-industry-taxonomy-reviewed-sources.ts scripts/smoke-industry-taxonomy-read-path.ts scripts/industry-taxonomy-reviewed-sources.ts scripts/dry-run-industry-taxonomy-reviewed-sources.ts
```

## Files Changed

```text
scripts/confirm-write-industry-taxonomy-reviewed-sources.ts
scripts/smoke-industry-taxonomy-read-path.ts
docs/product/evidence/PHASE150L_HPG_STEEL_TAXONOMY_CONFIRM_WRITE.md
```

## Source Package Summary

Phase 150L reused the Phase 150K reviewed source packages:

```text
sourcePackagesLoaded=2
industryPackagesLoaded=1
companyIndustryPackagesLoaded=1
peerGroupPackagesLoaded=0
sourceLabel=Vietstock - Ho so doanh nghiep HPG
sourceUrl=https://finance.vietstock.vn/HPG/ho-so-doanh-nghiep.htm
sourceType=provider_taxonomy
retrievedAt=2026-07-01
dataMode=research_only
productionApproved=false
needsReview=true
```

## Dry-Run Result

Script:

```text
scripts/confirm-write-industry-taxonomy-reviewed-sources.ts
```

Dry-run output:

```text
mode=dry-run
confirmWriteRequested=false
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
sourcePackagesLoaded=2
eligibleIndustryRows=1
eligibleCompanyIndustryRows=1
eligiblePeerGroupRows=0
blockedRows=0
rowsCreated.industry=0
rowsCreated.companyIndustry=0
rowsCreated.industryPeerGroup=0
productionApprovedTrueCount=0
smokePassed=true
```

## Confirm-Write Result

Confirm-write first run:

```text
mode=confirm-write
dbWriteAttempted=true
rowsCreated.industry=1
rowsCreated.companyIndustry=1
rowsCreated.industryPeerGroup=0
rowsUpdated.industry=0
rowsUpdated.companyIndustry=0
rowsUpdated.industryPeerGroup=0
industryRowExistsAfter=true
companyIndustryRowExistsAfter=true
peerGroupRowsAfter=0
productionApprovedTrueCount=0
needsReviewTrueCount=2
smokePassed=true
```

Runtime DB writes were limited to:

```text
Industry
CompanyIndustry
```

No `IndustryPeerGroup` rows were written.

## Idempotency Result

An immediate parallel rerun hit the Supabase session pool limit:

```text
EMAXCONNSESSION max clients reached in session mode
```

The idempotency rerun was then executed sequentially and passed:

```text
rowsCreated.industry=0
rowsCreated.companyIndustry=0
rowsCreated.industryPeerGroup=0
rowsUpdated.industry=1
rowsUpdated.companyIndustry=1
rowsUpdated.industryPeerGroup=0
industryRowExistsBefore=true
companyIndustryRowExistsBefore=true
industryRowExistsAfter=true
companyIndustryRowExistsAfter=true
peerGroupRowsBefore=0
peerGroupRowsAfter=0
productionApprovedTrueCount=0
needsReviewTrueCount=2
idempotencyPassed=true
smokePassed=true
```

## Smoke / Read-Back Result

Script:

```text
scripts/smoke-industry-taxonomy-read-path.ts
```

Output:

```text
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
industryTableReadable=true
companyIndustryTableReadable=true
industryPeerGroupTableReadable=true
industryRowSteelMaterialsExists=true
companyIndustryHpgSteelMaterialsExists=true
productionApprovedTrueCount=0
needsReviewTrueCount=2
peerGroupRowsFound=0
industryMetricCreated=false
vcbMissingSafe=true
uiLayoutChanged=false
smokePassed=true
```

## Rows Created / Updated

First confirm-write:

```text
Industry created=1
CompanyIndustry created=1
IndustryPeerGroup created=0
```

Idempotency rerun:

```text
Industry created=0, updated=1
CompanyIndustry created=0, updated=1
IndustryPeerGroup created=0, updated=0
```

## Affected Industry / Ticker

```text
affectedIndustry=STEEL_MATERIALS
affectedTicker=HPG
roleType=primary
mappingConfidence=medium
sourceType=provider_taxonomy
```

## Peer Group Status

```text
peerGroupSourcePackages=[]
peerGroupRowsCreated=0
peerGroupRowsFound=0
fakePeerGroupsCreated=false
```

## VCB Missing Handling

VCB remains missing-safe:

```text
No VCB Industry row.
No VCB CompanyIndustry mapping.
No fallback mapping.
```

## Guardrail Results

```text
dbWriteAttempted=true, limited to Industry and CompanyIndustry
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
industryContextContentUpdated=false
industryPeerGroupRowsWritten=0
industryMetricCreated=false
valuationRiskBenchmarksInvented=false
uiLayoutChanged=false
productionApprovedTrueCount=0
needsReviewTrueCount=2
staticGuidancePromotedToRealData=false
companyAnnualReportsUsedAsPrimaryIndustrySource=false
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
npm run lint: fail due old/out-of-scope lint debt, not Phase 150L files
targeted lint for Phase 150L files: pass
confirm-write dry-run: pass
confirm-write first run: pass
confirm-write idempotency rerun: pass
smoke read-back: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, assistant, and audit scripts/modules.
New/touched Phase 150L files passed targeted lint:
- scripts/confirm-write-industry-taxonomy-reviewed-sources.ts
- scripts/smoke-industry-taxonomy-read-path.ts
```

## Known Limitations

```text
Only HPG -> STEEL_MATERIALS has reviewed taxonomy coverage.
No peer group rows exist yet.
No IndustryMetric model exists.
No valuation/risk benchmarks exist.
The source remains research_only and needs review.
UI and Assistant are not wired to taxonomy rows in Phase 150L.
```

## Recommended Phase 150M

Add read-path integration for taxonomy rows without UI redesign:

```text
Load Industry and CompanyIndustry rows for supported tickers.
Expose HPG -> STEEL_MATERIALS with research_only / needsReview caveats.
Keep missing tickers missing-safe.
Do not infer peer groups or metrics.
Do not create benchmarks.
```

## Commit

Recorded in the Phase 150L Git commit.
