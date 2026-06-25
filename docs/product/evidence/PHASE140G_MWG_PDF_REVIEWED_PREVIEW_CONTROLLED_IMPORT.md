# Phase 140G — MWG PDF Reviewed-Preview Controlled Import

## Objective
Execute a controlled, idempotent data import of the three primary financial fields extracted from MWG's audited 2025 Annual Report (Báo cáo thường niên 2025) verified in Phase 140F. 

The import enforces strict boundaries:
- `eps`: 4774 vnd_per_share
- `sharesOutstanding`: 1468456763 shares
- `totalDebt`: 29930.943 billion_vnd

## Execution Audit

1. **Idempotent Import Script**: The CLI command `scripts/import-mwg-pdf-reviewed-preview.ts` implemented strict dry-run by default, blocking writes unless explicitly passed `--confirm-write`.
2. **Safe Schema and Scope**: No Prisma schema changes were required. No migrations were generated.
3. **Data Quality Integrity**: Missing secondary fields were explicitly rejected to prevent zero-fills. `dataMode` was hardcoded to `research_only` and `productionApproved` was forced to `false`.
4. **Magnitude Safety**: The raw text extraction of `29.930.942.961.668 VND` for "Vay ngắn hạn" was successfully converted and stored as `29930.943 billion_vnd`. The validation layer safely rejected the raw magnitude.
5. **Post-Import Priority Switch**: Once imported, MWG's runtime seamlessly prioritized `annual_report_2025_pdf_reviewed_preview` over the existing `phase109_controlled_local_financials` row without requiring row deletion. The underlying phase109 data is preserved.

## Smoke Validation
The validation run via `scripts/smoke-mwg-pdf-reviewed-post-import.ts` confirmed that the newly imported fields propagated successfully to the module read paths:
- Financials statement snapshot correctly resolved to the new values.
- Risk module read `totalDebt: 29930.943` accurately without reporting it missing.
- Valuation boundary successfully restricted access since `productionApproved: false`.
- AI context correctly restricted to only explaining facts present, prohibiting unapproved values or inferred fields.

## File Exclusion
Binary PDFs and images generated during visual extraction were successfully blocked via `.gitignore` to prevent repository bloat. No source artifacts were committed.

## Conclusion
Phase 140G completes the read, extract, and controlled import pipeline for MWG 2025, matching the strict standards set by earlier entity reviews (FPT, HPG, VNM, MSN).
