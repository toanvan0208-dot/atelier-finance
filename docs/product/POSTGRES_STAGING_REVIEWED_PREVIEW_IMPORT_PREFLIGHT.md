# Phase 142H-S-P: Staging Import Preflight and Source Inventory

## 1. Overview and Environment State
- **Current Main Commit:** `e0926ef83070d8df812f27e474bee946ef574657` (Phase 142G-M2 merge commit)
- **Staging Schema Checked:** Yes. All tables exist (`Company`, `FinancialStatement`, `MarketPrice`, etc.), and counts are currently `0`.
- **Target Environment:** Supabase Staging PostgreSQL DB.
- **Production Scope:** Strictly **OUT OF SCOPE**. No operations will touch production DB or Vercel.

## 2. Import Script Inventory
A comprehensive scan of `scripts/` and `src/lib/data-sources/` identified the following import scripts:
- `import-fpt-pdf-reviewed-preview.ts`
- `import-hpg-pdf-reviewed-preview.ts`
- `import-msn-pdf-reviewed-preview.ts`
- `import-mwg-pdf-reviewed-preview.ts`
- `import-vnm-pdf-reviewed-preview.ts`
- `import-reviewed-source-records.ts`
- `import-vnstock-financials-candidate.ts`
- `import-vnstock-market-pvt-controlled.ts`

**Audit Findings:**
- All writes in these scripts are routed through either `runFinancialStatementLocalWriteTrial` or `runReviewedSourceRecordImport`.
- Both core mechanisms heavily rely on `assessFinancialStatementLocalWriteDatabaseUrl` from `financial-statement-local-write-guard.ts`.
- **Safety Block:** This guard explicitly blocks non-local database URLs (`postgres://`, `postgresql://`) unless they target `localhost` or `127.0.0.1`.
- **Conclusion:** No existing script is capable of executing against the Supabase Staging PostgreSQL DB without throwing a fatal block. **A dedicated, stage-specific script or bypass configuration is required for Phase 142H-S actual import.**

## 3. Approved Import Scope for Phase 142H-S Actual
If a staging import is executed, it MUST strictly adhere to the following scope:
- **Allowed Tickers:** `FPT`, `HPG`, `VNM`, `MSN`, `MWG`
- **Excluded Ticker:** `VCB` (Bank specific logic, excluded from corporate import)
- **Allowed Fields (with provenance):** `eps`, `sharesOutstanding`, `totalDebt`
- **Rejected Fields (missing provenance):** `revenue`, `netIncome`, `totalAssets`, `equity`, `cashAndEquivalents`, `capitalExpenditure`, `operatingCashFlow`
- **Identity Tags:** 
  - `sourceLabel: annual_report_2025_pdf_reviewed_preview`
  - `dataMode: research_only`
  - `productionApproved: false`

## 4. Target Tables
If the import proceeds, the following tables will be mutated:
- `Company` (Upsert logic to register ticker if missing)
- `DataSource` (Upsert logic to register source label)
- `FinancialStatement` (Write records)
- `FinancialStatementUnitMetadata` (Write sidecar traceabilities)

*Note: `MarketPrice` and its sidecar metadata are excluded from this specific import flow.*

## 5. Rollback Plan
If validation fails post-import, the rollback must fail-closed and cleanly revert the staging state:
- Delete from `FinancialStatementUnitMetadata` using cascading relations or explicitly via `financialStatementId` where statements match criteria.
- Delete from `FinancialStatement` where:
  - `sourceLabel = 'annual_report_2025_pdf_reviewed_preview'`
  - `ticker IN ('FPT', 'HPG', 'VNM', 'MSN', 'MWG')`
  - `productionApproved = false`
  - `dataMode = 'research_only'`
- **Do NOT** truncate tables. **Do NOT** drop the schema. **Do NOT** touch data belonging to other sources or VCB.

## 6. Post-Import Validation/Smoke Plan
After the actual import is run, the following verification paths must succeed:
- **Count Verify:** `FinancialStatement` row count increases exactly by the number of reviewed corporate tickers (usually 5).
- **VCB Protection:** Verify `VCB` financial statement is absent or completely unpolluted by corporate metrics.
- **Null Safety:** Verify all disallowed fields remain `null`. Missing-to-zero is strictly prohibited.
- **Product Guardrails:** Run smoke tests `smoke-real-http-six-ticker-workspace.ts` to ensure no investment advice is leaked.
- **API Smoke Paths:**
  - `GET /api/companies`
  - `GET /api/financials?ticker=FPT&latest=true`
  - `GET /api/financials?ticker=VCB&latest=true`

## 7. Stop Conditions for Actual Import
The actual import MUST immediately stop if:
- VCB corporate metrics are attempted to be mapped.
- Any field outside the allowed 3 fields is provided.
- `productionApproved: true` is detected.
- Any missing value is mapped to `0`.
- The fallback logic interprets banking liabilities as corporate debt.
