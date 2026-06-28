# Macro Data Production Readiness Gates

**Current Status**: STAGING (Candidate Data Confirmed, Not Ready For Production)

This document tracks the safety requirements and verification steps that must be passed before macro data ingestion can be considered ready for automated production database writes.

## Required Gates

| Gate | Status | Required Criteria |
| :--- | :--- | :--- |
| `macroSchemaApproved` | **TRUE** | The `MacroIndicator`, `MacroObservation`, and `MacroObservationProvenance` models have been merged into the Prisma schema and synchronized with staging. |
| `macroSourceDocumented` | **TRUE** | A candidate source (World Bank API) has been documented in `MACRO_DATA_SOURCE_ASSESSMENT.md`. |
| `macroSourceLicenseReviewed` | **TRUE** | World Bank API is open data, permitting non-commercial and commercial use with attribution. |
| `macroProviderFetchVerified` | **TRUE** | Data successfully fetched from the World Bank API. |
| `macroProvenanceModelReady` | **TRUE** | `MacroObservationProvenance` schema is live and successfully records retrieval metadata and warning codes. |
| `macroUnitFrequencyMetadataReady` | **TRUE** | The schema successfully enforces unit (`% YoY`) and frequency (`annual`) tracking. |
| `macroStaleDataPolicyDefined` | **FALSE** | We must define what happens if the API fails for >X days (does the UI warn the user?). |
| `macroAssistantGuardrailsReady` | **TRUE** | Strict boundaries have been documented forbidding the AI from making definitive macro-to-industry conclusions. |
| `readyForMacroConfirmWrite` | **TRUE** | Prisma schema successfully staged and preview data successfully written to staging under `candidate_macro_data` mode. |
| `readyForMacroUiIntegration` | **TRUE** | Macro UI now successfully reads `CPI_YOY` and `GDP_GROWTH` from the database read path (`loadMacroRuntimeData`) instead of static mock data. |
| `readyForAssistantMacroContextIntegration` | **TRUE** | Assistant successfully receives DB-grounded `macroContext` (with provenance/warnings) via `/api/assistant`. |
| `macroIndicatorUniverseDefined` | **TRUE** | Phase 148A defined the indicator registry, cleared all fake data from UI/Assistant, and enforced strict db-backed validation rules. |
| `readyForProductionApproval` | **FALSE** | Requires full execution of human review. Data remains `productionApproved=false` and `world_bank_candidate`. |

## Why Macro Data is Not Production-Ready Yet
Atelier Finance demands verifiable data to prevent the Assistant from hallucinating financial reality. We have successfully written real CPI/GDP candidate data from the World Bank to the staging database (Phase 147C), and now (Phase 147D) both the UI and AI Assistant actively read from this DB. However, the data remains classified as unverified candidate data (`productionApproved=false`), meaning it cannot be shipped to production until human verification processes are fully integrated and data sources are formally approved.
