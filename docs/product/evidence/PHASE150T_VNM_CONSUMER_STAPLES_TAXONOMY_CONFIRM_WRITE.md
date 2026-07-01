# Phase 150T — VNM Consumer Staples / Dairy Taxonomy Confirm-Write

## Phase Objective

Add a third source-backed taxonomy mapping:

```text
Industry: CONSUMER_STAPLES_DAIRY
CompanyIndustry: VNM -> CONSUMER_STAPLES_DAIRY, roleType=primary
```

Phase 150T wrote only `Industry` and `CompanyIndustry` rows. It did not write `IndustryPeerGroup`, `IndustryContext`, `IndustryContextProvenance`, `IndustryMetric`, valuation/risk benchmarks, UI wiring, or Assistant wiring.

## Starting Commit

`a001417f442381737964868d524c231e3cfcd870`

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
Get-Content scripts/confirm-write-mwg-retail-taxonomy-reviewed-sources.ts
Get-Content scripts/smoke-mwg-retail-taxonomy-read-path.ts
Select-String -Path prisma/schema.prisma -Pattern "model Industry|model CompanyIndustry|model IndustryPeerGroup" -Context 0,60
Get-Content docs/product/evidence/PHASE150S_MWG_RETAIL_TAXONOMY_READ_PATH_UI_ASSISTANT.md
```

Validation / write / smoke:

```text
node scripts/run-staging.mjs npx eslint scripts/industry-taxonomy-reviewed-sources.ts scripts/confirm-write-vnm-consumer-staples-taxonomy-reviewed-sources.ts scripts/smoke-vnm-consumer-staples-taxonomy-read-path.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-vnm-consumer-staples-taxonomy-reviewed-sources.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-vnm-consumer-staples-taxonomy-reviewed-sources.ts --confirm-write
node scripts/run-staging.mjs npx tsx scripts/confirm-write-vnm-consumer-staples-taxonomy-reviewed-sources.ts --confirm-write
node scripts/run-staging.mjs npx tsx scripts/smoke-vnm-consumer-staples-taxonomy-read-path.ts
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
```

Note: one parallel idempotency/smoke attempt hit Supabase session pool limit (`EMAXCONNSESSION`). The same commands were rerun sequentially and passed.

## Files Changed

```text
scripts/industry-taxonomy-reviewed-sources.ts
scripts/confirm-write-vnm-consumer-staples-taxonomy-reviewed-sources.ts
scripts/smoke-vnm-consumer-staples-taxonomy-read-path.ts
docs/product/evidence/PHASE150T_VNM_CONSUMER_STAPLES_TAXONOMY_CONFIRM_WRITE.md
```

## Source Package Summary

Added controlled reviewed source packages:

```text
Industry package:
industryCode=CONSUMER_STAPLES_DAIRY
industryName=Consumer Staples - Dairy
displayNameVi=Hang tieu dung thiet yeu - Sua
sectorCode=CONSUMER_STAPLES
sourceType=provider_taxonomy
sourceUrl=https://finance.vietstock.vn/VNM/ho-so-doanh-nghiep.htm
publicationDate=null
retrievedAt=2026-07-01
extractedQuote=null
dataMode=research_only
productionApproved=false
needsReview=true

CompanyIndustry package:
ticker=VNM
industryCode=CONSUMER_STAPLES_DAIRY
roleType=primary
mappingConfidence=medium
sourceType=provider_taxonomy
sourceUrl=https://finance.vietstock.vn/VNM/ho-so-doanh-nghiep.htm
publicationDate=null
retrievedAt=2026-07-01
extractedQuote=null
dataMode=research_only
productionApproved=false
needsReview=true
```

Warning codes include:

```text
RESEARCH_ONLY
NEEDS_REVIEW
PROVIDER_TAXONOMY
TAXONOMY_NEEDS_REVIEW
CONSUMER_STAPLES_DAIRY_TAXONOMY_NEEDS_REVIEW
```

## Dry-Run Result

```text
phase=150T
mode=dry-run
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
eligibleIndustryRows=1
eligibleCompanyIndustryRows=1
eligiblePeerGroupRows=0
blockedRows=0
readyForConfirmWrite=true
productionApprovedTrueCount=0
industryMetricCreated=false
valuationRiskBenchmarkInvented=false
smokePassed=true
```

## Confirm-Write Result

First confirm-write:

```text
dbWriteAttempted=true
industryRowsCreated=1
companyIndustryRowsCreated=1
peerGroupRowsCreated=0
productionApprovedTrueCount=0
needsReviewTrueCount=2
smokePassed=true
```

Written rows:

```text
Industry: CONSUMER_STAPLES_DAIRY
CompanyIndustry: VNM -> CONSUMER_STAPLES_DAIRY, primary
```

## Idempotency Result

Second confirm-write:

```text
industryRowsCreated=0
companyIndustryRowsCreated=0
industryRowsUpdated=1
companyIndustryRowsUpdated=1
peerGroupRowsCreated=0
idempotencyPassed=true
productionApprovedTrueCount=0
```

No duplicate `Industry` or `CompanyIndustry` row was created.

## Smoke / Read-Back Result

Script:

```text
scripts/smoke-vnm-consumer-staples-taxonomy-read-path.ts
```

Result:

```text
industryConsumerStaplesDairyExists=true
companyIndustryVnmConsumerStaplesDairyExists=true
roleType=primary
mappingConfidence=medium
dataMode=research_only
productionApprovedFalse=true
needsReviewTrue=true
sourceType=provider_taxonomy
sourceUrlPresent=true
retrievedAtPresent=true
reviewNotePresent=true
extractedQuoteNull=true
vnmTaxonomyReadable=true
vnmPeerGroupRowsCreated=0
vnmPeerGroupMissingSafe=true
smokePassed=true
```

## Regression Checks

HPG:

```text
hpgSteelPeerGroupIntact=true
STEEL_MATERIALS peer rows remain 3
```

MWG:

```text
mwgRetailTaxonomyIntact=true
MWG -> RETAIL primary mapping remains present
```

VCB:

```text
vcbMissingSafe=true
No fallback taxonomy or peer group was created.
```

## Why No Peer Group Was Created

Phase 150T only creates VNM taxonomy identity and company mapping. It does not create VNM peers because no reviewed peer-group source package was approved for this phase, and peer groups must not be inferred from taxonomy membership.

## Guardrail Results

```text
dbWriteAttempted=true, limited to Industry and CompanyIndustry
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=false
IndustryPeerGroup rows written=0
IndustryContext rows updated=0
IndustryContextProvenance rows written=0
IndustryMetric created=false
valuationRiskBenchmarkInvented=false
uiLayoutChanged=false
assistantWiringChanged=false
productionApprovedTrueCount=0
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
targeted lint for Phase 150T files: pass
dry-run confirm script: pass
confirm-write: pass
idempotency rerun: pass
read-back smoke: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150T files
```

Global lint still reports older macro, market-price, technical, and audit-script debt. New/touched Phase 150T files passed targeted lint.

## Known Limitations

```text
VNM taxonomy remains research_only and needsReview.
No VNM peer group exists.
No numeric industry metrics exist.
No valuation/risk benchmarks exist.
No VNM Assistant/UI wiring was added in this phase.
The mapping is not production-approved.
```

## Recommended Phase 150U

Wire VNM taxonomy into runtime/API/Assistant/UI with the same caveats used for HPG and MWG, while keeping VNM peer group, IndustryMetric, and valuation/risk benchmarks unavailable until separately reviewed.

## Commit

Pending.
