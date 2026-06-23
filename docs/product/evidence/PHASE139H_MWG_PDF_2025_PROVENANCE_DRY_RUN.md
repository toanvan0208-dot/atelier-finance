# Phase 139H: MWG PDF 2025 Manual Provenance and Dry-Run Preview

## Objective
Manually inspect `MWG_Baocaothuongnien_2025.pdf` and produce a MWG-only PDF 2025 preview + dry-run import candidate. The goal is to safely extract primary financial fields (EPS, sharesOutstanding, totalDebt) while enforcing strict units and missing data rules, and without writing to the database.

## Scope Boundaries
- **Target ticker:** MWG only.
- **Other tickers:** FPT, VNM, HPG, VCB, MSN are excluded from modifications.
- **Forbidden actions:** No DB writes, no imports, no confirm-write, no schema changes, no migrations. No PDF binary commits. No `productionApproved=true`. No totalLiabilities mapped to totalDebt. No missing data converted to zero.
- **Why MWG next:** MWG follows HPG and VNM as part of the phase-by-phase manual provenance extraction for the VN30 top tickers, ensuring highly controlled inputs.

## Referenced Commits
- 139D (HPG Import): `b1d342dc5ad7328ec53fe74994e0fe34742027b8`
- 139E (HPG Smoke): `55fffaeaa149b56f8f533df01cf56b8da07593da`
- 139F (VNM Dry Run): `2371b8296a24eb8da3e068f810141f2dd3d2ddc5`
- 139G (VNM Import): `ff63962e7836e5200fcb4d24608f1b62372f883f`

## PDF Inspected
- `docs/product/evidence/source-pdfs/MWG_Baocaothuongnien_2025.pdf`
- **PDF binary committed:** No.

## Extraction Method Used
- Local environment PDF inspection via `view_file` to review text contents of the PDF (which is a Sustainability Report, not a full set of Financial Statements).

## Commands Run
- `npx tsx scripts/preview-annual-report-2025-financials.ts`
- `npx tsx scripts/dry-run-mwg-pdf-reviewed-import.ts`

## MWG Extraction Table

| Field | Source Value | Source Unit | Normalized Value | Normalized Unit | Status | Page | Section/Table | Evidence Note | Caveat |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| eps | null | null | null | null | missing | Unknown | null | null | EPS is not explicitly listed in the sustainability report. |
| sharesOutstanding | 1.468.456.763 | shares | 1468456763 | shares | preview | 68 | Thông tin liên hệ | Số lượng cổ phiếu đang lưu hành: 1.468.456.763 (Tính đến 31/12/2025) | Explicitly defined. |
| totalDebt | null | null | null | null | missing | Unknown | null | null | Total debt (short/long-term borrowings) is not available in the sustainability report. |

## totalDebt Derivation Detail
N/A (Missing). `totalLiabilities` is not available and would not be used.

## Comparison with Current Runtime phase109 Values
- **EPS:**
  - `phase109`: 2546
  - `pdf_preview`: null (missing)
- **sharesOutstanding:**
  - `phase109`: 1454644497
  - `pdf_preview`: 1468456763
  - **Difference:** The PDF source (1,468,456,763) differs from the existing candidate (1,454,644,497). The PDF is a higher-confidence source for outstanding shares as of 31/12/2025.
- **totalDebt:**
  - `phase109`: 27300.247
  - `pdf_preview`: null (missing)

## Collision/Source-Priority Recommendation
Currently, MWG resolves to `phase109_controlled_local_financials`. Since the new `annual_report_2025_pdf_reviewed_preview` is missing critical fields (EPS and totalDebt) but has a newer, explicit `sharesOutstanding` value:
- **Recommendation:** Do not skip import. In a future Phase, we should create a parallel `annual_report_2025_pdf_reviewed_preview` row to capture the high-confidence `sharesOutstanding`. However, because EPS and totalDebt are missing, the runtime resolver should intelligently fall back to the `phase109` source for those missing values, or we may retain `phase109` as the primary source while testing partial overrides.

## Fields Left Null and Why
- `eps`: The sustainability report does not include basic earnings per share.
- `totalDebt`: The sustainability report does not provide detailed balance sheet line items for short-term and long-term borrowings.

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
Phase 139I - TBD (Likely reviewing MSN or VCB, or implementing the controlled import for MWG with a partial override mechanism).
