# Phase 139I: FPT PDF 2025 Manual Provenance and Dry-Run Preview

## Objective
Manually inspect `FPT_Annual_Report_2025.pdf` and produce an FPT-only PDF 2025 preview + dry-run import candidate. The goal is to safely extract primary financial fields (EPS, sharesOutstanding, totalDebt) while enforcing strict units and missing data rules, without writing to the database.

## Scope Boundaries
- **Target ticker:** FPT only.
- **Other tickers:** MWG, VNM, HPG, VCB, MSN are excluded from modifications.
- **Forbidden actions:** No DB writes, no imports, no confirm-write, no schema changes, no migrations. No PDF binary commits. No `productionApproved=true`. No totalLiabilities mapped to totalDebt. No missing data converted to zero.
- **Why FPT next:** FPT follows HPG and VNM, and comes after the MWG source-quality stop (MWG PDF was a sustainability report). This ensures highly controlled inputs from correct financial reports.

## Referenced Commits
- 139D (HPG Import): `b1d342dc5ad7328ec53fe74994e0fe34742027b8`
- 139E (HPG Smoke): `55fffaeaa149b56f8f533df01cf56b8da07593da`
- 139F (VNM Dry Run): `2371b8296a24eb8da3e068f810141f2dd3d2ddc5`
- 139G (VNM Import): `ff63962e7836e5200fcb4d24608f1b62372f883f`
- 139H (MWG Dry Run - Negative finding): `31a5b24ea77f4ba4019a31a9829cd7bc28c00940`

## PDF Inspected
- `docs/product/evidence/source-pdfs/FPT_Annual_Report_2025.pdf`
- **Note:** MWG current PDF is confirmed by the user to be a sustainability report and should not be imported. FPT's PDF is the correct Annual Report.
- **PDF binary committed:** No.
- **MWG temp parser files cleaned:** Yes, deleted prior to this phase.

## Extraction Method Used
- Local environment PDF inspection via `view_file` to review text contents and tables.

## Commands Run
- `npx tsx scripts/preview-annual-report-2025-financials.ts`
- `npx tsx scripts/dry-run-fpt-pdf-reviewed-import.ts`

## FPT Extraction Table

| Field | Source Value | Source Unit | Normalized Value | Normalized Unit | Status | Page | Section/Table | Evidence Note | Caveat |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| eps | 5.216 | VNĐ/cổ phiếu | 5216 | vnd_per_share | preview | 169 | Báo cáo kết quả hoạt động kinh doanh hợp nhất | Lãi cơ bản trên cổ phiếu: 5.216 | Explicitly defined. |
| sharesOutstanding | 1.703.507.121 | cổ phiếu | 1703507121 | shares | preview | 204 | Thuyết minh 23(a) Số lượng cổ phiếu | Số lượng cổ phiếu đang lưu hành: 1.703.507.121 | Explicitly defined. |
| totalDebt | 21.073.487.486.139 | VNĐ | 21073.487486139 | billion_vnd | derived_preview | 167 | Bảng cân đối kế toán hợp nhất - Nguồn vốn | Vay và nợ thuê tài chính ngắn hạn: 19.169.697.497.955 + Vay và nợ thuê tài chính dài hạn: 1.903.789.988.184 | Derived safely from explicit short and long-term borrowings. |
| revenue | 70.112.825.100.710 | VNĐ | 70112.82510071 | billion_vnd | preview | 169 | Báo cáo kết quả hoạt động kinh doanh hợp nhất | Doanh thu thuần về bán hàng và cung cấp dịch vụ: 70.112.825.100.710 | Net revenue used. |
| netIncome | 11.232.339.450.734 | VNĐ | 11232.339450734 | billion_vnd | preview | 169 | Báo cáo kết quả hoạt động kinh doanh hợp nhất | Lợi nhuận sau thuế TNDN: 11.232.339.450.734 | Explicitly defined. |
| totalAssets | 88.141.991.634.625 | VNĐ | 88141.991634625 | billion_vnd | preview | 166 | Bảng cân đối kế toán hợp nhất - Tài sản | TỔNG TÀI SẢN: 88.141.991.634.625 | Explicitly defined. |
| equity | 43.748.040.747.539 | VNĐ | 43748.040747539 | billion_vnd | preview | 168 | Bảng cân đối kế toán hợp nhất - Nguồn vốn | VỐN CHỦ SỞ HỮU: 43.748.040.747.539 | Explicitly defined. |

## totalDebt Derivation Detail
- **Short-term borrowings:** 19.169.697.497.955 (VNĐ) - Page 167
- **Long-term borrowings:** 1.903.789.988.184 (VNĐ) - Page 167
- **Calculation:** 19.169.697.497.955 + 1.903.789.988.184 = 21.073.487.486.139 (VNĐ)
- **Normalized totalDebt:** 21073.487486139 (billion_vnd)
- **Status:** derived_preview

## Comparison with Current Runtime phase109 Values
- **EPS:**
  - `phase109`: 4944
  - `pdf_preview`: 5216
  - **Difference:** The PDF source (5216) differs from the existing candidate (4944). The PDF represents audited 2025 EPS.
- **sharesOutstanding:**
  - `phase109`: 1471069183
  - `pdf_preview`: 1703507121
  - **Difference:** Significant change due to share issuance/dividends over the year.
- **totalDebt:**
  - `phase109`: 14947.354 (billion_vnd)
  - `pdf_preview`: 21073.487 (billion_vnd)
  - **Difference:** A significant increase in total debt as per the audited 2025 statements.

## Collision/Source-Priority Recommendation
Currently, FPT resolves to `phase109_controlled_local_financials`. Since the new `annual_report_2025_pdf_reviewed_preview` values for FPT are extracted successfully and differ from the existing `phase109` data:
- **Recommendation:** Do not skip import. In a future Phase, we should perform a controlled import to create a new `annual_report_2025_pdf_reviewed_preview` row for FPT, and update the runtime priority to use this reviewed PDF source.

## Fields Left Null and Why
- None of the primary or secondary fields were left null. FPT's Annual Report contains all necessary financial data.

## Confirmations
- **Confirmation no DB write/import/confirm-write:** Confirmed.
- **Confirmation no schema/migration:** Confirmed.
- **Confirmation no PDF binary commit:** Confirmed.
- **Confirmation no productionApproved=true:** Confirmed.
- **Confirmation no totalLiabilities-as-totalDebt:** Confirmed.
- **Confirmation no missing-to-zero:** Confirmed.
- **Confirmation no fake values:** Confirmed.
- **Confirmation no runtime priority change:** Confirmed.

## Next Recommended Phase
Phase 139J - FPT PDF reviewed-preview controlled import and post-import smoke.
