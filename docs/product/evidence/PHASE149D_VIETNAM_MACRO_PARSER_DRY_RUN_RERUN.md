# Phase 149D Vietnam Macro Parser Dry-Run Rerun Evidence

## Phase

Phase 149D - Vietnam macro parser dry-run rerun with manual CSV contract satisfied.

## Starting Commit

`445faa29d6f44d1fbd214256c235c9bc800c8937`

## Scope

Target indicators only:

- `USD_VND`
- `EXPORT_GROWTH`
- `CREDIT_GROWTH`
- `PUBLIC_INVESTMENT`

No DB import, no persisted candidate rows, no `MacroObservation`, no `MacroObservationProvenance`, and no production approval were performed.

## Files Expected

- `data/manual-review/macro/export-growth/gso-export-value-2024.csv`
- `data/manual-review/macro/export-growth/gso-export-value-2025.csv`
- `data/manual-review/macro/export-growth/gso-export-value-2026.csv`
- `data/manual-review/macro/credit-growth/credit-growth-2025-2026-manual-aggregated.csv`
- `data/manual-review/macro/public-investment/public-investment-2025-2026-clean.csv`

## Files Found

All expected local manual CSV files were found.

## Files Missing

None.

## Files Changed

- `scripts/dry-run-vietnam-macro-parser-batch.ts`
- `docs/product/evidence/PHASE149D_VIETNAM_MACRO_PARSER_DRY_RUN_RERUN.md`

## Parser Results

| Indicator | Attempted | Succeeded | Candidate rows | Candidate provenance rows |
| --- | --- | --- | ---: | ---: |
| `USD_VND` | true | true | 1 | 1 |
| `EXPORT_GROWTH` | true | true | 2 | 2 |
| `CREDIT_GROWTH` | true | true | 10 | 10 |
| `PUBLIC_INVESTMENT` | true | true | 34 | 34 |

Candidate rows total: 47.

Numeric values extracted into in-memory candidates: 47.

Needs-review true count: 47.

## Source Inputs

- `USD_VND`: Vietcombank Exchange Rate XML API.
- `EXPORT_GROWTH`: manual GSO export value CSV files, derived YoY.
- `CREDIT_GROWTH`: manually aggregated SBV/news/publication CSV.
- `PUBLIC_INVESTMENT`: manually aggregated public investment CSV.

## Provider And CSV Status

- `providerFetchAttempted=true`
- `providerFetchSucceeded=true`
- `csvFilesRead=true`
- Provider fetch was used only for `USD_VND`.
- Manual CSV files were read only from `data/manual-review/`; raw CSV files were not staged or committed.

## Semantic Caveats

- `USD_VND`: candidate uses Vietcombank commercial bank transfer quote, not SBV central rate.
- `EXPORT_GROWTH`: derived from GSO export value CSV using `(currentPeriodExportValue - priorPeriodExportValue) / priorPeriodExportValue * 100`; it is not directly published growth.
- `CREDIT_GROWTH`: manually aggregated from SBV/news/publication sources, not an official machine-readable SBV CSV.
- `PUBLIC_INVESTMENT`: rows may represent either `billion_vnd` or `percent_of_plan_ytd`; unit determines interpretation.

## USD/VND

- `sourceType=vietcombank_xml_candidate`
- `unit=vnd_per_usd`
- `quoteField=transfer`
- `sourceInstitution=Vietcombank`
- `notSbvCentralRate=true`
- `productionApproved=false`
- `needsReview=true`

## Export Growth

- `sourceType=gso_manual_csv_derived_candidate`
- `unit=percent_yoy`
- `derivedFrom=export_value_1000_usd`
- `exportGrowthDerivedFromExportValue=true`
- `exportGrowthNotDirectlyPublishedGrowth=true`
- `exportGrowthSourcePeriodDetection=annual_full_year_and_ytd_overlap_detection`
- `productionApproved=false`
- `needsReview=true`

## Credit Growth

- `sourceType=manual_aggregated_sbv_news_candidate`
- `unit=percent_ytd`
- `creditGrowthManualAggregatedCandidate=true`
- `notOfficialMachineReadableSbvCsv=true`
- `productionApproved=false`
- `needsReview=true`

## Public Investment

- `sourceType=manual_aggregated_public_investment_candidate`
- `publicInvestmentUnitBreakdown={ billion_vnd: 17, percent_of_plan_ytd: 17 }`
- `publicInvestmentUnitDisambiguated=true`
- `productionApproved=false`
- `needsReview=true`

## Guardrail Assertions

- `dbWriteAttempted=false`
- `candidateRowsPersisted=false`
- `observationRowsCreated=0`
- `provenanceRowsCreated=0`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCountMatchesCandidateRows=true`
- `frontendIndicatorUniverseExpanded=false`
- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `investmentAdviceAdded=false`
- `usdVndNotSbvCentralRate=true`
- `exportGrowthDerivedFromExportValue=true`
- `exportGrowthNotDirectlyPublishedGrowth=true`
- `creditGrowthManualAggregatedCandidate=true`
- `publicInvestmentUnitDisambiguated=true`
- `manualReviewRequiredBeforeConfirmWrite=true`

## Validation Results

- `node scripts/run-staging.mjs npx prisma validate`: pass.
- `node scripts/run-staging.mjs npx prisma generate`: pass.
- `node scripts/run-staging.mjs npx prisma migrate status`: pass.
- `node scripts/run-staging.mjs npm run typecheck`: pass.
- `node scripts/run-staging.mjs npm run build`: pass.
- `node scripts/run-staging.mjs npm run lint`: global lint is not a clean pass. Failure is pre-existing/out of scope; new Phase 149D changes are not listed in lint failures.

## Smoke Results

`node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-parser-dry-run-batch.ts`: pass.

Smoke-confirmed fields:

- `usdVndParserAttempted=true`
- `exportGrowthCsvParserAttempted=true`
- `creditGrowthCsvParserAttempted=true`
- `publicInvestmentCsvParserAttempted=true`
- `dbWriteAttempted=false`
- `providerFetchAttempted=true`
- `providerFetchOnlyForUsdVnd=true`
- `csvFilesRead=true`
- `numericValuesExtracted=47`
- `candidateMacroRows=47`
- `candidateRowsPersisted=false`
- `observationRowsCreated=0`
- `provenanceRowsCreated=0`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCountMatchesCandidateRows=true`
- `assistantDoesNotInventVietnamMacro=true`
- `guardrailNoInvestmentAdvicePresent=true`
- `frontendIndicatorUniverseNotExpanded=true`
- `smokePassed=true`

## Known Gaps

- All generated rows remain candidate-only and require manual review before any future confirm-write phase.
- `USD_VND` is a commercial-bank quote and must not be presented as SBV central rate.
- `EXPORT_GROWTH` is derived from export value CSV, not a directly published growth field.
- `CREDIT_GROWTH` remains a manual aggregation candidate.
- `PUBLIC_INVESTMENT` remains candidate/manual data and must be interpreted by unit.

## Recommended Next Phase

Phase 149E should perform manual review and confirm-write eligibility assessment for these candidate rows, including provenance quality review, source semantics review, and an explicit approval boundary before any persisted DB import is considered.

## Commit

Pending at evidence creation time.
