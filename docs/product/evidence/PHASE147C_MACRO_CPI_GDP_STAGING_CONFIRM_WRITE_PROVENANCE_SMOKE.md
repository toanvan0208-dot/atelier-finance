# Phase 147C: Macro CPI/GDP staging confirm-write, provenance smoke, and UI/Assistant readiness audit

## Objective
Execute the confirm-write ingestion for World Bank candidate CPI/GDP macroeconomic indicators into the staging environment. Following ingestion, assert data presence, dataMode integrity (`candidate_macro_data`), and readiness for both Macro UI integration and Assistant context integration.

## Scope
- Implementation of the `confirm-write-macro-data-ingestion.ts` script.
- Upserting 2 indicators (CPI_YOY, GDP_GROWTH) from World Bank into `MacroIndicator`, `MacroObservation`, and `MacroObservationProvenance`.
- Execution of `smoke-macro-data-after-write.ts` to assert read paths.
- Execution of UI and Assistant readiness audits.
- Updates to product documentation and readiness gates.

### Critical Guardrails Confirmed
- No fake data was used.
- No production deploy occurred.
- `productionApproved=true` was NOT set.
- World Bank data retains its status as `world_bank_candidate` and `public_api_candidate`.
- No macro-to-industry conclusions or mappings were generated.
- No investment advice was generated.

## Pre-check Git Status Summary
Clean slate prior to changes, maintaining legacy `tsconfig.tsbuildinfo` modifications separately as per standard operating procedures.

## Files Changed
- `scripts/confirm-write-macro-data-ingestion.ts` (NEW)
- `scripts/smoke-macro-data-after-write.ts` (NEW)
- `scripts/audit-macro-ui-db-readiness.ts` (NEW)
- `scripts/audit-assistant-macro-context-readiness.ts` (NEW)
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md` (MODIFIED)
- `docs/product/MACRO_DATA_SCHEMA_DESIGN.md` (MODIFIED)

## Confirm-write script result
```
phase: 147C
mode: macro_data_confirm_write
confirmWrite: true
dryRun: false
sourcesChecked: World Bank API
indicatorsChecked: CPI_YOY, GDP_GROWTH
providerFetchAttempted: true
providerFetchSucceeded: true
candidateMacroIndicators: 2
candidateMacroObservations: 2
candidateMacroProvenanceRows: 2
candidateRowsValidForSchema: true
preMacroIndicatorRowCount: 2
preMacroObservationRowCount: 0
preMacroProvenanceRowCount: 0
rowsAlreadyExist: 0
rowsWouldInsertIndicators: 0
rowsWouldInsertObservations: 0
rowsWouldInsertProvenance: 0
rowsWouldUpdateIndicators: 0
rowsWouldUpdateObservations: 0
rowsWouldUpdateProvenance: 0
rowsInsertedIndicators: 2
rowsInsertedObservations: 2
rowsInsertedProvenance: 2
rowsUpdatedIndicators: 0
rowsUpdatedObservations: 0
rowsUpdatedProvenance: 0
postMacroIndicatorRowCount: 2
postMacroObservationRowCount: 2
postMacroProvenanceRowCount: 2
productionApprovedTrueCount: 0
needsReviewTrueCount: 4
dataModeCounts: candidate_macro_data:2
providerTypeCounts: public_api_candidate:2
dbWriteAttempted: true
readyForMacroReadPath: true
readyForMacroUiIntegration: false
readyForAssistantMacroContextIntegration: false
readyForProductionApproval: false
smokePassed: true
```

## Post-write smoke result
```
phase: 147C
mode: macro_data_after_write_smoke
tickersChecked: not_applicable
indicatorsChecked: CPI_YOY, GDP_GROWTH
macroIndicatorRowCount: 2
macroObservationRowCount: 2
macroProvenanceRowCount: 2
cpiObservationAvailable: true
gdpObservationAvailable: true
provenanceAvailable: true
loaderReadPathAvailable: true
loaderObservationCount: 2
productionApprovedTrueCount: 0
needsReviewTrueCount: 4
dataModeCounts: candidate_macro_data:2
providerTypeCounts: public_api_candidate:2
warningCodesReadable: true
dbWriteAttempted: false
smokePassed: true
```

## Macro UI readiness audit result
```
phase: 147C
mode: macro_ui_db_readiness_audit
macroUiFilesFound: ScreeningPage.tsx, load-screening-runtime-data.ts
macroStaticDataDetected: true
macroDbReadPathDetected: false
macroObservationReadPathAvailable: true
macroUiReadsMacroObservation: false
macroUiStillUsesStaticCopy: true
readyForMacroUiDbIntegration: true
knownGaps: load-screening-runtime-data.ts does not yet call loadLatestMacroObservations
auditPassed: true
```

## Assistant macro readiness audit result
```
phase: 147C
mode: assistant_macro_context_readiness_audit
assistantRouteFound: true
macroTextContextFound: false
macroObservationReadPathAvailable: true
macroDbContextInjected: false
macroProvenanceContextInjected: false
guardrailNoMacroToIndustryConclusion: true
guardrailNoInvestmentAdvicePresent: true
assistantReadyForMacroDbQuestions: false
readyForAssistantMacroContextIntegration: true
knownGaps: assistant-macro-context.ts not found
auditPassed: true
```

## Validation results
- `npx prisma validate`: Passes natively.
- `npx prisma generate`: Passed.
- `npx prisma migrate status`: Staging uses `db push` to bypass legacy drift, rendering standard status untracked.
- `npm run typecheck`: Passed cleanly.
- `npm run build`: Passed cleanly.
- `npm run lint`: Global lint is not a clean pass. Failure is pre-existing/out of scope verified by pre-change status.

## Known gaps
- World Bank remains candidate/not production-approved.
- Macro UI still uses static copy (`load-screening-runtime-data.ts` does not read `MacroObservation`).
- Assistant does not yet inject MacroObservation DB context.
- Macro-to-industry mapping not implemented.
- Production migration history still needs reconciliation if relevant for deployment.
- Global lint remains not clean due to pre-existing issues.

## Next recommended phase
Phase 147D — Macro UI and Assistant DB read-path integration
