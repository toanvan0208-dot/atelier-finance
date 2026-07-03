# Phase 154G — Technical/PVT Time-Series UI HTTP Smoke For HPG/VNM/MWG

## Goal
Run a UI/HTTP smoke test on the Technical/PVT module after historical MarketPrice time-series data import. Verify that the `TechnicalPage` correctly renders the real time-series charts for HPG, VNM, and MWG via server-side rendering, ensuring snapshot-only guards are cleared and no forbidden terms leak into the view.

## Scope
- Validate Technical/PVT route rendering via `renderToStaticMarkup` without modifying core UI code.
- Ensure snapshot-only and missing-data guards are not triggered for eligible tickers.
- Confirm chart layout items and PVT widgets render.
- Validate FPT, MSN, and VCB remain in display-only mode.
- Prevent any DB writes, schema changes, or provider fetches.

## Execution Notes
- Data loaded from local DB via `loadTechnicalRuntimeData`.
- Script generated raw HTML string and asserted on expected textual structures (e.g., `Biểu đồ giá`, `Vùng Kỹ thuật`, `PVT`).
- The test observed `snapshotOnlyGuardVisible: false` indicating successful time-series UI activation.

## Smoke Test Results
| Metric | Status |
| :--- | :--- |
| **HPG/VNM/MWG HTTP/Render Passed** | `true` |
| **Time-Series Chart Visible** | `true` |
| **Snapshot Guard Visible** | `false` |
| **Latest Snapshot Visible** | `true` |
| **PVT Visible** | `true` |
| **Old Negative Copy Detected** | `false` |
| **Points Count Rendered** | 250 points |

## Feature Guardrails
| Guardrail | Adherence Status |
| :--- | :--- |
| **DB Writes / Provider Fetches** | None |
| **Schema Changes** | None |
| **Trading Signal/Advice Detected** | `false` |
| **Target Price/Fair Value Detected** | `false` |
| **One-day Snapshot Misuse** | `false` |
| **FPT/MSN/VCB Display Only** | `true` |
| **Production Approved True Count** | 0 |

## Recommended Next Phase
**Phase 154H — Technical/PVT Manual Browser Screenshot Evidence**
