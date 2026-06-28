# Macro Data Production Readiness Gates

**Current Status**: NOT READY FOR PRODUCTION (Preview / Candidate Stage Only)

This document tracks the safety requirements and verification steps that must be passed before macro data ingestion can be considered ready for automated production database writes.

## Required Gates

| Gate | Status | Required Criteria |
| :--- | :--- | :--- |
| `macroSchemaApproved` | **FALSE** | The `MacroIndicator`, `MacroObservation`, and `MacroObservationProvenance` models must be merged into the Prisma schema and a migration successfully executed. |
| `macroSourceDocumented` | **TRUE** | A candidate source (World Bank API) has been documented in `MACRO_DATA_SOURCE_ASSESSMENT.md`. |
| `macroSourceLicenseReviewed` | **TRUE** | World Bank API is open data, permitting non-commercial and commercial use with attribution. |
| `macroProviderFetchVerified` | **TRUE** | A fail-closed preview script successfully fetched data from the World Bank API without crashing. |
| `macroProvenanceModelReady` | **FALSE** | A `MacroObservationProvenance` schema was proposed but is not yet migrated to the database. |
| `macroUnitFrequencyMetadataReady` | **TRUE** | The proposed schema successfully enforces unit (`% YoY`) and frequency (`annual`) tracking. |
| `macroStaleDataPolicyDefined` | **FALSE** | We must define what happens if the API fails for >X days (does the UI warn the user?). |
| `macroAssistantGuardrailsReady` | **TRUE** | Strict boundaries have been documented forbidding the AI from making definitive macro-to-industry conclusions. |
| `readyForMacroConfirmWrite` | **FALSE** | Pending Prisma schema migration and review of the preview data structure. |
| `readyForProductionApproval` | **FALSE** | Requires full execution of the ingestion script in staging, verification of UI read-paths, and human review of the fetched data. |

## Why Macro Data is Not Production-Ready Yet
Atelier Finance demands verifiable data to prevent the Assistant from hallucinating financial reality. We have successfully audited the current state (which relied on hardcoded mock data) and proven we can fetch real CPI/GDP data from the World Bank. However, because the database lacks the structured tables to store this timeseries data with its required provenance metadata, any automated ingestion would either fail or corrupt the existing models. We must execute a schema migration before writes can be enabled.
