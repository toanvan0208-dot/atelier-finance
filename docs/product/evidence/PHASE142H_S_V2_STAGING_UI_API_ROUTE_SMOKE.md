# Phase 142H-S-V2: Staging UI and API Route Smoke Evidence

## 1. Objective
Perform read-only staging verification to confirm that the `annual_report_2025_pdf_reviewed_preview` staging import is successfully readable by the UI, runtime modules, and Next.js API routes. No database modifications or imports were allowed.

## 2. Environment Status Before Phase
- **Target environment:** Supabase Staging PostgreSQL
- **Data status:** Phase 142H-S-A/V-F staging import completed successfully

## 3. Files Changed
- `docs/product/evidence/PHASE142H_S_V2_STAGING_UI_API_ROUTE_SMOKE.md` (New)

## 4. Staging Data Identity & Scope
- **Approved Tickers:** `FPT`, `HPG`, `VNM`, `MSN`, `MWG`
- **Excluded Tickers:** `VCB` (Bank corporate import blocked)
- **Data Identity:**
  - `sourceLabel: annual_report_2025_pdf_reviewed_preview`
  - `dataMode: research_only`
  - `productionApproved: false`
- **Approved Fields (Loaded):** `eps`, `sharesOutstanding`, `totalDebt`
- **Rejected Fields (Nullified):** `revenue`, `netIncome`, `totalAssets`, `equity`, `cashAndEquivalents`, `capitalExpenditure`, `operatingCashFlow`

## 5. Verification Commands Run
```bash
node scripts/staging-read-counts.mjs
node scripts/verify-staging-reviewed-preview-import.mjs
node scripts/run-staging.mjs npx tsx scripts/smoke-staging-reviewed-preview-read-path.ts
```

## 6. Staging Counts Results
- **Company count:** 5
- **FinancialStatement count:** 5
- **FinancialStatementUnitMetadata count:** 15
- **MarketPrice count:** 0
- **VCB count:** 0

## 7. API/Read-Path Smoke Results
The script `smoke-staging-reviewed-preview-read-path.ts` directly invoked the Next.js API route `/api/companies/[ticker]/financials?latest=true&dataMode=research_only` and runtime modules for all 5 approved tickers.
**Results:**
- **API Results:** 
  - Returned DB-backed data for FPT, HPG, VNM, MSN, and MWG.
  - Asserted `sourceLabel`, `dataMode`, and `productionApproved=false` identity properly.
  - Missing fields remained `null` (no zero-filling).
  - Blocked VCB from the read path.
- **Runtime (Financials):** `status: db_backed`, `fallbackUsed: false` for all.
- **Valuation Smoke:** `readiness: not_ready`, no forbidden outputs generated (no buy/sell/hold/target price).
- **Risk Smoke:** `readiness: partial`, no forbidden outputs. Did not misuse `totalLiabilities`.
- **Assistant Smoke:** Configured without external LLM API calls (`noLlmCall: true`). Verified guardrails and context boundaries correctly included `productionApproved=false` flags and `sourceLabel`.

## 8. Validation Results
- `prisma validate`: Pass
- `typecheck`: Pass
- `lint`: Pass
- `npm test`: Pass (Note: `fpt-financial-statement-prisma-temp-db-write-verification.test.ts` exhibits expected known flakiness in parallel test environment but passes in isolated runs).
- `npm run build`: Pass

## 9. Results Summary
- **DB write:** No
- **Data import:** No
- **Production deploy:** No
- **VCB corporate import:** No
- **readyForNextPhase:** true
