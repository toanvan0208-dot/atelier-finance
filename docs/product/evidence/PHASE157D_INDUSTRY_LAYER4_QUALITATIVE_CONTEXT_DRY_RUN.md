# Phase 157D - Industry Layer 4 Qualitative Context Dry Run

## Goal
Dry-run the source-backed qualitative Industry Layer 4 package for the three reviewed Industry lanes before any DB write.

## Scope
- Dry run only.
- Read existing DB state and existing reviewed source package definitions.
- Validate source-backed qualitative context coverage.
- Do not write `Industry`, `CompanyIndustry`, `IndustryContext`, `IndustryContextProvenance`, or `IndustryMetric`.
- Do not change schema.
- Do not fetch providers.
- Do not import files.
- Do not create benchmark, ranking, scoring, trading signal, target price, fair value, upside, downside, or stock attractiveness output.

## Target Industries
- `STEEL_MATERIALS` mapped to `HPG`
- `RETAIL` mapped to `MWG`
- `CONSUMER_STAPLES_DAIRY` mapped to `VNM`

## Source Packages Validated
- `STEEL_MATERIALS`: World Steel Association - Steel and raw materials fact sheet
  - URL: `https://worldsteel.org/wp-content/uploads/Fact-sheet-raw-materials-2023-1.pdf`
- `RETAIL`: U.S. Bureau of Labor Statistics - Retail Trade sector profile
  - URL: `https://www.bls.gov/iag/tgs/iag44-45.htm`
- `CONSUMER_STAPLES_DAIRY`: FAO - Gateway to dairy production and products
  - URL: `https://www.fao.org/dairy-production-products/en`

All packages remain:
- `dataMode=research_only`
- `needsReview=true`
- `productionApproved=false`

## Layer 4 Field Coverage
Each package contains:
- Overview
- How the industry makes money
- Key drivers
- Key risks
- Macro sensitivity
- Next checks
- Common misread / what not to conclude
- Source label
- Source URL
- Source type
- Retrieved date
- Review note
- Warning codes

## Dry Run Result
Command:

```bash
npx tsx scripts/dry-run-industry-layer4-qualitative-context.ts
```

Result summary:
- `candidateContextPackages`: 3
- `eligibleContextPackages`: 3
- `blockedContextPackages`: 0
- `acceptedIndustryCodesExactly`: true
- `allTargetMappingsFound`: true
- `allFullLayer4FieldsPresent`: true
- `industryContextRowsBefore`: 0
- `industryContextProvenanceRowsBefore`: 0
- `wouldWriteIndustryContextRows`: 3
- `wouldWriteIndustryContextProvenanceRows`: 3
- `readyForConfirmWrite`: true
- `dryRunPassed`: true

## Guardrail Result
- `forbiddenAdviceDetected`: false
- `numericBenchmarkLanguageDetected`: false
- `unsupportedTickerContextDetected`: false
- `industryMetricCreated`: false
- `benchmarkCreated`: false
- `rankingCreated`: false
- `scoringCreated`: false
- `valuationRiskBenchmarkInvented`: false
- `staticGuidanceTreatedAsReviewedQualitativeContext`: false
- `missingDataZeroFilled`: false
- `fakeMockFallbackAsRealDetected`: false
- `productionApprovedTrueCount`: 0

## What This Means
The module is ready for a controlled confirm-write phase that creates three `IndustryContext` rows and three `IndustryContextProvenance` rows. This phase did not write them.

After a confirm-write, the Industry module can move toward Layer 4 only if the runtime read-path confirms:
- Context rows are readable.
- Provenance rows are attached.
- Data remains `research_only`.
- `needsReview=true`.
- `productionApproved=false`.
- No metric, benchmark, ranking, scoring, or advice language is introduced.

## Recommended Next Phase
Phase 157E - Industry Layer 4 Qualitative Context Confirm-Write

## Safety Confirmations
- DB writes: no
- Schema change: no
- Provider fetch: no
- IndustryMetric introduced: no
- benchmark/ranking/scoring introduced: no
- buy/sell/hold introduced: no
- target price/fair value/upside/downside introduced: no
- stock attractiveness introduced: no
- fake/mock/fallback-as-real introduced: no
- `productionApprovedTrueCount`: 0
