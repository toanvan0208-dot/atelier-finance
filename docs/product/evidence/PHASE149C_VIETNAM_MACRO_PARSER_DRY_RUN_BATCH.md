# Phase 149C Vietnam Macro Parser Dry-Run Batch

## Phase
Phase 149C — Vietnam macro manual/parser dry-run batch for `USD_VND`, `EXPORT_GROWTH`, `CREDIT_GROWTH`, and `PUBLIC_INVESTMENT`.

## Scope
This phase executes parser dry-runs only. It does not write the database, create `MacroObservation`, create `MacroObservationProvenance`, approve production data, add frontend metrics, or turn macro data into investment conclusions.

## Starting Commit
`4a4afe9e4d1823d862b844f3953b2abdd8a4198f`

## Files Audited
- `.gitignore`
- `src/app/api/assistant/route.ts`
- `src/features/macro/lib/vietnam-macro-source-acquisition.ts`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
- `data/manual-review/macro/export-growth/`
- `data/manual-review/macro/credit-growth/`
- `data/manual-review/macro/public-investment/`

## Files Changed
- `.gitignore`
- `scripts/dry-run-vietnam-macro-parser-batch.ts`
- `scripts/smoke-vietnam-macro-parser-dry-run-batch.ts`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_DATA_SOURCE_ASSESSMENT.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
- `docs/product/evidence/PHASE149C_VIETNAM_MACRO_PARSER_DRY_RUN_BATCH.md`

## Target Indicators
- `USD_VND`
- `EXPORT_GROWTH`
- `CREDIT_GROWTH`
- `PUBLIC_INVESTMENT`

## Source Inputs
- `USD_VND`: Vietcombank Exchange Rate XML API.
- `EXPORT_GROWTH`: manual GSO export value CSV files, expected at exact paths below.
- `CREDIT_GROWTH`: manual aggregated SBV/news/publication CSV, expected at exact path below.
- `PUBLIC_INVESTMENT`: clean manual public investment CSV, expected at exact path below.

## CSV Files Expected
- `data/manual-review/macro/export-growth/gso-export-value-2024.csv`
- `data/manual-review/macro/export-growth/gso-export-value-2025.csv`
- `data/manual-review/macro/export-growth/gso-export-value-2026.csv`
- `data/manual-review/macro/credit-growth/credit-growth-2025-2026-manual-aggregated.csv`
- `data/manual-review/macro/public-investment/public-investment-2025-2026-clean.csv`

## CSV Files Found
None of the exact expected filenames were found.

Local similarly named files were present but intentionally not substituted:
- `data/manual-review/macro/export-growth/V01-2024-7(1).csv`
- `data/manual-review/macro/export-growth/V01-2025-13(1).csv`
- `data/manual-review/macro/export-growth/V01-2026-3(1).csv`
- `data/manual-review/macro/credit-growth/credit_growth_quarterly.csv`
- `data/manual-review/macro/public-investment/public_investment_2025_2026_clean_columns.csv`

## Provider Fetch
- providerFetchAttempted=true
- providerFetchSucceeded=true
- Provider fetch was only for `USD_VND`.
- CSV files were not fetched from remote providers.

## Parser Results
| Indicator | parserAttempted | parserSucceeded | candidateRows | candidateProvenanceRows | Status |
| --- | --- | --- | ---: | ---: | --- |
| `USD_VND` | true | true | 1 | 1 | Parsed USD `Transfer` quote from VCB XML into memory only |
| `EXPORT_GROWTH` | true | false | 0 | 0 | Failed closed: missing required CSV files |
| `CREDIT_GROWTH` | true | false | 0 | 0 | Failed closed: missing required CSV file |
| `PUBLIC_INVESTMENT` | true | false | 0 | 0 | Failed closed: missing required CSV file |

## Numeric Extraction
- numericValuesExtracted=1
- The only extracted numeric value was the USD/VND candidate from the VCB XML payload.
- No hardcoded macro numeric values were added to source code or docs.

## Database Write Boundary
- dbWriteAttempted=false
- candidateRowsPersisted=false
- observationRowsCreated=0
- provenanceRowsCreated=0
- productionApprovedTrueCount=0
- needsReviewTrueCount=1

## Semantic Caveats
- `USD_VND`: Candidate uses Vietcombank commercial bank quote, not SBV central exchange rate.
- `EXPORT_GROWTH`: Candidate formula is derived from export value CSV when exact files exist; it is not directly published growth.
- `CREDIT_GROWTH`: Candidate mode is manual aggregation from SBV/news/publication sources, not official machine-readable SBV CSV.
- `PUBLIC_INVESTMENT`: Candidate rows may represent either amount or progress; `unit` must determine interpretation.

