# Phase 149G - Vietnam Macro DB Read Path UI Assistant

## phase
Phase 149G - Vietnam macro DB candidate read-path UI Assistant integration.

## startingCommit
`67a83a263f89295a4d653b6addaf54cb783a264e`

## filesChanged
- `src/features/macro/lib/macro-observation-read-path.ts`
- `src/features/macro/lib/load-macro-runtime-data.ts`
- `src/features/macro/components/MacroCompassSections.tsx`
- `src/app/api/assistant/route.ts`
- `scripts/smoke-vietnam-macro-db-read-path-ui-assistant.ts`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
- `docs/product/evidence/PHASE149G_VIETNAM_MACRO_DB_READ_PATH_UI_ASSISTANT.md`

## targetIndicators
- `USD_VND`
- `EXPORT_GROWTH`
- `PUBLIC_INVESTMENT`

`CREDIT_GROWTH` remains excluded from the DB read path because Phase 149F wrote zero rows for it.

## dbReadAttempted
`true`

## dbWriteAttempted
`false`

No DB writes in Phase 149G. The phase only reads candidate rows already persisted by Phase 149F.

## observationsReadByIndicator
- `USD_VND`: 1
- `EXPORT_GROWTH`: 2
- `PUBLIC_INVESTMENT`: 34
- `CREDIT_GROWTH`: 0

## provenanceReadByIndicator
- `USD_VND`: 1
- `EXPORT_GROWTH`: 2
- `PUBLIC_INVESTMENT`: 34
- `CREDIT_GROWTH`: 0

## uiIntegrationSummary
- Macro runtime now allows visible frontend indicators to read candidate DB rows when they are clearly candidate/manual/derived/provider rows with provenance.
- `USD_VND`, `EXPORT_GROWTH`, and `PUBLIC_INVESTMENT` receive `latestObservation` from DB.
- `PUBLIC_INVESTMENT` also exposes `latestObservations` so the UI can show latest rows by unit instead of mixing `billion_vnd` and `percent_of_plan_ytd`.
- Macro indicator universe UI renders DB values with candidate/needs-review warnings.
- Missing data is not zero-filled.

## assistantContextSummary
- Assistant macro context now flattens `latestObservations` so multi-unit `PUBLIC_INVESTMENT` rows are available.
- Assistant context includes caveats for `USD_VND`, `EXPORT_GROWTH`, and `PUBLIC_INVESTMENT`.
- Assistant context marks `CREDIT_GROWTH` as having no eligible/written DB rows from Phase 149F and instructs not to infer from local files.

## candidateWarnings
- Displayed rows remain candidate data.
- Displayed rows show `productionApproved=false`.
- Displayed rows show `needsReview=true`.
- Showing candidate rows does not mean production approval.

## semanticCaveats
- `USD_VND` remains Vietcombank commercial-bank quote, not SBV central rate.
- `EXPORT_GROWTH` remains derived YoY from GSO export value CSV.
- `PUBLIC_INVESTMENT` uses unit to distinguish value in `billion_vnd` versus progress as `percent_of_plan_ytd`.
- `CREDIT_GROWTH` remains blocked/not persisted from Phase 149F.

## productionApprovedTrueCount
`0`

## needsReviewRowsVisible
`true`

## creditGrowthStatus
- `creditGrowthWrittenRows=0`
- `creditGrowthReadFromDb=false`
- Reason: Phase 149E blocked all 10 candidate rows because the source CSV was missing required `period_type`; Phase 149F intentionally wrote zero `CREDIT_GROWTH` rows.

## guardrailResults
- `dbWriteAttempted=false`
- `observationRowsCreated=0`
- `provenanceRowsCreated=0`
- `productionApprovedTrueCount=0`
- `needsReviewRowsVisible=true`
- `frontendIndicatorUniverseExpanded=false`
- `missingDataZeroFilled=false`
- `mockOrSampleAsReal=false`
- `investmentAdviceAdded=false`
- `creditGrowthReadFromDb=false`
- `assistantDoesNotInventCreditGrowth=true`

## validationResults
- `node scripts/run-staging.mjs npx prisma validate`: pass
- `node scripts/run-staging.mjs npx prisma generate`: pass
- `node scripts/run-staging.mjs npx prisma migrate status`: pass, database schema up to date
- `node scripts/run-staging.mjs npm run typecheck`: pass
- `node scripts/run-staging.mjs npm run build`: pass
- `node scripts/run-staging.mjs npm run lint`: fail, global lint is not a clean pass due to pre-existing/out-of-scope lint issues across older scripts and unrelated modules.
- `node scripts/run-staging.mjs npx eslint src/app/api/assistant/route.ts src/features/macro/components/MacroCompassSections.tsx src/features/macro/lib/load-macro-runtime-data.ts src/features/macro/lib/macro-observation-read-path.ts scripts/smoke-vietnam-macro-db-read-path-ui-assistant.ts`: pass
- `node scripts/run-staging.mjs npx tsx scripts/smoke-vietnam-macro-db-read-path-ui-assistant.ts`: pass

## smokeResults
```json
{
  "phase": "149G",
  "dbReadAttempted": true,
  "dbWriteAttempted": false,
  "observationsReadByIndicator": {
    "EXPORT_GROWTH": 2,
    "PUBLIC_INVESTMENT": 34,
    "USD_VND": 1
  },
  "provenanceReadByIndicator": {
    "USD_VND": 1,
    "EXPORT_GROWTH": 2,
    "PUBLIC_INVESTMENT": 34
  },
  "usdVndReadFromDb": true,
  "exportGrowthReadFromDb": true,
  "publicInvestmentReadFromDb": true,
  "creditGrowthWrittenRows": 0,
  "creditGrowthReadFromDb": false,
  "productionApprovedTrueCount": 0,
  "needsReviewRowsVisible": true,
  "candidateWarningsVisible": true,
  "usdVndNotSbvCentralRateCaveatVisible": true,
  "exportGrowthDerivedCaveatVisible": true,
  "publicInvestmentUnitDisambiguated": true,
  "assistantContextIncludesUsdVnd": true,
  "assistantContextIncludesExportGrowth": true,
  "assistantContextIncludesPublicInvestment": true,
  "assistantContextExcludesCreditGrowthOrMarksMissing": true,
  "assistantDoesNotInventCreditGrowth": true,
  "missingDataZeroFilled": false,
  "mockOrSampleAsReal": false,
  "investmentAdviceAdded": false,
  "frontendIndicatorUniverseExpanded": false,
  "smokePassed": true
}
```

## knownGaps
- Global lint is not clean because of pre-existing/out-of-scope lint debt.
- Candidate Vietnam macro rows are visible but still require manual review before any production approval.
- `CREDIT_GROWTH` remains blocked until its CSV contract is corrected and a later eligibility/confirm-write phase passes.

## recommendedNextPhase
Phase 149H should correct the `CREDIT_GROWTH` manual CSV schema, rerun parser/audit, and only then consider candidate confirm-write for eligible credit growth rows with `productionApproved=false` and `needsReview=true`.

## commit
Phase 149G commit. Final immutable hash is reported after commit finalization and push.
