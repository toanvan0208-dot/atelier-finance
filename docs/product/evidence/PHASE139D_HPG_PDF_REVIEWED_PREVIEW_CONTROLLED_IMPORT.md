# Phase 139D: HPG PDF Reviewed Preview Controlled Import

## Objective
Perform a controlled local DB import for HPG PDF reviewed-preview financial values that were validated in Phase 139B/139C.

## Scope Boundaries
- **Only HPG is imported.** Other tickers like FPT, MWG, VNM are unaffected.
- **Only eps, sharesOutstanding, and totalDebt.** Extracted safely without importing unapproved fields.
- **Why HPG only:** HPG is the focal ticker for validating PDF manual extraction and unit normalization for 2025 preview reporting.
- **Reference Commits:**
  - 139B: 1baa44d75b42720c1a62e58b88a39f8df51197d8
  - 139C: 236035dea8e29a25a74938ad62909e0b1963ab88

## Source PDF Preview Values
From Phase 139B extraction:
- `eps`: 1973 vnd_per_share
- `sharesOutstanding`: 7675465855 shares
- `totalDebt`: 92174151302217 VND

## Unit Normalization
- `totalDebt original VND`: 92174151302217
- `conversion formula`: Divide by 1,000,000,000
- `normalized billion_vnd`: 92174.151302217

## Commands Run
- **Dry-run**: `npx tsx scripts/import-hpg-pdf-reviewed-preview.ts`
- **Confirm-write**: `$env:DATABASE_URL="file:./dev.db"; npx tsx scripts/import-hpg-pdf-reviewed-preview.ts --confirm-write`
- **Duplicate re-run/idempotency**: `$env:DATABASE_URL="file:./dev.db"; npx tsx scripts/import-hpg-pdf-reviewed-preview.ts --confirm-write` (Skipped safely)
- **Runtime verification**: `$env:DATABASE_URL="file:./dev.db"; npx tsx scripts/verify-hpg-runtime.ts`

## Dry-Run Output Summary
```json
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
  "totalDebtUnit": "billion_vnd"
}
```

## Confirm-Write Output Summary
```json
{
  "status": "write_completed",
  "writeExecuted": true,
  "insertedCount": 1,
  "skippedExistingCount": 0,
  "rejectedCount": 0,
  "warnings": [
    "DATABASE_URL accepted as a local SQLite/dev database for controlled research write trial."
  ],
  "errors": []
}
```

## Duplicate Re-Run Summary
The second run correctly reported `skippedExistingCount: 1` and `writeExecuted: false`, proving idempotency.

## Runtime Verification Summary
- **HPG EPS**: 1973
- **HPG sharesOutstanding**: 7675465855
- **HPG totalDebt**: 92174.151302217
- **sourceLabel/source**: `annual_report_2025_pdf_reviewed_preview`
- **dataMode**: `research_only`
- **productionApproved**: false

## Existing VNStock Candidate Preservation Confirmation
The `vnstock_financials_candidate` row for HPG remains in the database. A new `annual_report_2025_pdf_reviewed_preview` row was created alongside it.

## Source-Priority Behavior
- **HPG** now securely resolves to `annual_report_2025_pdf_reviewed_preview` as the primary source in the runtime logic.
- **FPT/MWG/VNM** correctly bypass this rule and continue to resolve to `phase109_controlled_local_financials`.

## Product Boundary Summary
- **Risk**: Since totalDebt is now correctly loaded, Risk debt-based metrics can calculate successfully using the safe PDF preview data.
- **Valuation**: Operates smoothly without rendering investment recommendation language.
- **AI context**: Context packets load the correct source label (`annual_report_2025_pdf_reviewed_preview`) and explicitly mark `productionApproved: false`.

## Confirmation
- No schema changes or Prisma migrations occurred.
- No PDF binary was committed.
- No other tickers imported.
- No totalLiabilities-as-totalDebt derivation occurred.
- No missing-to-zero conversions occurred.
- No raw VND magnitudes written into the DB.
- `productionApproved=true` never happened.
- No official or "production-approved" claims made.
- No investment recommendation language was injected.

## Next Recommended Phase
Phase 139E: Expand PDF reviewed preview extraction and DB import for the remaining five tickers (FPT, MWG, VNM, VCB, MSN) under similar strict guidelines.
