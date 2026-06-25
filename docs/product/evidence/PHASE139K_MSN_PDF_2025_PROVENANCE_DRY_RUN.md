# Phase 139K: MSN PDF 2025 Provenance, Dry-Run Normalization, and Import-Readiness Audit

## Objective

Inspect the local MSN 2025 annual-report PDF, verify that it belongs to Masan Group Corporation at consolidated group level, extract only clearly evidenced MSN financial values, normalize them to existing runtime conventions, and assess readiness for a later controlled import.

This phase is preview and dry-run only.

## Scope Boundaries

- Target ticker: MSN only.
- No database write, import, confirm-write, schema change, migration, runtime-priority change, or production approval.
- No overwrite or modification of the existing `vnstock_financials_candidate` MSN row.
- No mapping of total liabilities to total debt.
- No conversion of missing values to zero.
- No values from MCH, Masan Consumer, WinCommerce, Techcombank, or another subsidiary-only report.
- The local PDF binary remains untracked and must not be staged or committed.

## Why MSN Before VCB

MSN is a diversified non-bank group whose audited consolidated statements expose conventional corporate borrowing, bond, and finance-lease lines. VCB requires bank-specific liability and debt semantics and is intentionally deferred to a later phase.

## Referenced Commits

- Phase 139G: `ff63962e7836e5200fcb4d24608f1b62372f883f`
- Phase 139H: `31a5b24ea77f4ba4019a31a9829cd7bc28c00940`
- Phase 139I: `e4ec13e11d044f56f2fce5ba7bfec1f2fbbce693`
- Phase 139J: `17753d4abc1c0c6e8e815777a8069634e9e03d40`

## PDF Inspected

- `docs/product/evidence/source-pdfs/MSN_Baocaothuongnien_2025.pdf`
- PDF pages: 122 spreads/pages in the local file.
- PDF binary committed: No.

## Entity Identity Verification

Status: `valid_msn_consolidated`

| Check | Result | Provenance |
| :--- | :--- | :--- |
| Company/entity | Công ty Cổ phần Tập đoàn Masan | PDF page 62, report pages 126-127, independent auditor's report |
| Ticker | MSN | PDF page 106, report pages 214-215, company history; the company section states the HOSE stock code is MSN |
| Report title | Báo cáo Thường niên 2025 | Repeated report header and cover/section headers |
| Consolidated scope | Confirmed: Masan Group Corporation and its subsidiaries | PDF pages 61-65, report pages 124-133 |
| Auditor | KPMG Vietnam branch, report `25-01-01312-26-2` | PDF page 62, report pages 126-127 |
| Audit opinion | Consolidated statements are fairly presented in all material respects | PDF page 62, report pages 126-127 |
| MCH/subsidiary-only ruled out | Yes | The auditor and statement headers name Masan Group Corporation and its subsidiaries; MCH and other businesses appear as group components, not as the reporting entity |

The file is therefore suitable for MSN group-level preview extraction. It is not the MCH-only, WinCommerce-only, Techcombank-only, or another subsidiary-only report.

## Extraction Method Used

- Programmatic text inspection with local `pypdf` and `pdfplumber`.
- Visual rendering of selected pages with local Poppler `pdftoppm`.
- Manual visual verification of entity scope, audit opinion, units, field labels, and digits.
- No repeated heavy OCR.
- Temporary rendered page images were kept under `tmp/pdfs/msn139k` during inspection and were not staged.

## Commands Run

- `git status --short`
- Local `pypdf` page-count and metadata inspection.
- Local `pdfplumber` term/page inspection.
- Local Poppler rendering for selected provenance pages.
- `npx tsx scripts/dry-run-msn-pdf-reviewed-import.ts`
- `npx vitest run src/lib/data-sources/__tests__/dry-run-msn-pdf-reviewed-import.test.ts`
- `npx prisma validate`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `git checkout -- tsconfig.tsbuildinfo`
- `git status --short`
- `git diff --stat`
- `git diff`

## MSN Extraction Table

| Field | Source value | Source unit | Normalized value | Normalized unit | Status | PDF page | Report pages | Section/table | Evidence note | Caveat |
| :--- | ---: | :--- | ---: | :--- | :--- | ---: | :--- | :--- | :--- | :--- |
| eps | 2,710 | VND/share | 2,710 | `vnd_per_share` | `preview` | 102 | 206-207 | Note 36(c), Basic earnings per share | Audited EPS table explicitly reports 2,710 for 2025 | None |
| sharesOutstanding | 1,520,491,927 | shares | 1,520,491,927 | `shares` | `preview` | 97 | 196-197 | Note 23, Share capital and share premium | Audited table explicitly labels total shares outstanding | Includes 1,445,915,457 ordinary shares and 74,576,470 dividend-preference shares; the EPS weighted-average ordinary-share denominator is separately 1,516,140,129 |
| totalDebt | 64,877,178 | million VND | 64,877.178 | `billion_vnd` | `derived_preview` | 64 | 130-131 | Consolidated balance sheet - liabilities/equity | Sum of explicit current and non-current borrowing/bond/finance-lease lines | Current maturities are already included in the current line and must not be added again |
| totalAssets | 128,963,171 | million VND | 128,963.171 | `billion_vnd` | `preview` | 63 | 128-129 | Consolidated balance sheet - assets | Explicit audited total-assets line | Secondary field only |
| equity | 45,078,644 | million VND | 45,078.644 | `billion_vnd` | `preview` | 64 | 130-131 | Consolidated balance sheet - liabilities/equity | Explicit audited total-equity line | Secondary field only |
| revenue | 81,621,329 | million VND | 81,621.329 | `billion_vnd` | `preview` | 65 | 132-133 | Consolidated income statement | Explicit audited net-revenue line | Secondary field only |
| netIncome | 6,763,511 | million VND | 6,763.511 | `billion_vnd` | `preview` | 65 | 132-133 | Consolidated income statement | Explicit audited consolidated profit-after-tax line | This is group profit after tax, not profit attributable only to owners of the Company |

