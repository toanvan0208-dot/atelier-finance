# Phase 150I — Industry Taxonomy Schema Readiness

## Phase Objective

Add schema support for industry taxonomy, ticker-to-industry mapping, and peer-group mapping, then dry-run migration/read-path readiness without writing runtime taxonomy data.

Phase 150I did not insert `Industry`, `CompanyIndustry`, or `IndustryPeerGroup` runtime rows. It did not fetch providers, import CSV, redesign UI, create `IndustryMetric`, create valuation/risk benchmarks, collect source packages, or promote any candidate/research data to `productionApproved=true`.

## Starting Commit

`e7166401295ffba25e2b24c8f43fecbe38abd65b`

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
```

Migration/schema:

```text
node scripts/run-staging.mjs npx prisma format
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npx prisma migrate deploy
node scripts/run-staging.mjs npx prisma migrate status
```

Dry-run/readiness:

```text
node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-taxonomy-schema-readiness.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/dry-run-industry-taxonomy-schema-readiness.ts
node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-taxonomy-schema-readiness.ts
```

## Files Changed

```text
prisma/schema.prisma
prisma/migrations/20260701093000_add_industry_taxonomy_models/migration.sql
scripts/dry-run-industry-taxonomy-schema-readiness.ts
docs/product/evidence/PHASE150I_INDUSTRY_TAXONOMY_SCHEMA_READINESS.md
```

## Schema / Model Changes

Added `Industry`:

```text
industryCode unique
industryName
displayNameVi
sectorCode / sectorName
classificationSystem
description
dataMode default research_only
productionApproved default false
needsReview default true
warningCodes default []
```

Added `CompanyIndustry`:

```text
ticker
industryCode relation to Industry.industryCode
roleType default ambiguous
segmentDescription
mappingConfidence default missing
sourceLabel/sourceUrl/sourceType
publicationDate or retrievedAt
reviewNote or extractedQuote
warningCodes default []
dataMode default research_only
productionApproved default false
needsReview default true
unique key: ticker + industryCode + roleType + sourceLabel + sourceUrl
```

Added `IndustryPeerGroup`:

```text
industryCode relation to Industry.industryCode
peerTicker
peerRole default ambiguous
inclusionReason
sourceLabel/sourceUrl/sourceType
publicationDate or retrievedAt
reviewNote or extractedQuote
warningCodes default []
dataMode default research_only
productionApproved default false
needsReview default true
unique key: industryCode + peerTicker + peerRole + sourceLabel + sourceUrl
```

No `IndustryMetric` model was created.

## Migration

Migration name:

```text
20260701093000_add_industry_taxonomy_models
```

Migration application result:

```text
migrationApplied=true
schemaWriteOnly=true
runtimeTaxonomyRowsWritten=0
```

The migration creates only tables, indexes, and foreign keys. It does not insert or update runtime taxonomy data.

## Why These Models Are Needed

`Company.industryCode` and `Company.industryName` can store a simple profile label, but they cannot safely represent:

```text
multiple industry mappings per ticker
primary vs secondary roles
ambiguous multi-segment caveats
mapping confidence
classification system
source URL/source type/source date/evidence note
peer-group inclusion reason
candidate/research warning codes
```

The new taxonomy models provide durable schema support while still keeping data collection and confirm-write separate.

## Why `IndustryMetric` Remains Delayed

`IndustryMetric` remains delayed because:

```text
taxonomy and ticker mapping must be stable first
numeric metrics need source/unit/frequency contracts
benchmark semantics are high-risk for low-financial-literacy users
static signal names must not become placeholder metrics
```

## Dry-Run Results

Script:

```text
scripts/dry-run-industry-taxonomy-schema-readiness.ts
```

Output summary:

```text
phase=150I
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=true
industryModelFound=true
companyIndustryModelFound=true
industryPeerGroupModelFound=true
industryMetricModelFound=false
taxonomyTablesReadable=true
currentIndustryContextRowsFound=5
companyRowsFound=5
existingIndustryRows=0
existingCompanyIndustryRows=0
existingIndustryPeerGroupRows=0
candidateIndustryRowsGenerated=5
candidateCompanyIndustryRowsGenerated=6
candidatePeerGroupRowsGenerated=5
eligibleReviewedMappings=0
blockedRows=16
currentSchemaCanSupportTaxonomy=true
vcbMissingSafe=true
missingSafeTickers=VCB
productionApprovedTrueCount=0
smokePassed=true
```

Blocked reasons:

```text
REVIEWED_CLASSIFICATION_SOURCE_REQUIRED
RUNTIME_TAXONOMY_DATA_WRITE_DEFERRED
STATIC_GUIDANCE_NOT_ALLOWED_AS_TAXONOMY_SOURCE
INDUSTRY_METRIC_SOURCE_CONTRACT_NOT_DEFINED
```

## Read-Path Behavior

Runtime/UI/Assistant read paths remain unchanged in Phase 150I.

```text
No Industry UI layout changes.
No Industry UI section order changes.
No Assistant taxonomy injection yet.
No static compass guidance promoted to DB taxonomy.
No taxonomy rows are shown because no reviewed taxonomy rows exist yet.
VCB remains missing-safe.
```

## VCB Missing Handling

VCB remains missing-safe:

```text
Company row not found in current supported snapshot.
IndustryContext not found.
No CompanyIndustry row inserted.
No peer-group row inserted.
No fallback mapping created from static guidance.
```

## Guardrail Results

```text
dbWriteAttempted=false for runtime taxonomy data
schemaMigrationApplied=true
providerFetchAttempted=false
csvImportAttempted=false
uiLayoutChanged=false
industryMetricCreated=false
valuationRiskBenchmarksInvented=false
staticGuidancePromotedToRealData=false
companyAnnualReportsUsedAsPrimaryIndustrySource=false
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
npm run lint: fail due old/out-of-scope lint debt, not Phase 150I files
targeted lint for Phase 150I script: pass
dry-run taxonomy schema readiness script: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, assistant, and audit scripts/modules.
The new Phase 150I script is not listed in the global lint failures and passed targeted lint.
```

## Known Limitations

```text
Taxonomy tables exist but contain 0 runtime rows.
No reviewed taxonomy source packages exist yet.
No CompanyIndustry mappings are available for UI/Assistant.
No IndustryPeerGroup rows are available.
VCB remains missing-safe.
IndustryMetric remains intentionally absent.
```

## Recommended Phase 150J

Dry-run reviewed taxonomy source packages before any data write:

```text
Phase 150J — Dry-run reviewed Industry / CompanyIndustry / PeerGroup source packages
```

Recommended scope:

```text
No UI redesign.
No provider fetch unless explicitly approved.
No numeric metrics.
No runtime data writes until eligible reviewed mappings exist.
Prepare source packages for FPT, MWG, VNM, HPG, MSN, VCB where source URL/date/evidence exists.
Keep partial coverage acceptable.
```

## Commit

Recorded in the Phase 150I Git commit.
