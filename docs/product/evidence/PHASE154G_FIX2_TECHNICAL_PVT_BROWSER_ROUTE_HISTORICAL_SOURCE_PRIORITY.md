# Phase 154G-fix2 — Technical/PVT Browser Route Must Prefer Historical Time-Series Over Snapshot

## Issue Summary
Manual browser review showed that navigating to `/workspace?module=technical&ticker=MWG` still rendered the snapshot-only fallback state ("Chưa đủ dữ liệu chuỗi thời gian (Time-Series)", with latest date 2026-07-02), despite Phase 154E successfully inserting 1,699 historical MarketPrice DB rows (up to 2026-07-03). The root cause was that `loadTechnicalRuntimeData` hardcoded the `sourceLabel` to "VNStock market price snapshot" whenever a ticker was explicitly requested via the URL but the `sourceLabel` query parameter was omitted.

## Root Cause
1. **Hardcoded Fallback in URL Parsing**: `src/features/technical/lib/load-technical-runtime-data.ts` mapped undefined `sourceLabel` to `"VNStock market price snapshot"`, preventing the historical source from ever being loaded by default.
2. **Lack of Dynamic Priority**: `src/features/technical/lib/load-technical-desk-data.ts` simply read from whichever `sourceLabel` was passed, without attempting a fallback chain (Historical -> Snapshot).
3. **No-Ticker Leaking MWG Demo Data**: `load-technical-runtime-data.ts` defaulted `allowFallback` to `true` when no ticker was provided. If no ticker was provided, it defaulted the ticker to "FPT" and fell back to static MWG demo data because no DB source matched.

## Files Changed
- `src/features/technical/lib/load-technical-runtime-data.ts`: Removed the hardcoded "VNStock market price snapshot" fallback for `sourceLabel`. Changed default `allowFallback` to `false` to prevent the no-ticker route from defaulting to the demo state.
- `src/features/technical/lib/load-technical-desk-data.ts`: Implemented source priority. It now attempts to load `"VNStock historical market price"` by default if `sourceLabel` is omitted. If the historical query returns 0 or 1 point, it dynamically falls back to query `"VNStock market price snapshot"`.
- `scripts/smoke-technical-pvt-timeseries-ui-http-hpg-vnm-mwg.ts`: Upgraded the smoke test to invoke `loadTechnicalRuntimeData` exactly as the browser route does (without forcefully overriding `sourceLabel` or `preferDb`), ensuring it validates the dynamic priority. Added tests for the no-ticker neutral state.

## Before Behavior
- `/workspace?module=technical&ticker=MWG` resulted in the one-day snapshot UI guard with `points.count <= 1`.
- `/workspace?module=technical` rendered the mock static MWG payload.

## After Behavior
- **HPG/VNM/MWG Browser Routes**: Successfully utilize the historical time-series data without explicit source labels in the URL.
- **Snapshot-Only Guard**: Absent for HPG, VNM, MWG.
- **Latest Date**: Shows `2026-07-03`, confirming historical source usage instead of the snapshot source (2026-07-02).
- **Chart / Time-Series**: Visible with 250 points.
- **No-Ticker Route**: Returns a neutral selection state ("Chưa đủ dữ liệu Technical/PVT") instead of the MWG demo payload.

## Smoke Test Results
| Metric | Status |
| :--- | :--- |
| **HPG/VNM/MWG Browser Route Uses Historical** | `true` |
| **HPG/VNM/MWG Points Count** | 250 |
| **HPG/VNM/MWG Snapshot Guard Visible** | `false` |
| **Latest Date** | `2026-07-03` |
| **Historical Source Preferred** | `true` |
| **Snapshot Used Only As Fallback** | `true` |
| **No-Ticker Does Not Render Demo** | `true` |
| **No-Ticker Shows Neutral Selection** | `true` |
| **Demo / Fallback / Mock Copy Detected** | `false` |
| **Trading Signal / Advice Detected** | `false` |

## Feature Guardrails
| Guardrail | Adherence Status |
| :--- | :--- |
| **FPT/MSN/VCB Display Only** | `true` |
| **DB Writes / Provider Fetches** | None |
| **Schema Changes** | None |
| **Production Approved True Count** | 0 |

## Recommended Next Phase
**Phase 154H — Technical/PVT Manual Browser Screenshot Evidence**
