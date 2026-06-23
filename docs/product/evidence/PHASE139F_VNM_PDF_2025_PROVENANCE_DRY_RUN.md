# Phase 139F: VNM PDF 2025 Provenance Dry Run

## Objective
Manually inspect the VNM 2025 Annual Report PDF and produce a VNM-only PDF 2025 preview and dry-run import candidate. This phase mimics the HPG PDF review process from Phase 139B/139C to capture verified financial data for VNM without making DB writes or changing schema.

## Scope Boundaries
- **Target ticker:** VNM only.
- **Other tickers:** FPT, MWG, HPG, VCB, MSN are excluded from modifications but may be referenced for source priority or unit validation.
- **Forbidden actions:** No DB write, no import, no confirm-write, no schema change, no migration, no PDF binary commit, no missing-to-zero, no productionApproved=true, no investment recommendation language.
- **Hard guardrails:** No fake values, no totalLiabilities-as-totalDebt, missing/uncertain values remain `null/needs_review`.

## Referenced Commits
- **Phase 139B (HPG preview):** `1baa44d75b42720c1a62e58b88a39f8df51197d8`
- **Phase 139C (HPG dry run):** `236035dea8e29a25a74938ad62909e0b1963ab88`
- **Phase 139D (HPG import):** `b1d342dc5ad7328ec53fe74994e0fe34742027b8`
- **Phase 139E (HPG smoke):** `55fffaeaa149b56f8f533df01cf56b8da07593da`

## PDF Inspected
`docs/product/evidence/source-pdfs/VNM_Annual_Report_2025.pdf`

**Was the PDF binary committed?** No.

## Extraction Method Used
Manual inspection and OCR via `view_file` tool on the local untracked PDF.

## Commands Run
- `npx tsx scripts/preview-annual-report-2025-financials.ts`
- `npx tsx scripts/dry-run-vnm-pdf-reviewed-import.ts`
- `npx vitest run src/lib/data-sources/__tests__/dry-run-vnm-pdf-reviewed-import.test.ts`
- `npx prisma validate ; npm run typecheck ; npm run lint ; npm test ; npm run build`

## VNM Extraction Table

| Field | Source Value | Source Unit | Normalized Value | Normalized Unit | Status | Page | Section/Table | Evidence Note | Caveat |
|-------|--------------|-------------|------------------|-----------------|--------|------|---------------|---------------|--------|
| eps | 4.070 | VND/cổ phiếu | 4070 | vnd_per_share | preview | 109 | Báo cáo kết quả hoạt động kinh doanh và thu nhập toàn diện khác hợp nhất | "Lãi cơ bản trên cổ phiếu (VND): 4.070" | Explicitly defined. |
| sharesOutstanding | 2.089.955.445 | cổ phần | 2089955445 | shares | preview | 12 | Cổ phần và cơ cấu cổ đông | "Khối lượng cổ phiếu đang lưu hành: 2.089.955.445 cổ phần." | Matches VNStock candidate (2,089,955,445). |
| totalDebt | 9.456.645 | Triệu VND | 9456.645 | billion_vnd | derived_preview | 108 | Báo cáo tình hình tài chính hợp nhất | Vay ngắn hạn 9.393.737 Triệu VND + Vay dài hạn 62.908 Triệu VND | Derived safely from explicit short and long-term borrowings. |
| totalAssets | 56.091.826 | Triệu VND | 56091826 | million_vnd | preview | 108 | Báo cáo tình hình tài chính hợp nhất | "TỔNG TÀI SẢN: 56.091.826 Triệu VND" | Explicitly defined. |
| equity | 31.695.270 | Triệu VND | 31695270 | million_vnd | preview | 108 | Báo cáo tình hình tài chính hợp nhất | "Vốn chủ sở hữu của cổ đông Công ty: 31.695.270 Triệu VND" | Explicitly defined. |
| revenue | 54.248.830 | Triệu VND | 54248830 | million_vnd | preview | 109 | Báo cáo kết quả hoạt động kinh doanh và thu nhập toàn diện khác hợp nhất | "Doanh thu: 54.248.830 Triệu VND" | Net revenue used. |
| netIncome | 8.505.216 | Triệu VND | 8505216 | million_vnd | preview | 109 | Báo cáo kết quả hoạt động kinh doanh và thu nhập toàn diện khác hợp nhất | "Lợi nhuận thuần: 8.505.216 Triệu VND" | Explicitly defined. |

## totalDebt Derivation Detail
- **short-term borrowings value/unit/page:** 9.393.737 Triệu VND (Page 108)
- **long-term borrowings value/unit/page:** 62.908 Triệu VND (Page 108)
- **calculation:** 9.393.737 + 62.908 = 9.456.645 Triệu VND
- **normalized totalDebt:** 9456.645 billion_vnd (divide Triệu VND by 1,000)
- **status:** derived_preview

## Comparison with current runtime phase109 values
- **EPS:** PDF shows `4070`. Runtime currently holds `4130`. (PDF is reliable).
- **sharesOutstanding:** PDF shows `2089955445`. Runtime holds `2089955445`. (Matches exactly).
- **totalDebt:** PDF derivation yields `9456.645`. Runtime currently holds `10059.066`. (PDF is reliable explicit derivation).

## Collision/Source-Priority Recommendation
The script successfully detected the existing `phase109_controlled_local_financials` row for VNM.
**Recommendation:** A future import should either create a parallel row with `annual_report_2025_pdf_reviewed_preview` as the source and adjust the runtime priority to prefer it, OR explicitly override the phase109 row. Given the precision of the PDF review, preferring `annual_report_2025_pdf_reviewed_preview` over `phase109_controlled_local_financials` is strongly recommended for safety and accuracy.

## Fields left null and why
No primary or secondary target fields were left null for VNM. All fields (`eps`, `sharesOutstanding`, `totalDebt`, `totalAssets`, `equity`, `revenue`, `netIncome`) were explicitly located with clear provenance.

## Confirmations
- **No DB write / import / confirm-write:** Confirmed.
- **No schema / migration:** Confirmed.
- **No PDF binary commit:** Confirmed.
- **No productionApproved=true:** Confirmed.
- **No totalLiabilities-as-totalDebt:** Confirmed.
- **No missing-to-zero:** Confirmed.
- **No fake values:** Confirmed.
- **No runtime priority change:** Confirmed.

## Next Recommended Phase
Phase 139G - VNM PDF reviewed-preview controlled import.
