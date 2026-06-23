# Phase 139J: FPT PDF Reviewed-Preview Controlled Import

## Objective
Perform a controlled local DB import for FPT PDF reviewed-preview financial values that were manually extracted and validated in Phase 139I. Verify post-import product/read-path behavior and update source priority for FPT.

## Scope Boundaries
- **Target ticker:** FPT only.
- **Other tickers:** MWG, VNM, HPG, VCB, MSN are excluded from modifications.
- **Forbidden actions:** No schema changes, no migrations. No PDF binary commits. No `productionApproved=true`. No totalLiabilities mapped to totalDebt. No missing data converted to zero.
- **Secondary fields:** Secondary fields (revenue, netIncome, totalAssets, equity) from Phase 139I were deliberately NOT imported in this phase to strictly narrow the write scope to the primary inputs.

## Referenced Commits
- 139I (FPT Dry Run): `e4ec13e11d044f56f2fce5ba7bfec1f2fbbce693`

## Commands Run
- `npx tsx scripts/import-fpt-pdf-reviewed-preview.ts` (Dry-run mode)
- `npx tsx scripts/import-fpt-pdf-reviewed-preview.ts --confirm-write` (Write mode)
- `npx tsx scripts/import-fpt-pdf-reviewed-preview.ts --confirm-write` (Duplicate check)

## Dry-run Summary
- **Target Ticker:** FPT
- **Source Label:** `annual_report_2025_pdf_reviewed_preview`
- **Data Mode:** `research_only`
- **Production Approved:** `false`
- **EPS:** 5216 (`vnd_per_share`)
- **Shares Outstanding:** 1703507121 (`shares`)
- **Total Debt:** 21073.487486139 (`billion_vnd`)
- **Status:** Safe to insert. No existing candidate row found.

## Confirm-write Summary
- **Status:** `write_completed`
- **Written rows:** 1
- **Skipped rows:** 0
- **Invalid rows:** 0

## Duplicate Re-run Summary
- **Status:** `write_completed_with_skips`
- **Written rows:** 0
- **Skipped rows:** 1
- **Invalid rows:** 0

## totalDebt Conversion Summary
- **Original Source Value:** 21,073,487,486,139 VND (short-term + long-term borrowings)
- **Conversion Formula:** Divide by 1,000,000,000
- **Normalized Value:** 21073.487486139 billion_vnd
- **Raw VND stored in billion_vnd field:** No.

## Runtime Verification
- **FPT resolved source:** `annual_report_2025_pdf_reviewed_preview`
- **EPS:** 5216
- **Shares Outstanding:** 1703507121
- **Total Debt:** 21073.487486139
- **Production Approved:** false

## Product Smoke Summary
- **Risk:** Supplies `totalDebt` to the Risk module without marking it missing, using the derived value.
- **Valuation:** Keeps the Valuation source boundary unapproved, ensuring no fair value or target price is generated.
- **Checklist:** No longer treats `totalDebt` as missing.
- **AI Context:** Safely populates AI Assistant Context with the new values, explicitly marking them as not production-approved, and contains guardrails against generating investment recommendations.

## Source Priority Check
- **FPT:** Priority updated to prefer `annual_report_2025_pdf_reviewed_preview`.
- **HPG:** Priority unchanged (`annual_report_2025_pdf_reviewed_preview`).
- **VNM:** Priority unchanged (`annual_report_2025_pdf_reviewed_preview`).
- **MWG:** Priority unchanged (`phase109_controlled_local_financials`), correctly bypassing the MWG sustainability report.
- **Existing phase109 row preserved:** Confirmed. The phase 109 row for FPT remains in the database.

## Confirmations
- **Confirmation secondary fields were not imported:** Confirmed.
- **Confirmation no schema/migration/PDF binary commit:** Confirmed.
- **Confirmation no totalLiabilities-as-totalDebt:** Confirmed.
- **Confirmation no missing-to-zero:** Confirmed.
- **Confirmation no productionApproved=true:** Confirmed.
- **Confirmation no investment recommendation language:** Confirmed.

## Next Recommended Phase
Phase 139K - VCB PDF 2025 manual provenance and dry-run preview.
