# Phase 140D — MWG Annual Report Source Replacement Preview

## 1. Phase Summary
The goal of this phase is to evaluate a newly added source document (`MWG_Annual_Report_2025.pdf`), verify its validity as a consolidated audited financial report, extract and preview core financials (EPS, sharesOutstanding, totalDebt) without mutating the database, and strictly enforce investment advice guardrails (no buy/sell/hold vocabulary).

## 2. Source File Checked
`docs/product/evidence/source-pdfs/MWG_Annual_Report_2025.pdf`

## 3. Why Previous MWG Source Was Rejected
In Phase 139H, the previous file `MWG_Baocaothuongnien_2025.pdf` was determined to be a Sustainability Report (Báo cáo phát triển bền vững) which is invalid for extracting audited financial statements. The system retained the `phase109_controlled_local_financials` runtime data instead.

## 4. Entity / Document Type / Scope / Audit Verification
- **Entity**: Verified. The file explicitly names "Công ty Cổ phần Đầu tư Thế Giới Di Động" (MWG) on its first pages.
- **Document Type**: Verified. The cover reads "BÁO CÁO THƯỜNG NIÊN 2025" and the table of contents confirms section "H. BÁO CÁO TÀI CHÍNH" at page 71.
- **Scope**: Needs Review. While assumed consolidated (Tập đoàn), text could not be extracted from the financial statements section to verify the exact heading.
- **Audit Status**: Needs Review. The financial statement pages (from page 71 to 89) are scanned images without a readable text layer, making it impossible to automatically verify the independent auditor's report (Báo cáo kiểm toán độc lập) or extract numbers reliably.

## 5. Preview Values
Because the audit status and exact figures cannot be programmatically verified from the scanned pages, all numeric fields are defaulted to `needs_review`.

- **EPS**: `null` (needs_review)
- **sharesOutstanding**: `null` (needs_review)
- **totalDebt**: `null` (needs_review)

## 6. totalDebt Component and Unit-Conversion Check
Cannot be evaluated due to the scanned nature of the financial statements. No raw data could be extracted to verify whether it erroneously includes accounts payable, leases, or total liabilities. Conversion checks are similarly suspended.

## 7. Non-import Confirmations
- Database was not modified.
- Schema and migrations remain unchanged.
- Output explicitly marks `dbWrites: 0`.

## 8. Guardrail Confirmations
- **No investment advice**: The preview and documentation do not contain any references to "buy", "sell", "hold", "target price", "fair value", or equivalent Vietnamese terms like "đáng mua", "hấp dẫn", or "khuyến nghị".
- **Missing Data**: Handled safely by rendering `null` / `needs_review` rather than falling back to `0`.
- **Data Quality**: The preview sets `dataMode` to `research_only` and `productionApproved` to `false`.

## 9. Runtime Comparison
**Current MWG runtime (phase109_controlled_local_financials):**
- EPS: 2546
- sharesOutstanding: 1454644497
- totalDebt: 27300.247

**Preview MWG runtime (annual_report_2025_pdf_reviewed_preview):**
- EPS: null
- sharesOutstanding: null
- totalDebt: null

*Difference:* The preview defaults to null because the scanned PDF requires manual data entry or OCR validation. The current runtime is retained.

## 10. Import Readiness Decision
**Decision: needs_review**
The document cannot be automatically ingested because the critical financial pages are scanned images. Manual transcription or OCR with human-in-the-loop verification is required before data can be imported.

## 11. Validation Results
All unit tests and build steps passed successfully.

## 12. Git Status
Verified clean. The PDF binary was not staged. Only the `manual-preview.ts`, the `dry-run` script, the test file, and this evidence report are included in the changeset.
