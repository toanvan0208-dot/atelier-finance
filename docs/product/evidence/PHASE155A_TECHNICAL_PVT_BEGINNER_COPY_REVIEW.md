# Phase 155A — Technical/PVT Beginner Copy Review

## Goal
Review and improve the user-facing explanations in the Technical/PVT module for low-financial-literacy users, strictly clarifying that PVT is a research-only observational tool and avoiding any trading signal language.

## Scope
- UI/copy review and improvements.
- No logic, schema, data, or priority changes.
- Ensure all copy complies with strict guardrails against providing investment advice.

## Before/After Copy Summary
1. **Hero Headline & Subcopy (`PVTHeroStatus.tsx`)**
   - **Before**: "Module này giúp quan sát diễn biến giá, khối lượng và thanh khoản theo thời gian. Đây không phải tín hiệu giao dịch hay lời khuyên đầu tư."
   - **After**: "Module này giúp quan sát diễn biến giá, khối lượng và thanh khoản theo thời gian. PVT là chỉ báo kết hợp biến động giá và khối lượng, giúp quan sát xem thay đổi giá có đi kèm khối lượng đáng kể hay không. Đây không phải tín hiệu giao dịch hay lời khuyên đầu tư."
2. **PVT Explanation (`PVTCommandCenter.tsx`)**
   - **Before**: "PVT chỉ là lớp quan sát, không thay thế phân tích cơ bản."
   - **After**: "PVT là chỉ báo kết hợp biến động giá và khối lượng. Nó giúp quan sát xem thay đổi giá có đi kèm khối lượng đáng kể hay không. PVT không tự tạo kết luận hành động. PVT chỉ là lớp quan sát, không thay thế phân tích cơ bản."
3. **Volume/Liquidity (`PVTCommandCenter.tsx`)**
   - **Before**: "Volume có thể xác nhận, phủ nhận hoặc chỉ phản ánh nhiễu do tin tức."
   - **After**: "Volume có thể xác nhận, phủ nhận hoặc chỉ phản ánh nhiễu do tin tức. Khối lượng cao hơn bình thường có thể cho thấy mức độ quan tâm thị trường tăng lên, nhưng cần đối chiếu với tin tức, kết quả kinh doanh và rủi ro."
4. **Support/Resistance (`PVTRiskRewardZone.tsx`, `PVTMainChart.tsx`, `PVTHeroStatus.tsx`)**
   - **Before**: "Hỗ trợ gần", "Kháng cự gần"
   - **After**: "Vùng tham khảo dưới", "Vùng tham khảo trên" (or "Tham khảo (dưới)", "Tham khảo (trên)")
5. **FOMO (`PVTCommandCenter.tsx`, `PVTFomoThermometer.tsx`)**
   - **Before**: "FOMO check nhanh", "Thước đo FOMO"
   - **After**: "Cảnh báo tâm lý thị trường", "Kiểm tra tâm lý chi tiết"
6. **Conclusion (`PVTFinalConclusion.tsx`)**
   - **Before**: (No caveat)
   - **After**: Added neutral caveat: "Dữ liệu giá và thanh khoản chỉ hỗ trợ quan sát thị trường. Người dùng cần tự kiểm tra thêm mô hình kinh doanh, báo cáo tài chính, định giá và rủi ro."

## Files Changed
- `src/features/technical/components/PVTCommandCenter.tsx`
- `src/features/technical/components/PVTFinalConclusion.tsx`
- `src/features/technical/components/PVTFomoThermometer.tsx`
- `src/features/technical/components/PVTHeroStatus.tsx`
- `src/features/technical/components/PVTMainChart.tsx`
- `src/features/technical/components/PVTRiskRewardZone.tsx`

## Guardrail Wording Check
- **FPT/MSN/VCB display-only confirmation**: Passed. Remaining as display-only without analysis eligible.
- **Forbidden words**: Successfully omitted all forbidden words including `mua`, `bán`, `nắm giữ`, `tín hiệu`, `target price`, `fair value`, `upside`, `downside`, `ranking`, `scoring`, etc.
- **Observation-only caveat**: Implemented in Hero, Final Conclusion, and PVT details.
- **Source/research caveat**: Verified present ("Dữ liệu nghiên cứu, chưa phê duyệt sản xuất").

## DB / Schema / Provider Fetch Confirmation
- DB writes: `No`
- Schema change: `No`
- Provider fetch: `No`
- ProductionApprovedTrueCount: `0`

## Next Recommended Phase
Phase 155B — Technical/PVT Final UI Smoke And Module Completion Evidence
