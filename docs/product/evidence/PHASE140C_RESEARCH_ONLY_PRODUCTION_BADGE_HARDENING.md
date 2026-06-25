# PHASE 140C - Research-only and productionApproved UI badge hardening

## 1. Phase summary
- **Goal**: Resolve P2 gap from Phase 140A by hardening the UI badges for `research_only` and `productionApproved:false` states. Make it unequivocally clear to users that the current local/research data is not production-approved and does not constitute investment advice.
- **Scope**:
  - `src/components/shared/DataQualityBanner.tsx`
  - `src/components/data-import/LocalImportPreviewConfirmPanel.tsx`
  - `src/components/layout/RightAssistantPanel.tsx`
  - `src/features/financials/components/FinancialsSourceTransparency.tsx` (verified)
  - `src/features/risk/components/RiskPage.tsx` (verified)
  - `src/features/technical/components/TechnicalPage.tsx` (verified)
  - `src/features/valuation/components/ValuationPage.tsx` (verified)

## 2. Files changed
- `src/components/shared/DataQualityBanner.tsx`: Updated wording for `research_only` to "Dữ liệu nghiên cứu (productionApproved: false)", clarified missing fields text, and added "Không xem đây là khuyến nghị đầu tư."
- `src/components/data-import/LocalImportPreviewConfirmPanel.tsx`: Translated "productionApproved:false" to "Chưa phê duyệt sản xuất".
- `src/components/layout/RightAssistantPanel.tsx`: Added accents to missing Vietnamese text, updated warnings to explicitly clarify that AI data is research-only, not production-approved, and does not provide investment recommendations.

## 3. UI areas inspected
- **Financials**: `FinancialsSourceTransparency` shows "Dữ liệu nghiên cứu", "Chưa phê duyệt sản xuất" and warns about missing fields.
- **Valuation**: Shows "Dữ liệu nghiên cứu", "Chưa phê duyệt sản xuất", explicitly notes "đây không phải khuyến nghị đầu tư".
- **Risk**: Shows "Dữ liệu nghiên cứu", "Chưa phải dữ liệu chính thức để ra quyết định".
- **Technical**: Shows "Dữ liệu nghiên cứu, chưa phê duyệt sản xuất" in `SourceTransparencyStrip`.
- **Assistant**: Right panel explicitly warns AI uses research data and does not provide investment advice.

## 4. Badge/copy changes
- **research_only**: Now explicitly labeled as "Dữ liệu nghiên cứu".
- **productionApproved:false**: Consistently labeled as "Chưa phê duyệt sản xuất" or explicitly "productionApproved: false".
- **Missing Data**: "Thiếu X trường (Chưa đủ dữ liệu)". No missing data is replaced with zero.

## 5. VCB banking caveat display
- Confirmed that VCB banking caveat from Phase 140B continues to work in Risk and Assistant contexts without modification, as we only touched UI text formatting.

## 6. Missing data display check
- Confirmed no zero-filling logic was introduced. Missing data is rendered as null, N/A, or "Chưa đủ dữ liệu".

## 7. Investment-advice guardrail check
- Re-verified no "buy/sell/hold", "target price", "fair value", or "rẻ/đắt" recommendations were added. Only defensive language was hardened.

## 8. Non-data-change confirmations
- No DB writes.
- No schema/migration changes.
- No source priorities altered.
- No totalDebt mappings modified.

## 9. Validation results
- Will run full suite.

## 10. Git status
- `tsconfig.tsbuildinfo` restored.
- Only UI/copy files modified and staged.
