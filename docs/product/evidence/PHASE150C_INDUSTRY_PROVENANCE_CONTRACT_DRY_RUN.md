# Phase 150C - Industry Provenance Contract Dry Run

## Phase Objective

Define a production-safe industry source/provenance contract and dry-run candidate reviewed industry context payloads without DB writes, provider fetches, CSV imports, schema migrations, numeric industry metrics, valuation/risk benchmarks, or UI redesign.

## Starting Commit

- `88e22c51edc75cae64634275219240cd7e815edb`

## Commands Run

Preflight:

- `git status --short`
- `git diff --stat`
- `git diff`
- `git show --stat --name-only HEAD`
- `git log --oneline -12`

Dry-run and validation:

- `node scripts/run-staging.mjs npx eslint scripts/dry-run-industry-context-provenance-contract.ts`
- `node scripts/run-staging.mjs npx tsx scripts/dry-run-industry-context-provenance-contract.ts`
- `node scripts/run-staging.mjs npx prisma validate`
- `node scripts/run-staging.mjs npx prisma generate`
- `node scripts/run-staging.mjs npx prisma migrate status`
- `node scripts/run-staging.mjs npm run typecheck`
- `node scripts/run-staging.mjs npm run build`
- `node scripts/run-staging.mjs npm run lint`

## Files Changed

- `docs/product/INDUSTRY_PROVENANCE_CONTRACT.md`
- `scripts/dry-run-industry-context-provenance-contract.ts`
- `docs/product/evidence/PHASE150C_INDUSTRY_PROVENANCE_CONTRACT_DRY_RUN.md`

## Current IndustryContext Schema / Source Limitations

Current `IndustryContext` fields:

- `id`
- `industryCode`
- `industryName`
- `contextLanguage`
- `industryOverview`
- `keyDrivers`
- `industryRisks`
- `relatedTickers`
- `asOfDate`
- `sourceLabel`
- `dataMode`
- `productionApproved`
- `needsReview`
- `createdAt`
- `updatedAt`

Schema inspection result:

| Field / model | Status |
| --- | --- |
| `IndustryContext` model | found |
| `sourceLabel` | found |
| `sourceUrl` | missing |
| `publicationDate` | missing |
| `extractedQuote` | missing |
| `warningCodes` | missing |
| `IndustryContextProvenance` sidecar | missing |
| `IndustryMetric` model | missing |

Conclusion: `sourceLabel` is not enough for reviewed industry context provenance. Current schema can safely represent research-only qualitative context, but it cannot safely store full reviewed provenance without a sidecar or extension.

## Proposed Provenance / Source Contract

Documented in `docs/product/INDUSTRY_PROVENANCE_CONTRACT.md`.

Minimum reviewed qualitative context contract:

- supported ticker linkage;
- industry name/code;
- qualitative overview, key drivers, and industry risks;
- `asOfDate`;
- `sourceLabel`;
- future `sourceUrl`;
- future `publicationDate`;
- future `extractedQuote` or reviewed evidence note;
- `dataMode`;
- `productionApproved=false`;
- `needsReview=true`;
- warning/caveat codes;
- explicit missing-source handling.

No source URLs were invented in this phase.

## Dry-Run Results

`scripts/dry-run-industry-context-provenance-contract.ts` output:

