# Phase 161A - Risk Transparency Local PDF Review For HPG/VNM/MWG

## Objective
Lock the Risk/Transparency disclosure inputs for HPG, VNM, and MWG against local 2025 annual-report PDFs, without using web sources, 2024 reports, inferred values, or production-approved claims.

## Source Files Checked

| Ticker | Local PDF source | In repo |
| --- | --- | --- |
| HPG | `D:/AtelierFinanceFinancialsReview/annual-reports/HPG_annual_report_2025.pdf` | No |
| VNM | `D:/AtelierFinanceFinancialsReview/annual-reports/VNM_annual_report_2025.pdf` | No |
| MWG | `D:/AtelierFinanceFinancialsReview/annual-reports/MWG_annual_report_2025.pdf` | No |

`rg --files -g "*.pdf" -g "*.PDF"` returned no PDF binaries inside `D:/Codex/atelier-finance`.

## Extraction Method

- Used local PDF binaries outside the repo.
- Used bundled Python PDF extraction with `pypdf` and `pdfplumber`.
- Used Poppler rendering for HPG audit pages because the audit section after the annual-report divider is image-like and has limited text extraction.
- Kept `productionApproved: false` and `needsReview: true`.

## Disclosure Review Results

| Ticker | Auditor | Audit opinion | Report date | Related-party notes | Runtime status |
| --- | --- | --- | --- | --- | --- |
| HPG | Công ty TNHH Kiểm toán Deloitte Việt Nam | Chấp nhận toàn phần | 2026-03-24 | `null` | `needs_review` |
| VNM | Chi nhánh Công ty TNHH KPMG Việt Nam | `null` | 2026-02-27 | `null` | `needs_review` |
| MWG | Công ty TNHH Ernst & Young Việt Nam | Chấp nhận toàn phần | 2026-03-23 | `null` | `needs_review` |

## Page-Level Evidence

### HPG

- PDF page 89: Deloitte cover page for consolidated audited financial statements for the year ended 31 December 2025.
- PDF page 93: Independent auditor report addressed to shareholders, Board of Directors, and General Director of HPG.
- PDF page 94: Auditor opinion states the consolidated financial statements present fairly, in all material respects; report signed by Deloitte Vietnam on 24 March 2026.
- Related-party notes: not filled. Keyword extraction did not locate a clear financial-statement related-party transaction note that is safe to summarize into the Risk module.

### VNM

- PDF page 106: Company information identifies the auditor as Chi nhánh Công ty TNHH KPMG Việt Nam.
- PDF page 106: Management report date is 27 February 2026.
- PDF page 107: Annual report says the independent auditor report is excerpted from the audited consolidated financial statements and that the full audited separate and consolidated financial statements were published on the company website on 27 February 2026.
- Audit opinion: not filled. The annual-report PDF section available in this local source does not expose a full auditor-opinion paragraph suitable for the Risk module.
- Related-party notes: not filled. The annual-report PDF exposes stakeholder/major-shareholder content, but not a clear audited financial-statement related-party transaction note suitable for this field.

### MWG

- PDF page 73: Financial statement section identifies Công ty TNHH Ernst & Young Việt Nam as auditor.
- PDF page 76: Independent auditor report for consolidated financial statements for the year ended 31 December 2025.
- PDF page 77: Auditor opinion states the consolidated financial statements present fairly, in all material respects; report date is 23 March 2026.
- Related-party notes: not filled. The annual report contains broad stakeholder and internal-structure references, but no audited related-party transaction note was extracted with enough specificity for this field.

## Guardrails

- No DB write.
- No schema migration.
- No PDF binary commit.
- No web source fallback.
- No 2024 source fallback.
- No production approval claim.
- No risk score.
- No recommendation language.
- Missing related-party and VNM-opinion fields remain `null` instead of being inferred.

## Validation

- `npm test -- --run src/features/risk/lib/__tests__/load-risk-disclosure-review.test.ts src/features/risk/lib/__tests__/build-risk-desk-data.test.ts src/features/risk/components/__tests__/RiskPage.runtime-ui.test.ts`
- `npm run typecheck`

## Next Recommended Step

Surface page-level evidence in the Risk UI so the user can see which disclosure fields are backed by local 2025 PDFs and which fields remain intentionally unfilled.
