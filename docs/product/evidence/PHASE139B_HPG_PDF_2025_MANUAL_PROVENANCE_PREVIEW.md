# Phase 139B — HPG PDF 2025 manual provenance preview

## Objective
Manually inspect the `HPG_Annual_Report_2025.pdf` and produce a preview-only extraction with page/section/table provenance for selected 2025 HPG financial fields. This phase explicitly maps HPG data, leaving all other tickers as `null`/`needs_review`.

## Scope boundaries
- **Allowed**: Local PDF inspection via tool execution, manual provenance mapping for HPG, extending the Phase 139A preview framework.
- **Forbidden**: Processing FPT/MWG/VNM/VCB/MSN (except default fallback logic), DB writes, data imports, schema modifications, database migrations, marking items `productionApproved=true`, or committing the large PDF binary.

## Why HPG only
This phase isolates HPG to establish a high-confidence manual mapping process with exact page provenance from the annual report, demonstrating a safe, controlled extraction framework for a single complex ticker before generalizing.

## Referenced Phase 139A Commit
`44fa4cebd0893889d4bcc5a03b5b1df243172a59`

## PDF inspected
`docs/product/evidence/source-pdfs/HPG_Annual_Report_2025.pdf`

**PDF Binary Committed:** No. The PDF remains local-only.

## Extraction method used
The PDF was directly inspected using the sandbox `view_file` tool to OCR and extract precise values and page numbers. A structured manual provenance map was then explicitly coded into `scripts/preview-annual-report-2025-financials.ts` for HPG, overriding the default `null` fallback.

## Commands run
- `npx tsx scripts/preview-annual-report-2025-financials.ts`
- Vitest suite running `src/lib/data-sources/__tests__/pdf-extraction-preview.test.ts`

## HPG Extraction Table

| Field | Value | Unit | Status | Page | Section/Table | Evidence Note | Caveat |
|-------|-------|------|--------|------|---------------|---------------|--------|
| eps | 1,973 | vnd_per_share | preview | 98, 139 | Báo cáo kết quả hoạt động kinh doanh hợp nhất & Thuyết minh 38 | "Lãi cơ bản trên cổ phiếu (VND/cổ phiếu): 1.973" | Matches VNStock candidate (1973). |
| sharesOutstanding | 7,675,465,855 | shares | preview | 139 | Thuyết minh 38 | "Số bình quân gia quyền của cổ phiếu phổ thông đang lưu hành (cổ phiếu): 7.675.465.855" | Matches VNStock candidate (7,675,465,855). |
| totalDebt | 92,174,151,302,217 | VND | derived_preview | 97 | Bảng cân đối kế toán hợp nhất - Nguồn vốn | Ngắn hạn: 64,694,957... + Dài hạn: 27,479,194... | Derived safely from explicit short and long-term borrowings. VNStock candidate was null. |
| totalAssets | 257,899,200,817,547 | VND | preview | 96 | Bảng cân đối kế toán hợp nhất - Tài sản | "TỔNG CỘNG TÀI SẢN: 257.899.200.817.547" | Explicitly defined. |
| equity | 131,220,010,876,575 | VND | preview | 97 | Bảng cân đối kế toán hợp nhất - Nguồn vốn | "VỐN CHỦ SỞ HỮU: 131.220.010.876.575" | Explicitly defined. |
| revenue | 156,116,094,618,482 | VND | preview | 98 | Báo cáo kết quả hoạt động kinh doanh hợp nhất | "Doanh thu thuần về bán hàng và cung cấp dịch vụ: 156.116.094.618.482" | Net revenue used. |
| netIncome | 15,514,931,571,606 | VND | preview | 98 | Báo cáo kết quả hoạt động kinh doanh hợp nhất | "Lợi nhuận sau thuế thu nhập doanh nghiệp: 15.514.931.571.606" | Explicitly defined. |

## totalDebt Derivation Detail
- **Short-term borrowings**: Vay và nợ thuê tài chính ngắn hạn (Trang 97) - 64,694,957,245,143 VND
- **Long-term borrowings**: Vay và nợ thuê tài chính dài hạn (Trang 97) - 27,479,194,057,074 VND
- **Calculation**: 64,694,957,245,143 + 27,479,194,057,074
- **Final totalDebt**: 92,174,151,302,217 VND
- **Status**: `derived_preview`

## VNStock Candidate Comparison
- `eps`: 1973 (Matches exactly with VNStock candidate from Phase 138F/G).
- `sharesOutstanding`: 7,675,465,855 (Matches exactly with VNStock candidate).
- `totalDebt`: 92,174,151,302,217 (VNStock candidate was `null`).
*(This is a non-authoritative consistency observation only. No DB overwriting occurred).*

## Fields left null and why
All fields for FPT, MWG, VNM, VCB, MSN remain `null` and `needs_review` because this phase strictly targeted HPG.

## Confirmation Checklist
- [x] No DB write/import/confirm-write.
- [x] No schema/migration execution.
- [x] No PDF binary commit.
- [x] No `productionApproved=true`.
- [x] No totalLiabilities-as-totalDebt.
- [x] No missing-to-zero.
- [x] No fake values or hallucinatory extraction.

## Validation Results
*Validation results will be populated via CI after this document is generated.*

## Next Recommended Phase
Phase 139C - Controlled Import Workflow implementation for locally reviewed HPG PDF mapping payload.
