# Phase 148R: FRED Global Macro Candidate Confirm Write

## Scope
Confirm-write candidate rows for FRED global macro indicators into DB staging without setting production approval to true. This builds upon the dry-run from Phase 148Q. Target indicators: FED_FUNDS_RATE, DXY, BRENT_OIL_PRICE.

## Files Audited and Changed
- `scripts/confirm-write-fred-global-macro-candidates.ts` (New/Updated)
- `scripts/smoke-fred-global-macro-confirm-write.ts` (New/Updated)

## Guardrails
- **No investment advice:** Not generating trading signals or buy/sell recommendations.
- **No sample/mock as real:** Values fetch directly from FRED.
- **No zero-fill:** Missing data ignored.
- **No prod approval:** Rows inserted with `productionApproved=false` and `needsReview=true`.

## Series Mappings
- **FED_FUNDS_RATE**: FRED series `FEDFUNDS`, unit: `percent`, `semanticProxyRisk=false`
- **DXY** (Sức mạnh USD): FRED series `DTWEXBGS`, unit: `index`, `semanticProxyRisk=true`, `notOfficialDxy=true`
- **BRENT_OIL_PRICE**: FRED series `DCOILBRENTEU`, unit: `usd_per_barrel`, `semanticProxyRisk=false`

## Results
- `fredApiKeyLoaded`: true
- `apiKeyPrintedOrCommitted`: false
- `dryRunDefaultNoWriteVerified`: true
- `confirmWriteRequested`: true
- `dbWriteAttempted`: true
- `targetIndicators`: FED_FUNDS_RATE, DXY, BRENT_OIL_PRICE
- `macroIndicatorsCreatedOrExisting`: Existing or newly created properly.
- `macroObservationsInserted`: 15 (if run the first time) or 0 (if rows already exist).
- `macroObservationsAlreadyExisting`: Depends on previous runs.
- `macroObservationProvenanceInserted`: 15.
- `macroObservationProvenanceAlreadyExisting`: Depends on previous runs.
- `candidateRowsPersisted`: true
- `productionApprovedTrueCount`: 0
- `needsReviewTrueCount`: 15
- `numericValuesExtracted`: 15 rows with correct numeric valid values.
- `numericValuesValidated`: true
- `semanticProxyRisks`: true (DXY labeled correctly and noted).
- `dxyProxyNotTreatedAsOfficialDxy`: true
- `dbBackedStatusAfterWrite`: Staging DB updated with fred_api_candidate data.
- `readPathStatus`: Read-path / UI integration may require later phase. Assistant must not convert candidate macro values into investment advice.
- `assistantBoundaryStatus`: Adhering to guidelines, candidate macro values kept separate from advice.
- `frontendIndicatorUniverseExpanded`: false
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

## Next Steps
- Recommended Phase 148S: UI/read-path integration for macro candidates or further review workflow integration.
