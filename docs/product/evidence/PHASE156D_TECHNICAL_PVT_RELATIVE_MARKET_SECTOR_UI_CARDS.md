# Phase 156D — Technical/PVT Relative Market And Sector UI Cards

## Goal
Add user-facing Technical/PVT UI cards for neutral market and sector comparison.
Provide visual relative performance data without introducing any rankings, scorings, benchmark recommendations, or investment advice.

## Scope
- Integrated relative metrics into the Technical/PVT read-path (`buildRelativeMarketSectorMetrics` called via `loadTechnicalRuntimeData`).
- Developed `PVTRelativeMarketSectorCards` component to render the data safely and neutrally.
- Handled potential missing date alignments securely without inference or silent fallback logic.

## What This Phase Adds
- A new section under the Technical/PVT view titled "So sánh với thị trường và chỉ số ngành tham chiếu".
- Transparent, observation-only data tables comparing 5, 20, and 60-trading-day returns of the underlying asset to broad indices (`VNINDEX`, `VN30`) and relevant sector proxies.

## UI Component & Formula Summary
- **Logic:** Derived from `PVTObservationData["relativeMetrics"]`. Simple percentage return difference computations generated in Phase 156C.
- **Components:** Created `PVTRelativeMarketSectorCards.tsx`, embedded inside `TechnicalPage.tsx`.
- **Wording:** Uses specific neutral labels like "Chênh lệch so với VNINDEX", "Chênh lệch so với chỉ số ngành tham chiếu", và "điểm phần trăm".

## Date Alignment Rule & Missing/Null Handling
Dates from multiple disparate series are aligned based on absolute trading date intersections. If an intersection is not met, the underlying formula returns `null`. The UI intercepts this `null` and correctly renders `"Chưa đủ dữ liệu khớp ngày"`. The system enforces a strict zero-fill blockade.

## Sector Proxy Mapping & HPG/VNM/MWG Availability
- **HPG:** Comparisons to `VNINDEX`, `VN30`, and `VNMAT` (Materials).
- **VNM:** Comparisons to `VNINDEX`, `VN30`, and `VNCONS` (Broad Consumer).
- **MWG:** Comparisons to `VNINDEX`, `VN30`, and `VNCONS` (Broad Consumer).
- **MWG Broad Consumer Proxy Caveat:** Present exactly as requested: *"VNCONS là chỉ số tiêu dùng rộng, không phải chỉ số bán lẻ chuyên biệt."*

## Guardrail Wording Check
- **No Ranking/Scoring:** Confirmed. Output solely represents percentage point differentials.
- **No "Buy/Sell/Hold" Equivalents:** Confirmed. The UI states: *"Không phải tín hiệu giao dịch"* and *"Cần đối chiếu thêm với mô hình kinh doanh, báo cáo tài chính, định giá và rủi ro"*.
- **FPT/MSN/VCB Display-Only:** Confirmed. Because they are not wired into the `MarketPrice` DB, their relative computation bypasses the proxy and stays blank/display-only.

## Safety Confirmations
- **DB Writes:** No
- **Schema Change:** No
- **Provider Fetch Attempted:** No
- **productionApprovedTrueCount:** 0

## Recommended Next Phase
Phase 156E — Technical/PVT Relative Market/Sector Browser Evidence And Final Polish
