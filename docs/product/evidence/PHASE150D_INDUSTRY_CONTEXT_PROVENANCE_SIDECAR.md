# Phase 150D — IndustryContextProvenance Sidecar

## Phase Objective

Implement schema support for a qualitative `IndustryContextProvenance` sidecar, keep existing IndustryContext read-path safe, and dry-run reviewed qualitative provenance candidates without writing runtime data.

Phase 150D does not create numeric industry metrics, valuation/risk benchmarks, reviewed IndustryContext rows, or UI redesigns.

## Starting Commit

`8f541e91fe794954c3640d576c0ead6be013c5d6`

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
```

Implementation / dry-run:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-context-provenance-sidecar.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/dry-run-industry-context-provenance-sidecar.ts src/features/industry/lib/load-industry-context.ts
node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-context-provenance-sidecar.ts
```

## Files Changed

```text
prisma/schema.prisma
prisma/migrations/20260630142000_add_industry_context_provenance/migration.sql
src/features/industry/lib/load-industry-context.ts
scripts/dry-run-industry-context-provenance-sidecar.ts
docs/product/evidence/PHASE150D_INDUSTRY_CONTEXT_PROVENANCE_SIDECAR.md
```

## Schema / Model Changes

Added `IndustryContextProvenance` as a sidecar model related to `IndustryContext` by `industryContextId`.

Fields:

```text
id
industryContextId
ticker
industryName
sourceLabel
sourceUrl
sourceType
dataMode
productionApproved
needsReview
publicationDate
retrievedAt
extractedQuote
reviewNote
warningCodes
createdAt
updatedAt
```

Defaults:

```text
dataMode=research_only
productionApproved=false
needsReview=true
warningCodes=[]
```

Indexes/constraints:

```text
unique(industryContextId, ticker, sourceLabel, sourceUrl)
index(industryContextId)
index(ticker)
index(sourceLabel)
index(dataMode)
index(productionApproved)
```

Migration name:

```text
20260630142000_add_industry_context_provenance
```

## Why Sidecar Was Selected

The existing `IndustryContext` model stores qualitative context and `sourceLabel`, but it has no native row-level source URL, publication date, extracted quote, review note, or warning-code contract.

A sidecar is safer than overloading `IndustryContext` because it supports multiple provenance rows per context, preserves existing runtime behavior, and avoids promoting legacy staging/research rows as reviewed-source data.

## Runtime / Read-Path Behavior

`loadIndustryContextRuntimeByTicker` now optionally reads `IndustryContextProvenance` rows and returns a `provenanceSummary`.

If the sidecar table is not readable in the current DB snapshot, the loader returns the existing IndustryContext safely with:

```text
INDUSTRY_CONTEXT_PROVENANCE_SIDECAR_NOT_READABLE
INDUSTRY_CONTEXT_PROVENANCE_MISSING
```

If no provenance rows exist, the runtime payload keeps a clear provenance limitation instead of inventing source data.

Existing readable tickers remain readable:

```text
FPT
MWG
VNM
HPG
MSN
```

`VCB` remains missing-safe with no fallback.

No Industry UI layout, sidebar, navigation, module order, or user flow was changed.

## Dry-Run Results

Dry-run script:

```text
scripts/dry-run-industry-context-provenance-sidecar.ts
```

Result:

```text
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
schemaChanged=true
sidecarModelFound=true
sidecarDbTableReadable=false
sidecarReadError=SIDECAR_TABLE_NOT_APPLIED_OR_NOT_READABLE
currentIndustryContextRowsFound=5
provenanceRowsExisting=0
candidateProvenanceRowsGenerated=0
readyForReviewedImportCount=0
blockedRowsCount=6
productionApprovedTrueCount=0
needsReviewTrueCount=0
industryContextNeedsReviewTrueCount=5
fakeSourceUrlInvented=false
staticGuidancePromotedToRealData=false
numericIndustryMetricsInvented=false
valuationRiskBenchmarksInvented=false
missingDataZeroFilled=false
investmentAdviceAdded=false
smokePassed=true
```

The sidecar model exists in Prisma schema. The migration was created as a file, but Phase 150D did not apply runtime DB migrations or insert runtime data.

## Ticker Coverage