## USD/VND Details
- usdVndRateType=transfer
- usdVndNotSbvCentralRate=true
- unit=vnd_per_usd
- sourceInstitution=Vietcombank
- sourceType=vietcombank_xml_candidate
- productionApproved=false
- needsReview=true

## Export Growth Derivation
- exportGrowthDerivedFormula=`(currentPeriodExportValue - priorPeriodExportValue) / priorPeriodExportValue * 100`
- exportGrowthSourcePeriodDetection=blocked_missing_required_csv_files
- exportGrowthNotDirectPublishedGrowth=true
- Expected source value unit before derivation: `1000 USD`
- Candidate output unit when files are present: `percent_yoy`

## Credit Growth Provenance
- creditGrowthSourceMode=manual_aggregated_sbv_news_candidate
- creditGrowthProvenanceQuality=blocked due to missing exact expected CSV
- Required future evidence per row: `source_url` and `extracted_quote`

## Public Investment Unit Breakdown
- publicInvestmentUnitBreakdown={}
- publicInvestmentSourceMode=manual_aggregated_public_investment_candidate
- Required future units: `billion_vnd` or `percent_of_plan_ytd`

## Manual Review Required Before Confirm Write
Manual review is required before any confirm-write phase for all four indicators. `USD_VND` especially needs semantic approval because the VCB XML quote is not the SBV central rate.

## Guardrail Results
- targetIndicators=USD_VND, EXPORT_GROWTH, CREDIT_GROWTH, PUBLIC_INVESTMENT
- dbWriteAttempted=false
- candidateRowsPersisted=false
- observationRowsCreated=0
- provenanceRowsCreated=0
- productionApprovedTrueCount=0
- needsReviewTrueCount=1
- frontendIndicatorUniverseExpanded=false
- usdVndNotSbvCentralRate=true
- exportGrowthDerivedFromExportValue=true
- exportGrowthNotDirectlyPublishedGrowth=true
- creditGrowthManualAggregatedCandidate=true
- publicInvestmentUnitDisambiguated=true
- assistantDoesNotInventVietnamMacro=true
- investmentAdviceAdded=false
- mockOrSampleAsReal=false
- missingDataZeroFilled=false
- rawCsvFilesCommitted=false

## Validation Results
- `node scripts/run-staging.mjs npx prisma validate`: pass
- `node scripts/run-staging.mjs npx prisma generate`: pass
- `node scripts/run-staging.mjs npx prisma migrate status`: pass, database schema is up to date
- `node scripts/run-staging.mjs npm run typecheck`: pass
- `node scripts/run-staging.mjs npm run build`: pass
- `node scripts/run-staging.mjs npm run lint`: fail. Global lint is not a clean pass. Failure is pre-existing/out of scope verified by the Phase 149B lint baseline and this run: 201 errors and 72 warnings across legacy scripts and existing macro/assistant files. The new Phase 149C dry-run and smoke scripts were not listed in lint failures.
- `node scripts/run-staging.mjs npx tsx scripts/dry-run-vietnam-macro-parser-batch.ts`: pass
- `node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-parser-dry-run-batch.ts`: pass

## Smoke Summary
- usdVndParserAttempted=true
- exportGrowthCsvParserAttempted=true
- creditGrowthCsvParserAttempted=true
- publicInvestmentCsvParserAttempted=true
- providerFetchAttempted=true
- providerFetchOnlyForUsdVnd=true
- csvFilesRead=false
- csvFailClosedVerified=true
- numericValuesExtracted=1
- candidateMacroRows=1
- candidateRowsByIndicator: `USD_VND=1`, `EXPORT_GROWTH=0`, `CREDIT_GROWTH=0`, `PUBLIC_INVESTMENT=0`
- candidateRowsPersisted=false
- observationRowsCreated=0
- provenanceRowsCreated=0
- productionApprovedTrueCount=0
- needsReviewTrueCountMatchesCandidateRows=true
- usdVndNotSbvCentralRate=true
- exportGrowthDerivedFromExportValue=true
- exportGrowthNotDirectlyPublishedGrowth=true
- creditGrowthManualAggregatedCandidate=true
- publicInvestmentUnitDisambiguated=true
- missingDataZeroFilled=false
- assistantDoesNotInventVietnamMacro=true
- guardrailNoInvestmentAdvicePresent=true
- frontendIndicatorUniverseNotExpanded=true
- smokePassed=true

## Recommended Next Phase
Phase 149D should either rename/provide the exact expected manual CSV files and rerun the batch, or explicitly update the parser contract to accept the currently present filenames. After CSV parser success, the next phase should still remain dry-run or manually reviewed confirm-write only, with `productionApproved=false`.

## Commit
Pending until Phase 149C commit creation; final report records the immutable commit hash.
