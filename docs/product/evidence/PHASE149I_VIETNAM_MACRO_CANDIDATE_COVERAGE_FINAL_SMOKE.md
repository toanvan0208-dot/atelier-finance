# Phase 149I - Vietnam Macro Candidate Coverage Final Smoke

## phase
Phase 149I - Vietnam macro candidate coverage final smoke.

## startingCommit
`845d3207a957a213e1acf5318267419a74fbabcb`

## filesChanged
- `scripts/smoke-vietnam-macro-candidate-coverage-final.ts`
- `docs/product/evidence/PHASE149I_VIETNAM_MACRO_CANDIDATE_COVERAGE_FINAL_SMOKE.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`

## targetIndicators
- `USD_VND`
- `EXPORT_GROWTH`
- `PUBLIC_INVESTMENT`
- `CREDIT_GROWTH`

## dbReadAttempted
`true`

## dbWriteAttempted
`false`

No DB writes in Phase 149I.

## observationsReadByIndicator
- `USD_VND`: 1
- `EXPORT_GROWTH`: 2
- `PUBLIC_INVESTMENT`: 34
- `CREDIT_GROWTH`: 10

## provenanceReadByIndicator
- `USD_VND`: 1
- `EXPORT_GROWTH`: 2
- `PUBLIC_INVESTMENT`: 34
- `CREDIT_GROWTH`: 10

## totalVietnamCandidateRowsRead
`47`

## productionApprovedTrueCount
`0`

## needsReviewRowsCount
`47`

All Vietnam macro rows remain `productionApproved=false` and `needsReview=true`.

## runtimeCoverageSummary
- `macroRuntimeIncludesUsdVnd=true`
- `macroRuntimeIncludesExportGrowth=true`
- `macroRuntimeIncludesPublicInvestment=true`
- `macroRuntimeIncludesCreditGrowth=true`

## uiWarningSummary
- Candidate warnings are visible.
- Needs-review warnings are visible.
- Coverage/readability does not equal production approval.

## assistantContextSummary
- `assistantContextIncludesUsdVnd=true`
- `assistantContextIncludesExportGrowth=true`
- `assistantContextIncludesPublicInvestment=true`
- `assistantContextIncludesCreditGrowth=true`
- Assistant context retains candidate caveats and does not treat rows as production-approved.

## semanticCaveats
- `USD_VND` remains Vietcombank commercial-bank transfer quote, not SBV central rate.
- `EXPORT_GROWTH` remains derived YoY from GSO export value CSV.
- `PUBLIC_INVESTMENT` uses unit to distinguish value versus percent of plan.
- `CREDIT_GROWTH` is manually aggregated from SBV/news/publication sources, not official machine-readable SBV CSV.

## creditGrowthStatus
`CREDIT_GROWTH` now has 10 DB candidate observations and 10 provenance rows, all `productionApproved=false` and `needsReview=true`.

## guardrailResults
- `dbWriteAttempted=false`
- `productionApprovedTrueCount=0`
- `needsReviewRowsVisible=true`
- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `fallbackAsReal=false`
- `investmentAdviceAdded=false`
- `frontendIndicatorUniverseExpanded=false`
- `rawCsvCommitted=false`

## validationResults
- `node scripts/run-staging.mjs npx prisma validate`: pass
- `node scripts/run-staging.mjs npx prisma generate`: pass
- `node scripts/run-staging.mjs npx prisma migrate status`: pass, database schema up to date
- `node scripts/run-staging.mjs npm run typecheck`: pass
- `node scripts/run-staging.mjs npm run build`: pass
- `node scripts/run-staging.mjs npm run lint`: fail, global lint is not a clean pass due to pre-existing/out-of-scope lint issues.
- `node scripts/run-staging.mjs npx eslint scripts/smoke-vietnam-macro-candidate-coverage-final.ts`: pass
- `node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-candidate-coverage-final.ts`: pass

## smokeResults
```json
{
  "phase": "149I",
  "dbReadAttempted": true,
  "dbWriteAttempted": false,
  "observationsReadByIndicator": {
    "USD_VND": 1,
    "EXPORT_GROWTH": 2,
    "PUBLIC_INVESTMENT": 34,
    "CREDIT_GROWTH": 10
  },
  "provenanceReadByIndicator": {
    "USD_VND": 1,
    "EXPORT_GROWTH": 2,
    "PUBLIC_INVESTMENT": 34,
    "CREDIT_GROWTH": 10
  },
  "totalVietnamCandidateRowsRead": 47,
  "macroRuntimeIncludesUsdVnd": true,
  "macroRuntimeIncludesExportGrowth": true,
  "macroRuntimeIncludesPublicInvestment": true,
  "macroRuntimeIncludesCreditGrowth": true,
  "uiCandidateWarningsVisible": true,
  "needsReviewWarningsVisible": true,
  "productionApprovedTrueCount": 0,
  "needsReviewRowsCount": 47,
  "needsReviewRowsVisible": true,
  "assistantContextIncludesUsdVnd": true,
  "assistantContextIncludesExportGrowth": true,
  "assistantContextIncludesPublicInvestment": true,
  "assistantContextIncludesCreditGrowth": true,
  "usdVndNotSbvCentralRateCaveatVisible": true,
  "exportGrowthDerivedCaveatVisible": true,
  "publicInvestmentUnitDisambiguated": true,
  "creditGrowthManualAggregationCaveatVisible": true,
  "missingDataZeroFilled": false,
  "mockOrSampleAsReal": false,
  "fallbackAsReal": false,
  "investmentAdviceAdded": false,
  "frontendIndicatorUniverseExpanded": false,
  "allRowsHaveCandidateWarningCodes": true,
  "smokePassed": true
}
```

## knownGaps
- Global lint may remain dirty due to pre-existing/out-of-scope lint debt.
- Candidate coverage is complete for the four Vietnam indicators, but none are production-approved.
- `productionApproved=true` remains a separate future review gate.

## recommendedNextPhase
Phase 149J should define and test the stronger human-review workflow required before any Vietnam macro candidate row can become production-approved.

## commit
Phase 149I commit. Final immutable hash is reported after commit finalization and push.
