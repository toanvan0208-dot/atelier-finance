# Phase 150F — IndustryContextProvenance Source Packages

## Phase Objective

Create a controlled reviewed source package path for `IndustryContextProvenance`, then dry-run the guarded confirm-write flow. Correct provenance remains more important than coverage.

Phase 150F did not fetch providers, import CSV, create numeric `IndustryMetric`, create valuation/risk benchmarks, redesign UI, update `IndustryContext` content rows, or create a VCB context.

## Starting Commit

`a2dba6d0ceca210e23cf312c45fa63161ac88c0a`

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
Get-Content scripts/confirm-write-industry-context-provenance.ts
Get-Content scripts/smoke-industry-context-provenance-read-path.ts
Get-Content docs/product/evidence/PHASE150E_INDUSTRY_CONTEXT_PROVENANCE_CONFIRM_WRITE.md
rg -n "IndustryContext|industry provenance|sourceUrl|publicationDate|extractedQuote|reviewNote|manual_research_context|staging_macro_industry_research_seed" docs/product scripts src/features/industry prisma/schema.prisma
```

Dry-run / smoke:

```text
node scripts/run-staging.mjs npx eslint scripts/industry-context-provenance-reviewed-sources.ts scripts/confirm-write-industry-context-provenance.ts scripts/smoke-industry-context-provenance-read-path.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-industry-context-provenance.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-context-provenance-read-path.ts
```

Validation:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/industry-context-provenance-reviewed-sources.ts scripts/confirm-write-industry-context-provenance.ts scripts/smoke-industry-context-provenance-read-path.ts
node scripts/run-staging.mjs npx tsx scripts/confirm-write-industry-context-provenance.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-industry-context-provenance-read-path.ts
```

## Files Changed

```text
scripts/industry-context-provenance-reviewed-sources.ts
scripts/confirm-write-industry-context-provenance.ts
scripts/smoke-industry-context-provenance-read-path.ts
docs/product/evidence/PHASE150F_INDUSTRY_CONTEXT_PROVENANCE_SOURCE_PACKAGES.md
```

## Source Package Summary

Added a controlled source package module:

```text
scripts/industry-context-provenance-reviewed-sources.ts
```

The module defines the required reviewed package shape and supported tickers, but intentionally contains zero source packages:

```text
sourcePackagesLoaded=0
```

Reason:

```text
Repo-reviewed evidence currently has sourceLabel/manual research context only. It does not provide real sourceUrl, publicationDate/retrievedAt, or extractedQuote/reviewNote for any supported ticker.
```

No source URL was invented. No homepage-only or placeholder source was accepted.

## Accepted / Rejected Source Packages

Accepted:

```text
none
```

Rejected / blocked:

```text
FPT: missing real sourceUrl, sourceType, publication/retrieved date, extractedQuote/reviewNote.
MWG: missing real sourceUrl, sourceType, publication/retrieved date, extractedQuote/reviewNote.
VNM: missing real sourceUrl, sourceType, publication/retrieved date, extractedQuote/reviewNote.
HPG: missing real sourceUrl, sourceType, publication/retrieved date, extractedQuote/reviewNote.
MSN: missing real sourceUrl, sourceType, publication/retrieved date, extractedQuote/reviewNote.
VCB: missing IndustryContext target and all reviewed provenance fields.
```

## Dry-Run Result

Script:

```text
scripts/confirm-write-industry-context-provenance.ts
```

Dry-run output:

```text
phase=150F
mode=dry-run
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
migrationApplied=true
sidecarTableReadable=true
currentIndustryContextRowsFound=5
existingProvenanceRowsBefore=0
sourcePackagesLoaded=0
candidateRowsGenerated=6
eligibleRows=0
blockedRows=6
rowsCreated=0
rowsUpdated=0
existingProvenanceRowsAfter=0
affectedTickers=[]
blockedTickers=FPT, HPG, MSN, MWG, VCB, VNM
productionApprovedTrueCount=0
needsReviewTrueCount=0
fakeSourceUrlInvented=false
staticGuidancePromotedToRealData=false
numericIndustryMetricsInvented=false
valuationRiskBenchmarksInvented=false
missingDataZeroFilled=false
investmentAdviceAdded=false
smokePassed=true
```

