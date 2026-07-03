# Phase 154B — Technical/PVT Missing-State UX Simplification & Latest Snapshot Display

## Goal
Implement safe display of the latest price/volume snapshot while keeping time-series data guarded/hidden. Simplify the UI/UX for the Technical/PVT module when time-series data is absent, specifically addressing the negative feedback message "Chưa đủ dữ liệu Technical/PVT".

## Actions Taken
1. **Dynamic Default Dates:**
   Modified `load-technical-runtime-data.ts` to replace hardcoded `2025-06-30` from/to constraints with dynamic dates (`new Date() - 1 year` to `new Date()`). This allows the module to correctly discover the latest snapshot (`2026-07-02`) regardless of when it was captured.
   - Preserved `VNStock market price snapshot` source label case-matching for reliable DB fetching.

2. **Bypass Unit Metadata Errors for Snapshot Fallback:**
   In `load-technical-desk-data.ts`, bypassed the early `safeErrorResult` return when `unitMetadataErrors` are present. This allows the read-path to progress to `buildTechnicalFromMarketPriceSeries`, which correctly leverages `captureMarketPvtUnitMetadata` to dynamically synthesize the missing unit metadata mapping without performing forbidden DB writes.

3. **Missing Time-Series Guard & UI Simplification:**
   Updated `TechnicalPage.tsx` to explicitly check `data.pvtChartSeries?.points?.count <= 1`. When only a single snapshot is available:
   - The main charts, signal layers, risk/reward zone, and FOMO thermometer are safely hidden.
   - A simplified guard block `Chưa đủ dữ liệu chuỗi thời gian (Time-Series)` is displayed instead.
   - `PVTHeroStatus` successfully renders the latest 1-day snapshot values (e.g. current price) while showing "Chưa đủ dữ liệu" for derived metrics (MA20, Support, Resistance, FOMO).

## Audit & Verification
- `audit-technical-pvt-module-hpg-vnm-mwg.ts` confirmed `hasData: true` for HPG, VNM, and MWG.
- Types compiled successfully (`npx tsc --noEmit`).
- No DB writes, schema changes, or provider fetches were attempted.
- Zero-fills were avoided; missing components cleanly output their null states or "unavailable" strings.
- Forbidden investment advice terminology (buy/sell/hold/target) was strictly avoided in the fallback UI.
