# Phase 149B Vietnam Macro Source Acquisition Batch

## Phase
Phase 149B — Vietnam macro source acquisition batch for USD/VND, export, credit, and public investment.

## Scope
Target indicators only:
- `USD_VND`
- `EXPORT_GROWTH`
- `CREDIT_GROWTH`
- `PUBLIC_INVESTMENT`

Out of scope: parser/import, DB writes, `MacroObservation`, `MacroObservationProvenance`, production approval, numeric extraction, new frontend indicators, or investment conclusions.

## Starting Commit
`31e62e47549a2219f1ddde5f9e02a0b54eeef4a8`

## Files Audited
- `src/features/macro/lib/macro-indicator-registry.ts`
- `src/features/macro/lib/load-macro-runtime-data.ts`
- `src/features/macro/lib/macro-parser-strategy-registry.ts`
- `src/features/macro/lib/macro-source-verification-registry.ts`
- `src/features/macro/lib/macro-alternate-source-candidates.ts`
- `src/app/api/assistant/route.ts`
- `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`

## Files Changed
- `src/features/macro/lib/vietnam-macro-source-acquisition.ts`
- `src/features/macro/lib/macro-parser-strategy-registry.ts`
- `src/features/macro/lib/macro-source-verification-registry.ts`
- `src/features/macro/lib/macro-alternate-source-candidates.ts`
- `src/app/api/assistant/route.ts`
- `scripts/smoke-vietnam-macro-source-acquisition-batch.ts`
- `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
- `docs/product/evidence/PHASE149B_VIETNAM_MACRO_SOURCE_ACQUISITION_BATCH.md`

## Frontend Visibility
All target indicators are visible in the current Macro frontend:
- `USD_VND`: `usd-vnd -> USD_VND`
- `EXPORT_GROWTH`: `exports -> EXPORT_GROWTH`
- `CREDIT_GROWTH`: `credit-growth -> CREDIT_GROWTH`
- `PUBLIC_INVESTMENT`: `public-investment -> PUBLIC_INVESTMENT`

## Current Mappings
Runtime mapping is maintained by `loadMacroRuntimeData` and the legacy metric map. Missing target indicators are kept as `value=null`, `unit=null`, `period=null`, `asOf=null`, `dataMode=unavailable`, and `productionApproved=false`.

## Source Candidates And Selected Sources
| Indicator | Source candidate status | Selected source | Source URL status |
| --- | --- | --- | --- |
| `USD_VND` | clear URL candidate | Vietcombank Exchange Rate XML API | reachable |
| `EXPORT_GROWTH` | candidate without URL | GSO trade statistics candidate | missing_source_url |
| `CREDIT_GROWTH` | semantic mapping review required | SBV official publication candidate | missing_source_url |
| `PUBLIC_INVESTMENT` | semantic mapping review required | GSO public investment candidate | missing_source_url |

## Provider Fetch
| Indicator | providerFetchAttempted | providerFetchSucceeded | HTTP status | Content type | Source shape |
| --- | --- | --- | --- | --- | --- |
| `USD_VND` | true | true | 200 | `text/xml; charset=utf-8` | `api_candidate` |
| `EXPORT_GROWTH` | false | false | N/A | N/A | `missing_source_url` |
| `CREDIT_GROWTH` | false | false | N/A | N/A | `manual_review_required` |
| `PUBLIC_INVESTMENT` | false | false | N/A | N/A | `source_assessment_needed` |

The `USD_VND` fetch was a reachability check only. Numeric extraction was not attempted.

## Semantic Risks
- `USD_VND`: VCB XML may represent bank exchange-rate quotes rather than SBV central reference rate. Parser dry-run can proceed, but DB write requires product/semantic approval.
- `EXPORT_GROWTH`: Needs an official GSO/World Bank/structured URL and clear period/unit definition before parser work.
- `CREDIT_GROWTH`: Must not substitute M2 growth or lending rates. Needs official source URL and definition: whole economy/system/banking sector, YoY/YTD.
- `PUBLIC_INVESTMENT`: Must confirm whether the metric means realized public investment capital from state budget or another official scope.

## Parser Readiness By Indicator
| Indicator | parserReadiness | readyForParserDryRun | Blocked reasons |
| --- | --- | --- | --- |
| `USD_VND` | ready_for_parser_dry_run | true | none |
| `EXPORT_GROWTH` | blocked | false | missing_source_url |
| `CREDIT_GROWTH` | blocked | false | missing_source_url; semantic_mapping_review_required |
| `PUBLIC_INVESTMENT` | blocked | false | missing_source_url; semantic_mapping_review_required |

## DB And Candidate Row Results
- candidateMacroRows=0
- candidateProvenanceRows=0
- dbWriteAttempted=false
- numericValuesExtracted=0
- observationRowsCreated=0
- provenanceRowsCreated=0
- productionApprovedTrueCount=0

## DB-Backed And Review Status By Indicator
| Indicator | dbBackedStatus | needsReviewStatus | productionReadinessStatus |
| --- | --- | --- | --- |
| `USD_VND` | not_db_backed | needs_review | not_production_approved |
| `EXPORT_GROWTH` | not_db_backed | needs_review | not_production_approved |
| `CREDIT_GROWTH` | not_db_backed | needs_review | not_production_approved |
| `PUBLIC_INVESTMENT` | not_db_backed | needs_review | not_production_approved |

## Assistant Boundary Status
Assistant route now explicitly states that if `USD_VND`, `EXPORT_GROWTH`, `CREDIT_GROWTH`, or `PUBLIC_INVESTMENT` have no system observation, the system does not yet have reviewed data for USD/VND exchange rate, exports, credit growth, or realized public investment capital, and must not conclude sector or stock impact from missing indicators.

## Manual Data Needed From User
If the next phase needs parser/import work, user-provided source clarification may be needed:
1. `USD_VND`: public/API/CSV source, VND per USD convention, and whether the rate is central reference, commercial bank, bid/ask, or average.
2. `EXPORT_GROWTH`: official GSO/World Bank/structured source URL, period, and unit (% YoY or export value).
3. `CREDIT_GROWTH`: official SBV/source URL, period, and definition (whole system/economy/banking sector, YoY/YTD).
4. `PUBLIC_INVESTMENT`: official GSO/MOF/Treasury source URL, period, unit, and scope.

## Guardrail Results
- targetIndicators=USD_VND, EXPORT_GROWTH, CREDIT_GROWTH, PUBLIC_INVESTMENT
- dbWriteAttempted=false
- numericValuesExtracted=0
- candidateMacroRows=0
- candidateProvenanceRows=0
- observationRowsCreated=0
- provenanceRowsCreated=0
- productionApprovedTrueCount=0
- frontendIndicatorUniverseExpanded=false
- assistantDoesNotInventVietnamMacro=true
- investmentAdviceAdded=false
- mockOrSampleAsReal=false
- missingDataZeroFilled=false

## Validation Results
- `node scripts/run-staging.mjs npx prisma validate`: pass
- `node scripts/run-staging.mjs npx prisma generate`: pass
- `node scripts/run-staging.mjs npx prisma migrate status`: pass, database schema is up to date
- `node scripts/run-staging.mjs npm run typecheck`: pass
- `node scripts/run-staging.mjs npm run build`: pass
- `node scripts/run-staging.mjs npm run lint`: fail, global lint is not a clean pass. Failure is pre-existing/out of scope: 201 errors and 72 warnings across legacy scripts and existing macro/assistant files, mostly `no-explicit-any`, `prefer-const`, and unused variables. The Phase 149B smoke script was not listed in lint failures.
- `node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-source-acquisition-batch.ts`: pass

## Smoke Summary
- usdVndFrontendVisible=true
- exportGrowthFrontendVisible=true
- creditGrowthFrontendVisible=true
- publicInvestmentFrontendVisible=true
- dbWriteAttempted=false
- providerFetchAttempted=true
- providerFetchSucceeded=true
- numericValuesExtracted=0
- candidateMacroRows=0
- candidateProvenanceRows=0
- observationRowsCreated=0
- provenanceRowsCreated=0
- productionApprovedTrueCount=0
- missingIndicatorsDoNotZeroFill=true
- assistantDoesNotInventVietnamMacro=true
- guardrailNoInvestmentAdvicePresent=true
- frontendIndicatorUniverseNotExpanded=true
- smokePassed=true

## Recommended Next Phase
Phase 149C should implement a parser dry-run for `USD_VND` only, using the reachable VCB XML source, while keeping DB writes disabled and explicitly validating the exchange-rate semantic mismatch before any confirm-write phase. `EXPORT_GROWTH`, `CREDIT_GROWTH`, and `PUBLIC_INVESTMENT` should remain in source assessment until concrete official URLs and semantic definitions are selected.

## Commit
Pending until Phase 149B commit creation; final report records the immutable commit hash.