## Total-Debt Derivation Detail

The balance sheet presents two explicit interest-bearing debt lines in the same unit:

| Component | Value | Unit | PDF page | Report pages | Inclusion |
| :--- | ---: | :--- | ---: | :--- | :--- |
| Vay, trái phiếu phát hành và nợ thuê tài chính ngắn hạn | 24,330,984 | million VND | 64 | 130-131 | Included once |
| Vay, trái phiếu phát hành và nợ thuê tài chính dài hạn | 40,546,194 | million VND | 64 | 130-131 | Included once |

Calculation:

`24,330,984 + 40,546,194 = 64,877,178 million VND`

Normalization:

`64,877,178 / 1,000 = 64,877.178 billion VND`

Status: `derived_preview`

Double-counting control:

- The current line already includes short-term borrowings and the portion of long-term borrowings, bonds, and finance leases due within 12 months.
- The non-current line is the remaining amount due after 12 months.
- Note 20's gross long-term borrowings, bonds, finance leases, and current-maturity subtotals are supporting detail and are not added again.
- Total liabilities of 83,884,527 million VND is not used as total debt.
- The management discussion independently rounds consolidated borrowings to 64,877 billion VND at 31 December 2025, which corroborates but does not replace the audited-line derivation.

## Dry-Run Import Candidate

```json
{
  "ticker": "MSN",
  "fiscalYear": 2025,
  "periodType": "annual",
  "sourceLabel": "annual_report_2025_pdf_reviewed_preview",
  "dataMode": "research_only",
  "productionApproved": false,
  "status": "dry_run_import_candidate",
  "eps": 2710,
  "epsUnit": "vnd_per_share",
  "sharesOutstanding": 1520491927,
  "sharesOutstandingUnit": "shares",
  "totalDebt": 64877.178,
  "totalDebtUnit": "billion_vnd"
}
```

This is output only. It was not inserted, upserted, imported, or confirmed for writing.

## Comparison With Current MSN Runtime Candidate

Current runtime source: `vnstock_financials_candidate`

| Field | Current runtime | PDF dry-run | Difference |
| :--- | ---: | ---: | :--- |
| EPS | 2,710 | 2,710 | Match |
| sharesOutstanding | 1,520,491,927 | 1,520,491,927 | Match |
| totalDebt | null | 64,877.178 billion VND | PDF adds an explicitly evidenced debt value; null was not converted to zero |

## Collision and Source-Priority Recommendation

A later controlled import should create a new parallel MSN row with source label `annual_report_2025_pdf_reviewed_preview`.

It should not overwrite or modify the existing `vnstock_financials_candidate` row. Phase 139K does not change runtime priority. Any resolver-priority change must be a separate explicit phase after controlled import and smoke validation.

## Import-Readiness Decision

Decision: `ready_for_future_controlled_import`

Reason:

- Entity identity is confirmed as MSN / Masan Group Corporation.
- Consolidated group-level scope is explicit.
- KPMG audited the consolidated 2025 financial statements.
- EPS, outstanding shares, and both debt components have verified pages, labels, units, and visual evidence.
- Debt normalization and double-counting controls are explicit and tested.

This decision authorizes no write in Phase 139K. It only records that the values are suitable for consideration in a later explicit controlled-import phase.

## Fields Left Null

None of the allowed primary or secondary fields were left null. No field outside the requested scope was extracted.

## Confirmations

- No DB write/import/confirm-write: Confirmed.
- No schema change or migration: Confirmed.
- PDF binary committed: No.
- No `productionApproved=true`: Confirmed.
- No total-liabilities-as-total-debt mapping: Confirmed.
- No missing-to-zero conversion: Confirmed.
- No fake values or page numbers: Confirmed.
- No runtime-priority change: Confirmed.
- No non-MSN entity values used: Confirmed.
- Existing MSN `vnstock_financials_candidate` row overwritten or modified: No.

## Validation Results

- Targeted Phase 139K test: 1 file, 16 tests passed.
- `npx prisma validate`: Passed, exit code 0.
- `npm run typecheck`: Passed, exit code 0.
- `npm run lint`: Passed, exit code 0.
- `npm test`: Passed on the first full run, exit code 0; 137 test files and 1,149 tests passed.
- `npm run build`: Passed, exit code 0.

## Final Git Status

The Phase 139K files are intended to be committed separately. Existing unrelated local changes and assets remain untouched:

- Modified: `docs/thesis/use-case-design-final.md`
- Modified: `docs/thesis/use-case-diagram.puml`
- Modified: `src/app/layout.tsx`
- Untracked: `diagrams/`
- Untracked: `docs/product/evidence/source-pdfs/`
- Untracked thesis diagrams and database/ERD assets under `docs/thesis/`

`tsconfig.tsbuildinfo` was restored before staging. The MSN PDF binary remains inside the untracked `source-pdfs/` directory and is not part of the Phase 139K commit.

## Next Recommended Phase

If explicitly authorized, perform an MSN-only controlled import that creates a parallel `annual_report_2025_pdf_reviewed_preview` row with `dataMode=research_only` and `productionApproved=false`, followed by post-import smoke tests. Runtime priority should remain a separately reviewed decision.
