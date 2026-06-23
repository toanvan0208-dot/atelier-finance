# Phase 139G: VNM PDF Reviewed-Preview Controlled Import

## Objective
Perform a controlled local DB import for VNM PDF reviewed-preview financial values that were manually extracted and validated in Phase 139F. Verify post-import product/read-path behavior to ensure safe consumption of the new data.

## Scope Boundaries
- **Target ticker:** VNM only.
- **Other tickers:** FPT, MWG, HPG, VCB, MSN are excluded from modifications.
- **Forbidden actions:** No schema changes, no migrations, no PDF binary commits, no totalLiabilities-as-totalDebt mappings, no missing-to-zero conversions, no raw million VND stored into billion_vnd fields, no productionApproved claims, and no investment recommendation language.

## Referenced Commits
- **Phase 139F (VNM PDF Provenance Dry Run):** `2371b8296a24eb8da3e068f810141f2dd3d2ddc5`

## Source PDF Preview Values
- **ticker:** VNM
- **eps:** 4070 (vnd_per_share)
- **sharesOutstanding:** 2089955445 (shares)
- **totalDebt source value:** 9.456.645 (million_vnd / Triệu VND)

## Unit Normalization
- **totalDebt original:** 9.456.645 million VND
- **conversion formula:** divide by 1,000
- **normalized totalDebt:** 9456.645 billion_vnd

## Commands Run
- `npx tsx scripts/import-vnm-pdf-reviewed-preview.ts` (Dry-run mode)
- `npx tsx scripts/import-vnm-pdf-reviewed-preview.ts --confirm-write` (Confirm-write)
- `npx tsx scripts/import-vnm-pdf-reviewed-preview.ts --confirm-write` (Duplicate re-run/idempotency check)
- `npx tsx scripts/smoke-vnm-pdf-reviewed-post-import.ts` (Runtime verification & post-import smoke)

## Dry-Run Output Summary
```json
{
  "ticker": "VNM",
  "fiscalYear": 2025,
  "periodType": "annual",
  "sourceLabel": "annual_report_2025_pdf_reviewed_preview",
  "dataMode": "research_only",
  "productionApproved": false,
  "status": "derived_preview_import_candidate",
  "eps": 4070,
  "epsUnit": "vnd_per_share",
  "sharesOutstanding": 2089955445,
  "sharesOutstandingUnit": "shares",
  "totalDebt": 9456.645,
  "totalDebtUnit": "billion_vnd"
}
```

## Confirm-Write Summary
- **written rows:** 1
- **skipped rows:** 0
- **invalid rows:** 0

## Duplicate Re-Run Summary
- **written rows:** 0
- **skipped rows:** 1
- **invalid rows:** 0

## VNM Imported Values
- **eps value/unit:** 4070 / vnd_per_share
- **sharesOutstanding value/unit:** 2089955445 / shares
- **totalDebt value/unit:** 9456.645 / billion_vnd
- **sourceLabel:** annual_report_2025_pdf_reviewed_preview
- **dataMode:** research_only
- **productionApproved:** false

## Runtime Verification
- **VNM resolved source:** annual_report_2025_pdf_reviewed_preview
- **EPS:** 4070
- **sharesOutstanding:** 2089955445
- **totalDebt:** 9456.645
- **productionApproved:** false

## Product Smoke Summary
- **Risk:** totalDebt successfully ingested (9456.645).
- **Valuation:** Valuation source boundary properly identifies productionApproved = false.
- **Checklist:** (Implicit through AI context)
- **AI context:** Contains correct sourceLabel, eps, shares, debt, productionApproved=false, and strict guardrails against buy/sell/hold/recommendation logic.

## Confirmations
- **Confirmation existing phase109 row preserved:** Confirmed. The phase109 row remains in the database.
- **Confirmation HPG priority unchanged:** Confirmed. HPG continues to resolve to `annual_report_2025_pdf_reviewed_preview`.
- **Confirmation FPT/MWG source priority unchanged:** Confirmed. FPT and MWG continue to resolve to `phase109_controlled_local_financials`.
- **Confirmation no schema/migration/PDF binary commit:** Confirmed.
- **Confirmation no totalLiabilities-as-totalDebt:** Confirmed.
- **Confirmation no missing-to-zero:** Confirmed.
- **Confirmation no raw million VND stored into billion_vnd field:** Confirmed. (Stored as 9456.645).
- **Confirmation no productionApproved=true:** Confirmed.
- **Confirmation no investment recommendation language:** Confirmed.

## Next Recommended Phase
Phase 139H - TBD (potentially handling remaining tickers FPT, MWG, VCB, MSN).
