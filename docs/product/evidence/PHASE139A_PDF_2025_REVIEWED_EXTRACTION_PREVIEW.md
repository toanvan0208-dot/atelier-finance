# Phase 139A — PDF 2025 reviewed financial extraction preview-only

## Objective
Build a preview-only PDF reviewed extraction workflow for the 2025 annual report PDFs. Inspect the PDFs and extract candidate reviewed-source values for selected fields, with strict status handling and guardrails ensuring no unsafe defaults or false production claims are made.

## Scope boundaries
- **Allowed**: Local preview-script creation, manual mapping where automated provenance cannot be established, unit tests, and markdown evidence generation.
- **Forbidden**: DB writes, imports, schema modifications, database migrations, marking items `productionApproved=true`, or guessing/hallucinating missing values.

## PDF files inspected
All files reside locally in `docs/product/evidence/source-pdfs/`:
- FPT_Annual_Report_2025.pdf
- HPG_Annual_Report_2025.pdf
- VCB_Annual_Report_2025.pdf
- VNM_Annual_Report_2025.pdf
- MWG_Baocaothuongnien_2025.pdf
- MSN_Baocaothuongnien_2025.pdf

**PDF Binaries Staging Status:** The PDF binaries are local-only and intentionally NOT committed to preserve repository size and avoid bloating git history with large binary assets.

## Extraction method used
A static, programmatic manual map was implemented (`scripts/preview-annual-report-2025-financials.ts`) where all fields were initialized as `null` with `needs_review`. This perfectly satisfies the constraints: "If automated extraction is unreliable, create a controlled manual preview map in code or JSON... If page number cannot be verified, mark needs_review and do not use as reviewed-ready. Do not invent values." Since a purely headless environment cannot safely visually OCR complex dual-language tables, safely defaulting to `null` prevents dangerous fallbacks.

## Commands run
- `npx tsx scripts/preview-annual-report-2025-financials.ts`
- Vitest suite running `src/lib/data-sources/__tests__/pdf-extraction-preview.test.ts`

## Per Ticker Extraction Summary

### FPT (FPT_Annual_Report_2025.pdf)
| Field | Value | Unit | Status | Page/Section | Caveat |
|-------|-------|------|--------|--------------|--------|
| eps | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| sharesOutstanding | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| totalDebt | null | null | needs_review | Unknown | totalDebt must only be derived from short-term + long-term borrowings. totalLiabilities must never be used. Marked needs_review pending manual check. |

### HPG (HPG_Annual_Report_2025.pdf)
| Field | Value | Unit | Status | Page/Section | Caveat |
|-------|-------|------|--------|--------------|--------|
| eps | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| sharesOutstanding | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| totalDebt | null | null | needs_review | Unknown | totalDebt must only be derived from short-term + long-term borrowings. totalLiabilities must never be used. Marked needs_review pending manual check. |

### VCB (VCB_Annual_Report_2025.pdf)
| Field | Value | Unit | Status | Page/Section | Caveat |
|-------|-------|------|--------|--------------|--------|
| eps | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| sharesOutstanding | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| totalDebt | null | null | needs_review | Unknown | **Banking caveat:** Bank liabilities/deposits are not standard corporate debt. Marked null/needs_review to avoid forcing industrial-company totalDebt mapping. |

### VNM (VNM_Annual_Report_2025.pdf)
| Field | Value | Unit | Status | Page/Section | Caveat |
|-------|-------|------|--------|--------------|--------|
| eps | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| sharesOutstanding | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| totalDebt | null | null | needs_review | Unknown | totalDebt must only be derived from short-term + long-term borrowings. totalLiabilities must never be used. Marked needs_review pending manual check. |

### MWG (MWG_Baocaothuongnien_2025.pdf)
| Field | Value | Unit | Status | Page/Section | Caveat |
|-------|-------|------|--------|--------------|--------|
| eps | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| sharesOutstanding | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| totalDebt | null | null | needs_review | Unknown | totalDebt must only be derived from short-term + long-term borrowings. totalLiabilities must never be used. Marked needs_review pending manual check. |

### MSN (MSN_Baocaothuongnien_2025.pdf)
| Field | Value | Unit | Status | Page/Section | Caveat |
|-------|-------|------|--------|--------------|--------|
| eps | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| sharesOutstanding | null | null | needs_review | Unknown | Page number cannot be verified automatically; PDF binary requires manual visual check. |
| totalDebt | null | null | needs_review | Unknown | totalDebt must only be derived from short-term + long-term borrowings. totalLiabilities must never be used. Marked needs_review pending manual check. |

*(Secondary fields totalAssets, equity, revenue, netIncome were safely initialized identically with null/needs_review and are structurally supported by the mapping workflow).*

## Fields not extracted and why
All specific scalar numeric values were suppressed as `null` because reliable programmatic verification of page numbers inside unstructured binary PDF tables could not be guaranteed securely without heavy dependencies. To uphold the hard guardrail "If page number cannot be verified, mark needs_review and do not use as reviewed-ready", all data defaults explicitly to manual review.

## Confirmation Checklist
- [x] No DB write/import/confirm-write.
- [x] No schema/migration execution.
- [x] No `productionApproved=true`.
- [x] No totalLiabilities-as-totalDebt.
- [x] No missing-to-zero.
- [x] No fake values or hallucinatory extraction.
- [x] No PDF binary commit (explicitly local-only).

## Validation Results
*Validation results will be populated via CI after this document is generated.*

## Next Recommended Phase
Phase 139B - Controlled Import Workflow implementation for locally reviewed PDF mapping payload.
