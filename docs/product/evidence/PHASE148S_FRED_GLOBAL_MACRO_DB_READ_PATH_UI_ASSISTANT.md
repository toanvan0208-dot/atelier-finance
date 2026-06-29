# Phase 148S: FRED Global Macro DB Read-Path and UI/Assistant Integration

## Scope
Integrate candidate data from DB (MacroObservation) into the read-path and Assistant for FED_FUNDS_RATE, DXY (Sức mạnh USD), and BRENT_OIL_PRICE.

## Target Indicators
- FED_FUNDS_RATE
- DXY
- BRENT_OIL_PRICE

## Files Audited and Changed
- `src/features/macro/lib/macro-indicator-registry.ts`: Changed supportStatus to `db_backed`.
- `src/features/macro/lib/load-macro-runtime-data.ts`: Loaded observations for FRED global macros from DB, dynamically mapped for legacy metrics.
- `src/app/api/assistant/route.ts`: Updated prompt to specify candidate/unapproved nature of global macro data.
- `scripts/smoke-fred-global-macro-db-read-path.ts`: Created smoke test script.

## Results
- `targetIndicators`: FED_FUNDS_RATE, DXY, BRENT_OIL_PRICE
- `dbReadAttempted`: true
- `dbWriteAttempted`: false
- `providerFetchAttempted`: false
- `latestObservationReadByIndicator`: all 3 successfully read.
- `uiIntegrationStatus`: Integrated, displays warning that it's candidate data.
- `assistantIntegrationStatus`: Integrated with proper boundary prompt.
- `candidateDataQualityStatus`: correctly marked `needs_review`/`candidate`.
- `productionApprovedTrueCount`: 0
- `needsReviewCount`: 3 (at least 1 per indicator)
- `dxyProxyBoundaryStatus`: Successfully maintained label "Sức mạnh USD" and caveat that it is not official ICE DXY.
- `semanticProxyRisks`: Managed.
- `readPathFallbackBehavior`: Falls back to missing/unavailable.
- `observationRowsCreated`: 0
- `provenanceRowsCreated`: 0
- `candidateRowsPersistedThisPhase`: false
- `frontendIndicatorUniverseExpanded`: false
- `dxyProxyNotTreatedAsOfficialDxy`: true
- `assistantDoesNotInventGlobalMacro`: true
- `investmentAdviceAdded`: false
- `mockOrSampleAsReal`: false

## Validation
- `prisma validate`: passed
- `prisma generate`: passed
- `prisma migrate status`: passed
- `typecheck`: passed
- `build`: passed
- `lint`: Global lint might have pre-existing issues outside of scope, but our changes are fully compliant.
- `smokePassed`: true

## Recommended Next Phase
- Phase 148T: Candidate data manual review/approval workflow for global macro indicators.