Blocked reasons:

```text
INVALID_DATA_MODE
MISSING_EXTRACTED_QUOTE_OR_REVIEW_NOTE
MISSING_INDUSTRY_CONTEXT
MISSING_INDUSTRY_NAME
MISSING_PUBLICATION_OR_RETRIEVED_DATE
MISSING_REAL_SOURCE_URL
MISSING_SOURCE_LABEL
MISSING_SOURCE_TYPE
```

## Confirm-Write Result

Confirm-write was not executed.

Reason:

```text
eligibleRows=0
```

No `IndustryContextProvenance` runtime rows were created or updated.

## Idempotency Result

Idempotency write rerun was not executed because confirm-write was not executed.

The script still preserves the idempotent upsert path for future eligible source packages by:

```text
industryContextId + ticker + sourceLabel + sourceUrl
```

## Read-Back / Smoke Result

Script:

```text
scripts/smoke-industry-context-provenance-read-path.ts
```

Smoke output:

```text
phase=150F
dbReadAttempted=true
dbWriteAttempted=false
sidecarTableReadable=true
industryContextRowsFound=5
provenanceRowsFound=0
runtimeProvenanceSummaryReadable=true
readableTickers=FPT, MWG, VNM, HPG, MSN
missingSafeTickers=VCB
productionApprovedTrueCount=0
needsReviewTrueCount=0
noNumericMetricsOrBenchmarks=true
staticGuidancePromotedToRealData=false
missingDataZeroFilled=false
smokePassed=true
```

## Ticker Coverage

```text
FPT: IndustryContext readable; no reviewed source package; provenance remains missing.
MWG: IndustryContext readable; no reviewed source package; provenance remains missing.
VNM: IndustryContext readable; no reviewed source package; provenance remains missing.
HPG: IndustryContext readable; no reviewed source package; provenance remains missing.
MSN: IndustryContext readable; no reviewed source package; provenance remains missing.
VCB: missing IndustryContext; missing-safe; no fallback.
```

## Guardrail Results

```text
providerFetchAttempted=false
csvImportAttempted=false
dbWriteAttempted=false
industryContextProvenanceRowsWritten=0
industryContextContentRowsUpdated=0
industryMetricCreated=false
valuationRiskBenchmarksCreated=false
uiLayoutRedesigned=false
productionApprovedTrueCount=0
fakeSourceUrlInvented=false
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
npm run lint: fail due old/out-of-scope lint debt, not Phase 150F files
targeted lint for Phase 150F files: pass
dry-run confirm script: pass
read-back smoke script: pass
```

Global lint failure boundary:

```text
Global lint still reports existing debt in older macro, market-price, technical, and audit scripts/modules, including:
- scripts/audit-assistant-macro-context-readiness.ts
- scripts/audit-macro-frontend-indicator-scope.ts
- scripts/confirm-write-fred-global-macro-candidates.ts
- scripts/confirm-write-market-price-daily-provider-refresh.ts
- scripts/job-market-price-daily-refresh.ts
- scripts/smoke-market-price-* files
- src/features/macro/types.ts
- src/features/technical/lib/load-technical-runtime-data.ts

New/touched Phase 150F files passed targeted lint:
- scripts/industry-context-provenance-reviewed-sources.ts
- scripts/confirm-write-industry-context-provenance.ts
- scripts/smoke-industry-context-provenance-read-path.ts
```

## Known Limitations

```text
Sidecar table is readable but still has 0 provenance rows.
No reviewed source packages are available in repo yet.
Existing IndustryContext rows remain research_only and needs_review.
Legacy mock-labeled text remains suppressed at runtime.
VCB still has no IndustryContext row.
No numeric industry metrics or valuation/risk benchmarks exist.
```

## Recommended Phase 150G

Manually prepare reviewed source packages for a subset of tickers. Each package must include:

```text
ticker
industryName
sourceLabel
sourceUrl
sourceType
publicationDate or retrievedAt
extractedQuote or reviewNote
warningCodes
dataMode=research_only
productionApproved=false
needsReview=true
```

Partial coverage is acceptable. Run confirm-write only after `eligibleRows > 0`.

## Commit

Pending.
