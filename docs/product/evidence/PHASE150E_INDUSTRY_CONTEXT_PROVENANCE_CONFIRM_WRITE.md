# Phase 150E — IndustryContextProvenance Migration and Confirm-Write Guard

## Phase Objective

Apply the existing `IndustryContextProvenance` migration, then create a guarded dry-run and confirm-write path for reviewed qualitative industry provenance sidecar rows.

No `IndustryContext` content rows were created or updated. No numeric `IndustryMetric`, valuation/risk benchmark, provider fetch, CSV import, or UI redesign was added.

## Starting Commit

`8bf5bb5cd3d0c3efeac87fc9c7c655a7529af26b`

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
```

Migration:

```text
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npx prisma migrate deploy
node scripts/run-staging.mjs npx prisma migrate status
```

Dry-run / smoke:

```text
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
node scripts/run-staging.mjs npx eslint scripts/confirm-write-industry-context-provenance.ts scripts/smoke-industry-context-provenance-read-path.ts
```

## Files Changed

```text
scripts/confirm-write-industry-context-provenance.ts
scripts/smoke-industry-context-provenance-read-path.ts
docs/product/evidence/PHASE150E_INDUSTRY_CONTEXT_PROVENANCE_CONFIRM_WRITE.md
```

## Migration Application Result

Migration applied:

```text
20260630142000_add_industry_context_provenance
```

`prisma migrate deploy` applied the existing Phase 150D migration. A follow-up `prisma migrate status` reported:

```text
Database schema is up to date.
```

No new migration was created in Phase 150E.

## Candidate Provenance Source Summary

Repo-reviewed evidence currently does not contain enough row-level provenance to write reviewed sidecar rows.

Available evidence:

```text
docs/product/INDUSTRY_MVP_REVIEWED_CONTEXT_EVIDENCE.md
```

Limitation:

```text
The evidence records manual_research_context/sourceLabel-style metadata only. It does not provide real sourceUrl, publicationDate/retrievedAt, or extractedQuote/reviewNote for reviewed provenance.
```

Because source URLs/evidence notes were not available, Phase 150E did not encode reviewed manual constants and did not write sidecar rows.

## Dry-Run Result

Script:

```text
scripts/confirm-write-industry-context-provenance.ts
```

Dry-run output:

```text
mode=dry-run
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
migrationApplied=true
sidecarTableReadable=true
currentIndustryContextRowsFound=5
existingProvenanceRowsBefore=0
candidateRowsGenerated=6
eligibleRows=0
blockedRows=6
rowsCreated=0
rowsUpdated=0
existingProvenanceRowsAfter=0
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

Ticker-level dry-run result:

```text
FPT: target IndustryContext found; blocked because no real sourceUrl, publication/retrieved date, sourceType, or extractedQuote/reviewNote.
MWG: target IndustryContext found; blocked because no real sourceUrl, publication/retrieved date, sourceType, or extractedQuote/reviewNote.
VNM: target IndustryContext found; blocked because no real sourceUrl, publication/retrieved date, sourceType, or extractedQuote/reviewNote.
HPG: target IndustryContext found; blocked because no real sourceUrl, publication/retrieved date, sourceType, or extractedQuote/reviewNote.
MSN: target IndustryContext found; blocked because no real sourceUrl, publication/retrieved date, sourceType, or extractedQuote/reviewNote.
VCB: no target IndustryContext found; missing-safe; no provenance row written.
```

## Confirm-Write Result

Confirm-write was not executed.

Reason:

```text
eligibleRows=0
```

This follows the Phase 150E guardrail: no sidecar row may be written from `sourceLabel` only, a vague source, a placeholder URL, static guidance, or generated context without reviewed source metadata.

## Idempotency Result

Idempotency write test was not executed because there were no eligible rows to write.

The confirm-write script is idempotent for future eligible rows through the unique key:

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

Runtime loader now sees the sidecar table as readable. Existing IndustryContext rows still carry `INDUSTRY_CONTEXT_PROVENANCE_MISSING` until reviewed provenance rows are written.

## Ticker Coverage

```text
FPT: IndustryContext readable; provenance sidecar missing; blocked for reviewed import.
MWG: IndustryContext readable; provenance sidecar missing; blocked for reviewed import.
VNM: IndustryContext readable; provenance sidecar missing; blocked for reviewed import.
HPG: IndustryContext readable; provenance sidecar missing; blocked for reviewed import.
MSN: IndustryContext readable; provenance sidecar missing; blocked for reviewed import.
VCB: missing IndustryContext; handled safely with no fallback.
```

## Guardrail Results

```text
providerFetchAttempted=false
csvImportAttempted=false
runtimeIndustryContextContentWrites=false
industryContextProvenanceRowsWritten=0
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
prisma migrate status: pass, database schema is up to date
npm run build: pass
npm run typecheck: pass
npm run lint: fail due old/out-of-scope lint debt, not Phase 150E files
targeted lint for Phase 150E files: pass
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

New Phase 150E files passed targeted lint:
- scripts/confirm-write-industry-context-provenance.ts
- scripts/smoke-industry-context-provenance-read-path.ts
```

## Known Limitations

```text
Sidecar table exists and is readable, but contains 0 rows.
Current reviewed evidence does not have real sourceUrl/publicationDate/extractedQuote or reviewNote.
Existing IndustryContext rows remain research_only and needs_review.
Legacy mock-labeled text remains suppressed at runtime.
VCB still has no IndustryContext row.
No numeric industry metrics or valuation/risk benchmarks exist.
```

## Recommended Phase 150F

Collect reviewed qualitative source metadata for each supported ticker, then rerun `scripts/confirm-write-industry-context-provenance.ts`.

Minimum source package per ticker:

```text
industryContextId
ticker
industryName
sourceLabel
sourceUrl
sourceType
publicationDate or retrievedAt
extractedQuote or reviewNote
warningCodes
productionApproved=false
needsReview=true
```

Only then run `--confirm-write` and rerun the smoke script.

## Commit

Pending.
