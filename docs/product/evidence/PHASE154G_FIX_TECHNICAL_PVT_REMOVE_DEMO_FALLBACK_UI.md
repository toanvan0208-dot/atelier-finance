# Phase 154G-fix — Technical/PVT Remove Demo Fallback UI

## Issue Summary
Manual browser testing observed that the Technical/PVT module continued to display old demo/mock/fallback labels (e.g. "Dữ liệu minh họa", "Dữ liệu minh họa dự phòng", and "MWG" defaults) despite receiving real DB-backed MarketPrice time-series data for HPG, VNM, and MWG.

## Root Cause
The component data mapper `buildTechnicalDeskData` was aggressively copying `baseData` (the demo fallback payload) and failing to mask the `companyName`, `industry`, and `issuerMetadata` properties when `snapshot.sourceKind === "market_price_series"`. This caused the UI header components to display the static demo labels, triggering the "Dữ liệu minh họa" indicators and preserving the "MWG" identity block for other tickers. Furthermore, the hero conclusion text contained terminology that resembled a behavioral signal ("xác nhận luận điểm hay đang tạo FOMO").

## Files Changed
- `src/features/technical/lib/build-technical-desk-data.ts`
  - Stripped out `companyName`, `industry`, and default `issuerMetadata` when data is DB-backed, suppressing the demo labels and forcing the component to rely on the active DB ticker.
- `src/features/technical/components/PVTHeroStatus.tsx`
  - Replaced the FOMO/actionable hero copy with safe, educational wording: "Giá và thanh khoản đang thay đổi như thế nào?".
  - Removed "khuyến nghị" to avoid triggering anti-advice safeguards ("lời khuyên đầu tư").
- `scripts/smoke-technical-pvt-timeseries-ui-http-hpg-vnm-mwg.ts`
  - Added strict assertions against demo wording leakage, verifying that "minh họa", "demo", "mock", "fallback", and specific dates like "2026-06-01" do not leak into the rendered HTML of HPG, VNM, and MWG.

## Smoke Test Results
| Metric | Status |
| :--- | :--- |
| **HPG Page shows HPG State** | `true` |
| **VNM Page shows VNM State** | `true` |
| **MWG Page shows MWG State** | `true` |
| **Old "Dữ liệu minh họa" Absent** | `true` |
| **Old "2026-06-01" Demo Date Absent** | `true` |
| **Selected Ticker Respected** | `true` |
| **Time-Series Chart Visible** | `true` |
| **PVT Observation-Only** | `true` |

## Feature Guardrails
| Guardrail | Adherence Status |
| :--- | :--- |
| **Trading Signal/Advice Detected** | `false` |
| **Target Price/Fair Value Detected** | `false` |
| **Benchmark/Ranking/Scoring** | `false` |
| **FPT/MSN/VCB Display Only** | `true` |
| **Fake/Mock/Fallback As Real** | `false` (Successfully removed) |
| **DB Writes / Provider Fetches** | None |
| **Production Approved True Count** | 0 |

## Recommended Next Phase
**Phase 154H — Technical/PVT Manual Browser Screenshot Evidence**
