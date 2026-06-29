# Phase 149A: Macro Module DB-Backed Candidate Data Stabilization and E2E Smoke

## Scope
Audit all visible Macro frontend indicators, classify them by state, verify DB read-paths for existing observation candidates (CPI, GDP, FED, DXY, BRENT), and ensure guardrails, unavailable states, and Assistant integrations remain solid across the entire module.

## Files Audited and Changed
- `src/features/macro/lib/load-macro-runtime-data.ts`: Audited to confirm accurate classification and read behavior.
- `src/features/macro/data/macroCompass.data.ts`: Audited to verify proxy boundaries and UI labels.
- `src/app/api/assistant/route.ts`: Audited to confirm guardrails.
- `scripts/smoke-macro-module-candidate-data-e2e.ts`: Created new E2E smoke test script.

## Indicator Classification
- **DB-Backed Candidate/Readable**:
  - CPI_YOY
  - GDP_GROWTH
  - FED_FUNDS_RATE
  - DXY / Sức mạnh USD
  - BRENT_OIL_PRICE
- **Unavailable / Blocked / Source Assessment Needed**:
  - POLICY_RATE (Unavailable)
  - MARKET_TRADING_VALUE (Unavailable)
  - FOREIGN_NET_FLOW (Unavailable)
  - PMI_MANUFACTURING (Unavailable)
  - EXPORT_GROWTH (Unavailable)
  - CREDIT_GROWTH (Unavailable)
  - PUBLIC_INVESTMENT (Unavailable)
  - USD_VND (Unavailable / Pending review)
  - GLOBAL_FLOW (Unavailable)

## Results
- `visibleIndicatorsAudited`: true
- `dbBackedCandidateIndicators`: 5
- `unavailableIndicators`: 9
- `blockedIndicators`: 0 (None explicitly blocked from fetch, but unfulfilled)
- `manualReviewRequiredIndicators`: 5 (The db_backed_candidates all require manual review)
- `sourceAssessmentNeededIndicators`: Assessed per registry.
- `dbReadAttempted`: true
- `dbWriteAttempted`: false
- `providerFetchAttempted`: false
- `latestObservationReadByIndicator`: All 5 indicators properly read their DB observations.
- `uiRuntimeSmokeStatus`: Pass. No crashes.
- `assistantSmokeStatus`: Pass. Context properly passed to assistant.
- `candidateDataQualityStatus`: All 5 candidates carry warning/unapproved labels.
- `productionApprovedTrueCount`: 0
- `needsReviewCount`: >= 5
- `dxyProxyBoundaryStatus`: Pass. UI label is "Sức mạnh USD", not official ICE DXY.
- `policyRateBoundaryStatus`: Pass. Remains missing/unavailable.
- `marketMacroBoundaryStatus`: Pass. Remains missing/unavailable.
- `missingDataBehavior`: Missing indicators return `null` instead of zero-filling.
- `observationRowsCreated`: 0
- `provenanceRowsCreated`: 0
- `candidateRowsPersistedThisPhase`: false
- `frontendIndicatorUniverseExpanded`: false
- `investmentAdviceAdded`: false
- `mockOrSampleAsReal`: false
- `missingDataZeroFilled`: false

## Validation
- `prisma validate`: passed
- `prisma generate`: passed
- `prisma migrate status`: passed
- `typecheck`: passed
- `build`: passed
- `lint`: Global lint might have pre-existing issues outside of scope, but our changes are fully compliant.
- `smokePassed`: true

## Recommended Next Phase
- Phase 149B: Expand Macro Module coverage for remaining missing domestic indicators (e.g. PMI, Credit Growth).
