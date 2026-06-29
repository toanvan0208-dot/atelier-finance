# Phase 148Q: FRED Global Macro API Key Guarded Dry-Run

## Metadata
- **Phase**: 148Q
- **Scope**: Perform guarded dry-run for FRED API candidate data on `FED_FUNDS_RATE`, `DXY` (DTWEXBGS), and `BRENT_OIL_PRICE`.
- **Starting Commit**: 1bb42bc
- **Files Audited**:
  - `.gitignore`
  - `src/features/macro/lib/macro-indicator-registry.ts`
  - `docs/product/*.md`
- **Files Changed**:
  - `.gitignore` (Added `.env*` to strictly prevent tracking environment files)
  - `scripts/dry-run-fred-global-macro-candidates.ts` (Created)
  - `scripts/smoke-fred-global-macro-dry-run.ts` (Created)
  - `docs/product/MACRO_PARSER_STRATEGY.md`
  - `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`

## Summary
- **Target Indicators**: `FED_FUNDS_RATE`, `DXY` ("Sức mạnh USD" proxy), `BRENT_OIL_PRICE`
- **FRED API Key Loaded**: Yes. Loaded dynamically via environment variables without committing or logging the secret.
- **API Key Printed or Committed**: `false` (Validated via smoke test output and `.gitignore` audit).
- **Series Mappings**: 
  - `FED_FUNDS_RATE` -> `FEDFUNDS`
  - `DXY` -> `DTWEXBGS` (Semantic Proxy Risk: True, UI Label: Sức mạnh USD)
  - `BRENT_OIL_PRICE` -> `DCOILBRENTEU`
- **Provider Fetch Attempted**: Yes (`true`).
- **Provider Fetch Succeeded**: Yes (`true`). The dry-run script successfully retrieved recent observations for all three series.
- **Numeric Values Extracted**: Yes (`true`). Parsed numbers out of the string-based API response. Missing dots (`.`) are safely converted to `null` with parser status `missing_value`.
- **Numeric Values Validated**: Yes. Handled gracefully.
- **Candidate Macro Rows**: Generated in memory.
- **Candidate Provenance Rows**: N/A (Dry run output only).
- **Candidate Rows Persisted**: `false` (No database writes were attempted).
- **DB Write Attempted**: `false`
- **Production Approved True Count**: `0`
- **Needs Review True Count**: Matches candidate row count (`needsReview` strictly set to `true`).

## Semantic Proxy Risks
- `dxyProxyNotTreatedAsOfficialDxy=true`: The dry-run script marks the DTWEXBGS row with `semanticProxyRisk: true`, `notOfficialDxy: true`, and `uiLabel: "Sức mạnh USD"`.

## Indicator Status By Type
- **FED_FUNDS_RATE**:
  - `dbBacked`: `false` (in database)
  - `parserReadinessAfterDryRun`: Ready for confirm-write phase.
  - `readyForConfirmWrite`: `true`
- **DXY**:
  - `dbBacked`: `false`
  - `parserReadinessAfterDryRun`: Ready for confirm-write phase with semantic proxy flags.
  - `readyForConfirmWrite`: `true`
- **BRENT_OIL_PRICE**:
  - `dbBacked`: `false`
  - `parserReadinessAfterDryRun`: Ready for confirm-write phase.
  - `readyForConfirmWrite`: `true`

## Guardrail Results
- `targetIndicators=FED_FUNDS_RATE, DXY, BRENT_OIL_PRICE`
- `fredApiKeyLoaded=true`
- `apiKeyPrintedOrCommitted=false`
- `dbWriteAttempted=false`
- `candidateRowsPersisted=false`
- `observationRowsCreated=0`
- `provenanceRowsCreated=0`
- `productionApprovedTrueCount=0`
- `needsReviewTrueCount=15` (5 observations x 3 series)
- `frontendIndicatorUniverseExpanded=false`
- `dxyProxyNotTreatedAsOfficialDxy=true`
- `assistantDoesNotInventGlobalMacro=true`
- `investmentAdviceAdded=false`
- `mockOrSampleAsReal=false`

## Validation Results
- Prisma Validation/Generation: Pass
- TypeScript Typecheck: Pass
- Build: Pass
- Lint: Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status.
- Smoke Test (`smoke-fred-global-macro-dry-run.ts`): Pass (`smokePassed=true`)

## Recommended Next Phase
**Phase 148R**: Execute confirm-write dry-run and create `MacroObservation` candidate rows in the database with `productionApproved=false`.
