# Phase 144D: Screening DB Read-Path Integration

## Objective
Connect the `Screening` module to real staging DB data using modular runtime loaders, replacing the hard-coded mock data for `FPT`, `MWG`, and `VNM` while preserving existing layout and product guardrails.

## Changes Made
1. **Created `load-screening-runtime-data.ts`**:
   - Fetches FPT, HPG, VNM, MSN, MWG from DB with `dataMode: "research_only"`.
   - Uses `loadFinancialsRuntimeData` for fundamental data.
   - Leverages `buildControlledValuationIntegrationBoundary` to test P/E and P/B readiness.
   - Safely isolates `VCB` as `not-fit` / "Không được hỗ trợ" with appropriate explanation and warning.
2. **Updated Integration Boundaries**:
   - `WorkspacePage` now eager loads `loadScreeningRuntimeData`.
   - Passes `initialScreeningData` to `AppShell` -> `ScreeningPage`.
3. **Refactored `ScreeningPage`**:
   - Replaced static fallback with DB-backed `candidates`.
   - Preserves `screeningRedesignData` static metadata for components (gates, headers, tips).

## Validation Results
- `npm run lint` and `npm run typecheck`: Passed.
- `smoke-staging-screening-read-path.ts` executed cleanly on local staging.
- All non-bank tickers mapped to `priority` (Đủ dữ liệu để phân tích tiếp).
- VCB properly blocked from screening criteria calculation.

## Next Steps
The Screening module is now DB-backed for the read-path. The core learning flow is almost fully integrated with the exception of the `Simulation` and `Learning` modules, which will be targeted in subsequent phases.
