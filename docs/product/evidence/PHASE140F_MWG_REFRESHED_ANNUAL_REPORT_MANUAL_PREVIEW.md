# Phase 140F: MWG Refreshed Annual Report Manual Preview

## 1. Phase Summary
The user replaced the previously blank/scanned MWG Annual Report PDF with a properly formatted, text-searchable file. This phase verifies the new file, extracts key financial data, and performs a dry-run to determine its readiness for a future controlled import.

## 2. Source File Checked
- **File**: `docs/product/evidence/source-pdfs/MWG_Annual_Report_2025.pdf`
- **File Size**: 23,296,515 bytes
- **Page Count**: 89 pages

## 3. What Changed Compared with Phase 140E
- The file was replaced manually by the user.
- The new file has text-extractable layers rather than blank scanned images.

## 4. Blank-Page Issue Re-Check
- `previousBlankPdfIssueResolved`: **true**. We were able to extract the text successfully across the entire document.

## 5. Entity/Document Type/Audit/Scope Verification
- **Entity**: Verified as "Công ty Cổ phần Đầu tư Thế Giới Di Động" (MWG) (Page 4).
- **Document Type**: Verified as Báo cáo thường niên 2025 / Báo cáo tài chính (Page 72).
- **Audit Status**: **audited** (Ernst & Young, Page 77).
- **Consolidated Scope**: **consolidated_group_level** (Page 75).

## 6. EPS Provenance
- **Value**: 4774
- **Unit**: vnd_per_share
- **Provenance**: Page 85, Lãi cơ bản trên cổ phiếu, extracted via PyMuPDF.
- **Confidence**: high

## 7. Shares Provenance
- **Value**: 1,468,456,763
- **Unit**: shares
- **Provenance**: Page 40, "Số lượng cổ phiếu có quyền biểu quyết đang lưu hành" (ordinary_shares_outstanding), extracted via PyMuPDF.
- **Confidence**: high

## 8. totalDebt Components and Conversion
- **Components**:
  - Vay ngắn hạn: 29.930.942.961.668 VND (Page 81)
  - Vay dài hạn: 0 (No long-term debt reported on Balance Sheet)
- **Conversion**: 29.930.942.961.668 VND / 1,000,000,000 = 29930.943 billion_vnd
- **Final Value**: 29930.943 billion_vnd
- **Confidence**: high

## 9. Runtime Comparison with Current phase109 Values
- **Current EPS**: 2546 → **Preview EPS**: 4774 (The current runtime is holding last year's 2024 EPS).
- **Current sharesOutstanding**: 1454644497 → **Preview sharesOutstanding**: 1468456763 (Updated outstanding shares in 2025).
- **Current totalDebt**: 27300.247 → **Preview totalDebt**: 29930.943 (The current runtime is holding last year's Vay ngắn hạn 27.300.246.721.779 VND).
- **Current Source**: phase109_controlled_local_financials.
*Note: Runtime priority has NOT been changed in this phase.*

## 10. Import Readiness Decision
- **Status**: `ready_for_future_controlled_import`
- **Reason**: The audit scope is clear, and all three target fields have high-confidence provenance.

## 11. Non-import Confirmations
- **DB Writes**: 0 (no `create`, `update`, `upsert`, `delete` called).
- **Schema/Migrations**: 0 changes.
- No `confirm-write` mode was triggered.
- No changes to FPT/HPG/VNM/MSN/VCB.

## 12. Guardrail Confirmations
- Did not import secondary fields.
- Did not use totalLiabilities as totalDebt.
- Did not mark local/preview data as productionApproved.
- Maintained strictly neutral/dry financial reporting tone (no buy/sell/hold/target price signals).

## 13. Validation Results
- See logs for `npx prisma validate`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

## 14. Git Status
- Clean tree. Python extraction scripts removed. PDF files are not tracked.