```text
FPT: IndustryContext found; blocked for missing real sourceUrl/publicationDate/extractedQuote or reviewNote; legacy mock-labeled text suppressed.
MWG: IndustryContext found; blocked for missing real sourceUrl/publicationDate/extractedQuote or reviewNote; legacy mock-labeled text suppressed.
VNM: IndustryContext found; blocked for missing real sourceUrl/publicationDate/extractedQuote or reviewNote; legacy mock-labeled text suppressed.
HPG: IndustryContext found; blocked for missing real sourceUrl/publicationDate/extractedQuote or reviewNote; legacy mock-labeled text suppressed.
MSN: IndustryContext found; blocked for missing real sourceUrl/publicationDate/extractedQuote or reviewNote; legacy mock-labeled text suppressed.
VCB: missing IndustryContext; handled safely with no fallback.
```

Blocked reasons:

```text
LEGACY_MOCK_LABELED_TEXT_SUPPRESSED
MISSING_EXTRACTED_QUOTE_OR_REVIEW_NOTE
MISSING_INDUSTRY_CONTEXT
MISSING_PUBLICATION_DATE
MISSING_REAL_SOURCE_URL
```

## Reviewed Import Readiness

Reviewed import is not ready yet.

Reason:

```text
Current rows have no real sourceUrl, no publicationDate, and no extractedQuote/reviewNote suitable for reviewed provenance.
```

Future reviewed import should only write `IndustryContextProvenance` rows when each row has:

```text
industryContextId
ticker
industryName
sourceLabel
sourceUrl
sourceType
dataMode=research_only or reviewed_candidate
productionApproved=false
needsReview=true
publicationDate or as-of date
retrievedAt
extractedQuote or reviewed evidence note
warningCodes
```

## IndustryMetric Status

No `IndustryMetric` model was created.

Decision:

```text
Delay numeric industry metrics until stable source/unit/frequency contracts exist.
```

Reason:

```text
Phase 150D only establishes qualitative source/provenance support. Numeric metrics and valuation/risk benchmarks need separate source acquisition and semantic contracts.
```

## Guardrail Results

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
runtimeDataInserted=false
productionApprovedTrueCount=0
fakeSourceUrlInvented=false
staticGuidancePromotedToRealData=false
numericIndustryMetricsInvented=false
valuationRiskBenchmarksInvented=false
missingDataZeroFilled=false
investmentAdviceAdded=false
uiLayoutRedesigned=false
```

## Validation Results

```text
prisma validate: pass
prisma generate: pass
prisma migrate status: reports unapplied migration 20260630142000_add_industry_context_provenance; not applied in Phase 150D because runtime DB writes are out of scope
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt in existing scripts/modules, not Phase 150D files
targeted lint for Phase 150D files: pass
dry-run script: pass
```

Global lint failure boundary:

```text
Global lint reports existing debt in scripts such as audit-assistant-macro-context-readiness.ts,
audit-macro-frontend-indicator-scope.ts, confirm-write-fred-global-macro-candidates.ts,
market-price scripts, macro smoke scripts, src/features/macro/types.ts, and
src/features/technical/lib/load-technical-runtime-data.ts.

New/touched Phase 150D files passed targeted lint:
- scripts/dry-run-industry-context-provenance-sidecar.ts
- src/features/industry/lib/load-industry-context.ts
```

## Known Limitations

```text
The migration file exists but runtime DB table availability depends on a later migration application step.
No reviewed provenance rows are written in Phase 150D.
Existing IndustryContext rows remain research_only and needs_review.
Legacy mock-labeled text remains suppressed at runtime.
VCB still has no IndustryContext row.
No numeric industry metrics or valuation/risk benchmarks exist.
```

## Recommended Phase 150E

Collect reviewed qualitative source evidence for FPT, MWG, VNM, HPG, and MSN, then confirm-write only valid `IndustryContextProvenance` sidecar rows with:

```text
productionApproved=false
needsReview=true
real sourceUrl
publicationDate/retrievedAt
extractedQuote or reviewed evidence note
warningCodes/caveats
```

Do not create numeric industry metrics until a separate IndustryMetric source contract is ready.

## Commit

Final commit hash is recorded in the Phase 150D close-out report and git history. The exact hash is not embedded here because amending this evidence file changes the commit hash.