- `dbReadAttempted=true`
- `dbWriteAttempted=false`
- `providerFetchAttempted=false`
- `csvImportAttempted=false`
- `schemaChanged=false`
- `supportedTickersChecked=FPT, MWG, VNM, HPG, MSN, VCB`
- `currentIndustryContextRowsFound=5`
- `candidateContractRowsGenerated=5`
- `readyForReviewedImportCount=0`
- `blockedRowsCount=6`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCount=5`
- `fakeSourceUrlInvented=false`
- `numericIndustryMetricsInvented=false`
- `valuationRiskBenchmarksInvented=false`
- `staticGuidancePromotedToRealData=false`
- `missingDataZeroFilled=false`
- `smokePassed=true`

Blocked reasons:

- `MISSING_NATIVE_SOURCE_URL`
- `MISSING_PUBLICATION_DATE_FIELD`
- `MISSING_EXTRACTED_QUOTE_FIELD`
- `LEGACY_MOCK_LABELED_TEXT_SUPPRESSED`
- `MISSING_INDUSTRY_CONTEXT`
- `QUALITATIVE_CONTEXT_INCOMPLETE_AFTER_SUPPRESSION`

## Ticker Coverage Result

| Ticker | Candidate contract row | Ready for reviewed import | Main blockers |
| --- | --- | --- | --- |
| FPT | generated | no | missing native source URL/publication date/extracted quote; legacy mock-labeled text suppressed |
| MWG | generated | no | missing native source URL/publication date/extracted quote; legacy mock-labeled text suppressed |
| VNM | generated | no | missing native source URL/publication date/extracted quote; legacy mock-labeled text suppressed |
| HPG | generated | no | missing native source URL/publication date/extracted quote; legacy mock-labeled text suppressed |
| MSN | generated | no | missing native source URL/publication date/extracted quote; legacy mock-labeled text suppressed |
| VCB | blocked | no | missing IndustryContext; missing provenance fields |

## VCB Missing Handling

VCB remains missing-safe:

- no IndustryContext row was found;
- no static fallback was promoted;
- no source URL was invented;
- no qualitative context was generated;
- missing data remains unavailable.

## Legacy Mock / Static Guidance Handling

Phase 150B already suppresses legacy mock-labeled text in runtime payloads. Phase 150C dry-run confirms the affected tickers:

- FPT
- MWG
- VNM
- HPG
- MSN

Static Industry compass guidance remains static/research guidance. It was not promoted to reviewed DB data.

## Reviewed Import Status

Reviewed industry context import is blocked in the current schema because full row-level provenance cannot be stored:

- no source URL field;
- no publication date field;
- no extracted quote/evidence note field;
- no row-level warning codes field;
- no dedicated provenance sidecar.

Therefore, `readyForReviewedImportCount=0`.

## Model Direction Decision

### Qualitative Industry Context Provenance

Option A - add dedicated `IndustryContextProvenance` / `IndustrySource` model later:

- Pros: preserves current `IndustryContext`, supports multiple evidence rows, mirrors macro provenance separation, avoids overloading qualitative text fields.
- Cons: requires migration and read-path update in a later phase.
- Recommendation: preferred.

Option B - extend `IndustryContext` with `sourceUrl`, `publicationDate`, `extractedQuote`, `reviewNote`, `warningCodes`:

- Pros: simpler query and fewer joins.
- Cons: less flexible for multiple sources/evidence rows; mixes content and provenance.
- Recommendation: acceptable only if product wants one evidence source per industry context.

Option C - reuse existing observation/provenance pattern:

- Pros: proven macro pattern already exists.
- Cons: industry context is qualitative text, not a numeric time-series observation; semantic mismatch.
- Recommendation: not preferred for qualitative context.

Phase 150C recommendation: no schema migration now; use Phase 150D to design and implement a dedicated sidecar if reviewed import remains the next priority.

### Numeric Industry Metrics

Option A - delay numeric metrics:

- Pros: avoids fake/placeholder metrics; waits for stable source/unit contract.
- Cons: valuation/risk benchmarks remain unavailable.
- Recommendation: preferred now.

Option B - add dedicated `IndustryMetric` model later:

- Pros: clean domain model for source/unit/frequency/ticker or industry linkage.
- Cons: requires source decisions and migration.
- Recommendation: likely future direction after qualitative provenance is solved.

Option C - reuse existing observation/provenance pattern:

- Pros: reuse known model pattern.
- Cons: may blur macro versus industry semantics unless carefully scoped.
- Recommendation: evaluate later only if the observation pattern can carry industry dimensions cleanly.

Phase 150C recommendation: do not create `IndustryMetric` now.

## Guardrail Results

- DB writes: no.
- Provider fetch: no.
- CSV import: no.
- Schema migration: no.
- UI redesign: no.
- `productionApproved=true`: 0.
- Fake source URL invented: no.
- Numeric industry metrics invented: no.
- Valuation/risk benchmarks invented: no.
- Static guidance promoted to real data: no.
- Missing data zero-filled: no.

## Validation Results

| Command | Result |
| --- | --- |
| `npx eslint scripts/dry-run-industry-context-provenance-contract.ts` | pass |
| `npx tsx scripts/dry-run-industry-context-provenance-contract.ts` | pass |
| `npx prisma validate` | pass |
| `npx prisma generate` | pass |
| `npx prisma migrate status` | pass |
| `npm run build` | pass |
| `npm run typecheck` | fail: global typecheck is not clean due to old/out-of-scope TypeScript debt |
| `npm run lint` | fail: global lint is not clean due to old/out-of-scope lint debt |

Global typecheck failures were in old/out-of-scope macro/screening scripts/runtime files after the Phase 150C touched loader was fixed. Targeted lint and dry-run for the new Phase 150C script passed.

## Known Limitations

- Current DB rows are still `research_only` and `needsReview=true`.
- Current DB rows do not have native source URLs or extracted evidence.
- VCB has no industry context row.
- Qualitative context can be read safely, but reviewed import should wait for a provenance model/extension.
- Numeric metrics and benchmarks remain unavailable.

## Recommended Phase 150D

Design and implement the selected `IndustryContextProvenance` sidecar or schema extension, then dry-run reviewed qualitative industry context import with real source URLs/evidence notes before any confirm-write.

## Commit

Pending at evidence creation time.
