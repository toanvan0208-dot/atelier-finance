# Phase 147A Evidence: Real Macro Data Source Discovery, Schema Design, and Fail-Closed Ingestion Preview

## Objective
To establish a foundation for real, verifiable macroeconomic data by auditing the current state, proposing a timeseries schema, assessing real-world data sources, and creating a fail-closed ingestion preview.

## Scope
- Audited existing macro data paths (found reliance on static mock data).
- Proposed structured `MacroObservation` schema.
- Assessed sources (World Bank API chosen for preview).
- Developed a dry-run ingestion script for World Bank API (CPI and GDP).
- Defined readiness gates and Assistant boundaries.

## Statements
- **No fake data statement**: No fake data was introduced. The preview script fetches live data from the World Bank API.
- **No DB write statement**: The ingestion preview script was explicitly designed as a fail-closed dry run. No database writes were attempted or executed.
- **No production deploy statement**: No code was deployed to production. Readiness gates block any production cron jobs.

## Pre-Check Git Status Summary
No unrelated modifications were present before the phase began. Only files created within the scope of Phase 147A are staged.

## Current-State Audit Result
```text
phase: 147A
mode: macro_data_current_state_audit
macroSchemaExists: false
macroApiRoutesFound: false
macroUiReadPathFound: false
macroAssistantContextFound: true
macroSeedOrMockDetected: true
macroProvenanceExists: false
usesStaticMacroCopy: true
readyForMacroSchemaDesign: true
readyForMacroIngestionPreview: true
```

## Schema Design Summary
Proposed three new tables: `MacroIndicator`, `MacroObservation`, and `MacroObservationProvenance`. These enforce strict tracking of source metadata, unit metrics, and human review gates (`productionApproved=false`, `needsReview=true`).

## Source Assessment Summary
Assessed World Bank API, SBV, GSO, and IMF. World Bank API was chosen as the primary candidate for this phase due to its public, stable REST JSON interface for annual GDP and CPI data.

## Ingestion Preview Result
```text
phase: 147A
mode: macro_data_ingestion_preview
dryRun: true
dbWriteAttempted: false
sourcesChecked: World Bank API
indicatorsChecked: CPI_YOY, GDP_GROWTH
providerFetchAttempted: true
providerFetchSucceeded: true
candidateMacroRows: 2
candidateRowsValidForProposedSchema: true
previewBlocked: false
previewBlockedReasons: None
productionApprovedTrueCount: 0
needsReviewTrueCount: 2
warningCodeCounts: UNVERIFIED_SOURCE:2, PREVIEW_ONLY:2
readyForMacroConfirmWritePhase: false
readyForProductionApproval: false
smokePassed: true
```

## Readiness Gates Summary
All gates regarding schema migration and `readyForProductionApproval` remain strictly **FALSE**. Safety rules block any DB writes until the schema is formally merged.

## Assistant/UI Boundary Summary
Enforced strict wording rules ensuring the Assistant only suggests potential macro relationships ("có thể liên quan") and never deterministic investment conclusions ("chắc chắn hưởng lợi").

## Validation Results
- `prisma validate`: Passed. The schema is valid.
- `prisma generate`: Passed. Client generated successfully.
- `typecheck`: Passed. No emit errors.
- `build`: Passed. Compiled successfully in 8.1s.
- `lint`: Global lint is **not a clean pass**. Failure is pre-existing/out of scope, verified by pre-change status (185 problems, largely `any` types and `prefer-const` violations across older scripts). 

## Known Gaps
- No approved macro schema yet (proposal only).
- No confirmed automated source yet (World Bank is a candidate but lags significantly).
- No macro DB write performed.
- Macro data not production-approved.
- Industry impact mapping not implemented yet.

## Next Recommended Phase
Phase 147B — Macro data schema migration and staging confirm-write preview
