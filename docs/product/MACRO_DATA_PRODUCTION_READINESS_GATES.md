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
| `macroStaleDataPolicyDefined` | **TRUE** | A frequency-based stale policy is defined and integrated, warning users when data is older than expected (e.g., daily > 5 days). |
| `macroAssistantGuardrailsReady` | **TRUE** | Strict boundaries have been documented forbidding the AI from making definitive macro-to-industry conclusions. |
| `readyForMacroConfirmWrite` | **TRUE** | Prisma schema successfully staged and preview data successfully written to staging under `candidate_macro_data` mode. |
| `readyForMacroUiIntegration` | **TRUE** | Macro UI now successfully reads `CPI_YOY` and `GDP_GROWTH` from the database read path (`loadMacroRuntimeData`) instead of static mock data. |
| `readyForAssistantMacroContextIntegration` | **TRUE** | Assistant successfully receives DB-grounded `macroContext` (with provenance/warnings/freshness) via `/api/assistant`. |
| `macroIndicatorUniverseDefined` | **TRUE** | Phase 148A completed and committed. All necessary metrics identified. Phase 148B restricted future additions to strictly match the existing frontend. |
| `readyForFrontendLockedProviderExpansion` | **TRUE** | Phase 148B locked the provider expansion scope solely to indicators currently in the Macro frontend. |
| `macroSourceVerificationCompleted` | **TRUE** | Phase 148C evaluated automation levels for all frontend-locked indicators, restricting machine_readable fetch paths only. |
| `macroParserStrategyCompleted` | **TRUE** | Phase 148D evaluated parser feasibility. Phase 148I audited semantic mapping for domestic-rate. Phase 148J finalized POLICY_RATE as the domestic-rate representative indicator. |
| `readyForParserPrototypePhase` | **TRUE** | Approved to build prototypes for the Phase 148D candidates. |
| `parserDryRunCompleted` | **TRUE** | Phase 148E executed real-source parser dry runs. `USD_VND` and `INTERBANK_RATE_OVERNIGHT` safely blocked due to missing formal source URLs. Phase 148G attempted dry run with verified URLs but blocked due to complex HTML. |
| `sourceUrlVerificationCompleted` | **TRUE** | Phase 148F verified SBV URLs for `USD_VND` and `INTERBANK_RATE_OVERNIGHT` as reachable without parsing numeric data. Phase 148H identified an alternate reachable XML API for `USD_VND`. Phase 148K verified the SBV URL for `POLICY_RATE`, identifying it as a dynamic Liferay portal and marking it as blocked for automated parser dry runs. Phase 148L solidified the manual-review boundary and unavailable state handling. |
| `readyForExpandedConfirmWrite` | **FALSE** | Currently only CPI/GDP (World Bank) is verified as machine readable and implemented. Other APIs (e.g. FRED, FMP, VCB) require parser implementation. |
| `readyForProductionApproval` | **FALSE** | Requires full execution of human review. Data remains `productionApproved=false`. |

## Why Macro Data is Not Production-Ready Yet
Atelier Finance demands verifiable data to prevent the Assistant from hallucinating financial reality. We have successfully written real CPI/GDP candidate data from the World Bank to the staging database (Phase 147C), and now (Phase 147D) both the UI and AI Assistant actively read from this DB. However, the data remains classified as unverified candidate data (`productionApproved=false`), meaning it cannot be shipped to production until human verification processes are fully integrated and data sources are formally approved.
