# Phase 154C — Technical/PVT Snapshot UI HTTP Smoke For HPG/VNM/MWG

## Goal
Run HTTP/UI smoke against the actual local Next.js UI component to verify that the Technical/PVT module renders safely for HPG, VNM, and MWG using only latest snapshot data. We must ensure that the missing time-series guard works correctly, and that one-day snapshots are never treated as time-series data.

## Scope
- Ensure no DB writes, schema changes, or provider fetches are made.
- Verify that the snapshot correctly surfaces latest price and volume.
- Verify that the simplified missing time-series guard "Chưa đủ dữ liệu chuỗi thời gian (Time-Series)" is visible.
- Ensure all time-series dependent charts, signals, and FOMO are successfully hidden.
- Verify absence of old negative UI copy.
- Verify absence of forbidden trading signals, target prices, or benchmark scorings.
- Ensure FPT, MSN, and VCB remain firmly display-only.

## Why this phase is needed after 154B
Phase 154B implemented UI simplifications and snapshot-fallback read paths. Phase 154C explicitly verifies that those UI/logic mechanisms actually translate to correct HTML rendering in a simulated HTTP/Render layer using `renderToStaticMarkup`. This guarantees that users will not accidentally see broken chart components or false trading signals.

## HTTP Route Strategy
A custom script `scripts/smoke-technical-pvt-snapshot-ui-http-hpg-vnm-mwg.ts` was created to programmatically invoke `loadTechnicalRuntimeData` for the target tickers and pass them into the `TechnicalPage` functional component. We rendered the component to static HTML and strictly asserted the presence or absence of specific phrases, UI elements, and forbidden keywords.

## Smoke Results

| Metric | Result |
| :--- | :--- |
| **HPG/VNM/MWG UI Smoke Passed** | Yes |
| **Snapshot Data Visible** | Yes (Hero Status rendered with current price & volume) |
| **Time-Series Guard Visible** | Yes ("Chưa đủ dữ liệu chuỗi thời gian") |
| **Old Negative Copy Absent** | Yes |
| **Chart/Signal/FOMO Hidden** | Yes |
| **One-day Snapshot Misused** | No |
| **Trading Advice/Signals Absent** | Yes |
| **Zero-Fills Detected** | No |
| **FPT/MSN/VCB Display-Only** | Yes |
| **DB Writes/Provider Fetches** | None |
| **Production Approved Count** | 0 |

## Minimal Fixes Made
- Handled ESLint `@typescript-eslint/no-explicit-any` warning inside the smoke script.
- Corrected React component property bindings for `TechnicalPageProps`.

## Next Recommended Phase
**Phase 154D — Technical/PVT Time-Series Source Package Dry Run**, only if you want real charts/PVT later.
