# Phase 142H-S: Staging Reviewed Preview Import Checklist

## 1. Prerequisites
- [ ] Ensure `.env.staging.local` is present and accurately points to the Supabase Staging PostgreSQL DB.
- [ ] Verify `DATABASE_URL` is NOT pointing to production.
- [ ] Confirm `ATELIER_LOCAL_IMPORTS_ENABLED=true` in staging env if script requires it.

## 2. Pre-Import Staging Check
- [ ] Run staging read-only check script.
- [ ] Document pre-import counts for `FinancialStatement`, `Company`, `FinancialStatementUnitMetadata`, and `DataSource`. All should currently be `0`.

## 3. Script Preparation
- [ ] **BLOCKER RESOLUTION**: Develop a dedicated, secure staging import script OR bypass the `financial-statement-local-write-guard.ts` using a `CONFIRM_STAGING_WRITE_INTENT` flag to specifically allow writes to Supabase staging.
- [ ] Audit the new script to ensure it hardcodes `productionApproved = false`, `dataMode = 'research_only'`, and filters explicitly for the 5 allowed corporate tickers (`FPT`, `HPG`, `VNM`, `MSN`, `MWG`).

## 4. Execution
- [ ] Run the dry-run variant of the staging import script first.
- [ ] Verify the dry-run console output reflects exact 3 allowed fields (`eps`, `sharesOutstanding`, `totalDebt`) and exactly 5 rows accepted.
- [ ] Execute the actual import write to staging: `npm run source-records:reviewed:import -- --file <path> --confirm-write` (or equivalent staging command).

## 5. Post-Import Verification
- [ ] Re-run staging count check. `FinancialStatement` should increase by 5.
- [ ] `Company` count should increase by 5.
- [ ] `FinancialStatementUnitMetadata` should populate exactly the provenance records for the allowed fields.
- [ ] Verify `VCB` is entirely absent from the `FinancialStatement` staging table.
- [ ] Verify `productionApproved` is universally `false` for new records.

## 6. Smoke Tests & Read Paths
- [ ] Run API endpoint check: `GET /api/companies/FPT`
- [ ] Run API endpoint check: `GET /api/financials?ticker=FPT&latest=true` -> Verify exactly 3 values returned, rest are `null`.
- [ ] Run local E2E smoke tests pointing to the staging DB (if permitted by rules).
- [ ] Review UI components to ensure no investment advice or missing-to-zero bugs are present.

## 7. Rollback Procedures (If Failed)
- [ ] If any condition fails, execute the rollback script to delete exactly the rows matching:
  - `sourceLabel = 'annual_report_2025_pdf_reviewed_preview'`
  - `dataMode = 'research_only'`
  - `productionApproved = false`
- [ ] Verify staging database returns to `0` count state for these records.

## 8. Stop Conditions
**ABORT** immediately if:
- The target database resolves to production.
- Any field other than `eps`, `sharesOutstanding`, or `totalDebt` attempts to insert non-null data.
- The script attempts to import `VCB`.
- The local write guard accidentally permits writes without an explicit staging-override flag, indicating a security hole.
