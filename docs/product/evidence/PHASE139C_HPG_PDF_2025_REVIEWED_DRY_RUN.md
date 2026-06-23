# Phase 139C: HPG PDF reviewed preview-to-import dry-run only

## Overview
This phase executes a dry-run import process taking the PDF 2025 manual provenance extraction preview (Phase 139B) for HPG and mapping it to a prospective DB state. It implements unit conversions for legacy standard values, such as converting VND to `billion_vnd`.

## Important Rules Enforced
- **No Database Writes:** This script is strictly a dry-run map-and-evaluate process. No records are written to `FinancialStatement` or `FinancialStatementUnitMetadata`.
- **No Import Pipeline Mutation:** The production API and existing local import scripts are not impacted.
- **No Schema Changes:** The Prisma schema remains untouched. No migrations were generated.
- **No `productionApproved=true`:** The candidate rows all have `productionApproved=false` enforced.
- **No `totalLiabilities`-as-`totalDebt`:** Explicit tracking of `totalDebt` distinct from general liabilities.
- **No Missing-to-Zero Mutations:** Missing or null values remain null.

## Dry-run Artifact Output
The dry-run mapper reads from `PHASE139B_HPG_PDF_2025_PREVIEW.json` and normalizes units. A collision analysis checks the local DB state without mutating it:

```json
[
  {
    "ticker": "HPG",
    "fiscalYear": 2025,
    "periodType": "annual",
    "sourceLabel": "annual_report_2025_pdf_reviewed_preview",
    "dataMode": "research_only",
    "productionApproved": false,
    "status": "derived_preview_import_candidate",
    "eps": 1973,
    "epsUnit": "vnd_per_share",
    "sharesOutstanding": 7675465855,
    "sharesOutstandingUnit": "shares",
    "totalDebt": 92174.151302217,
    "totalDebtUnit": "billion_vnd",
    "collisionAnalysis": "Found existing vnstock_financials_candidate row. Proposed behavior: prefer PDF-backed preview over VNStock candidate. This dry-run does not alter read-path priority or write to DB."
  }
]
```

## Validation & Results
- **prisma validate:** Passed
- **typecheck:** Passed
- **lint:** Passed
- **npm test:** Passed. Total exit code 0. Tests 1103 passed.
- **build:** Passed
- **git status:** Clean branch state with new dry run script, test, and evidence file tracked.
