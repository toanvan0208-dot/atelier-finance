# Phase 142H-S-S: Staging Reviewed Preview Import Dry Run

## 1. Objective
Create a staging-specific, heavily guarded import script for the Phase 139 reviewed-preview data (`FPT`, `HPG`, `VNM`, `MSN`, `MWG`). The script must strictly validate the staging target, enforce hardcoded constraints for approved metrics, entirely exclude VCB, and default to dry-run mode without modifying the database.

## 2. Environment Status Before Phase
- **Main commit:** `51650833`
- **Target environment:** Supabase Staging PostgreSQL

## 3. Files Changed
- `scripts/dry-run-staging-reviewed-preview-import.ts` (New)
- `docs/product/evidence/PHASE142H_S_S_STAGING_REVIEWED_PREVIEW_IMPORT_DRY_RUN.md` (New)

## 4. Guardrails Applied
- **Target Database Verification:**
  - Script securely reads `DATABASE_URL` directly from `.env.staging.local`.
  - Rejects `localhost` and `127.0.0.1`.
  - Rejects `file:` (SQLite).
  - Rejects `production` and `prod` URLs.
  - Requires `postgres://` or `postgresql://`.
  - Safely masks the connection string in the console output to prevent credential leakage.
- **Data Scope:**
  - **Approved Tickers:** `FPT`, `HPG`, `VNM`, `MSN`, `MWG`
  - **Excluded Tickers:** `VCB` (Explicitly blocked)
  - **Allowed Fields:** `eps`, `sharesOutstanding`, `totalDebt`
  - **Rejected Fields:** `revenue`, `netIncome`, `totalAssets`, `equity`, `cashAndEquivalents`, `capitalExpenditure`, `operatingCashFlow` (Always mapped to `null`)
  - **Zero-filling:** Prohibited.
- **Identity Tags:**
  - `sourceLabel: annual_report_2025_pdf_reviewed_preview`
  - `dataMode: research_only`
  - `productionApproved: false`
- **Fail-closed Write Check:**
  - If `--confirm-write` is provided, the script actively blocks and exits without writing, satisfying the constraints of this phase.

## 5. Dry-Run Execution Summary
**Command executed:**
```bash
npx tsx scripts/dry-run-staging-reviewed-preview-import.ts
```

**Output Summary:**
- Validated the Staging connection string safely.
- Identified 5 target corporate rows.
- Confirmed EPS, SharesOutstanding, and TotalDebt are populated accurately per Phase 139 manual extractions.
- `writeEnabled` was confirmed as `false`.
- The database was not modified.

## 6. Rollback Criteria (For Phase 142H-S Controlled Write)
When controlled writes are executed in the next phase, any rollback must rigidly adhere to this scope:
```sql
DELETE FROM "FinancialStatement"
WHERE "sourceLabel" = 'annual_report_2025_pdf_reviewed_preview'
  AND "ticker" IN ('FPT', 'HPG', 'VNM', 'MSN', 'MWG')
  AND "productionApproved" = false
  AND "dataMode" = 'research_only';
```
*(Warning: Never truncate tables or drop schema. Only target the exact subset defined above.)*

## 7. Results
- **DB write:** No
- **Data import:** No
- **Production deploy:** No
- **VCB corporate import:** No
- **readyFor142H_SActual:** true (The staging script is tested, validated, and ready for actual write implementation when authorized).
