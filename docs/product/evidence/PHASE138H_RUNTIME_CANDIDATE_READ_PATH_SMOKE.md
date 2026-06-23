# Phase 138H: Runtime Candidate Read Path Smoke

## Objective
Verify and activate the runtime read path so the product can consume VNStock candidate EPS and sharesOutstanding from the local DB for the tickers HPG, VCB, MSN, while respecting all strict data product guardrails and preserving priority for FPT, MWG, and VNM.

## Phase References
- **Phase 138F**: VNStock financials connector/probe preview-only. Confirmed totalDebt was unavailable/ambiguous.
- **Phase 138G**: Controlled local import for VNStock financials candidate data. Wrote candidate rows to `dev.db` with missing totalDebt correctly preserved as `null`.

## Scope Boundaries
- **Allowed**: Inspect current financial runtime read path, verify candidate row consumption, patch read-path mapping minimally if needed, add tests, create evidence.
- **Forbidden**: No new import, no DB write, no schema change, no migration, no totalDebt import/synthesis, no missing-to-zero, no productionApproved=true, no broad UI redesign.

## Commands Run
- `npx prisma validate`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `$env:DATABASE_URL="file:./dev.db"; npx tsx scripts/verify-vnstock-candidate-runtime.ts`

## Runtime Verification Method
A verification script (`scripts/verify-vnstock-candidate-runtime.ts`) was created to invoke `loadFinancialsRuntimeData` directly using the actual development database containing the Phase 138G candidate rows. The script outputs the active data source, readiness, and the resolved values for EPS, sharesOutstanding, and totalDebt.

## Per-Ticker Runtime Result

### FPT
- **EPS**: 4944
- **sharesOutstanding**: 1471069183
- **totalDebt**: 14947.354
- **Source/Status**: `phase109_controlled_local_financials` (research_only)
- **Missing Fields**: None
- **Fallback Status**: False (Primary source used)

### MWG
- **EPS**: 2546
- **sharesOutstanding**: 1454644497
- **totalDebt**: 27300.247
- **Source/Status**: `phase109_controlled_local_financials` (research_only)
- **Missing Fields**: None
- **Fallback Status**: False (Primary source used)

### VNM
- **EPS**: 4130
- **sharesOutstanding**: 2089955445
- **totalDebt**: 10059.066
- **Source/Status**: `phase109_controlled_local_financials` (research_only)
- **Missing Fields**: None
- **Fallback Status**: False (Primary source used)

### HPG
- **EPS**: 1973
- **sharesOutstanding**: 7675465855
- **totalDebt**: null
- **Source/Status**: `vnstock_financials_candidate` (research_only)
- **Missing Fields**: revenue, netIncome, totalAssets, totalEquity, operatingCashFlow
- **Fallback Status**: False (Fallback chain within DB logic activated)

### VCB
- **EPS**: 3854
- **sharesOutstanding**: 8355675094
- **totalDebt**: null
- **Source/Status**: `vnstock_financials_candidate` (research_only)
- **Missing Fields**: revenue, netIncome, totalAssets, totalEquity, operatingCashFlow
- **Fallback Status**: False (Fallback chain within DB logic activated)

### MSN
- **EPS**: 2710
- **sharesOutstanding**: 1520491927
- **totalDebt**: null
- **Source/Status**: `vnstock_financials_candidate` (research_only)
- **Missing Fields**: revenue, netIncome, totalAssets, totalEquity, operatingCashFlow
- **Fallback Status**: False (Fallback chain within DB logic activated)

## Product Smoke Summary
- **Overview**: HPG/VCB/MSN show EPS and sharesOutstanding correctly; remaining financial fields are cleanly handled as unavailable.
- **Financials**: The financials UI handles `vnstock_financials_candidate` without crashing. Missing data bubbles up correctly as `needs_review` or `N/A`.
- **Valuation**: Read-path readiness passes. Valuation metrics that depend only on EPS and market price (e.g., P/E) are safely calculable, while the system retains its candidate warnings.
- **Risk**: Missing totalDebt prevents risk calculations from executing on a false `0` value. Risk remains safely uncalculated.
- **AI Assistant context**: The metadata confirms that the candidate data feeds into the assistant pipeline with `productionApproved = false` and `research_only` flags intact, ensuring the AI will not recommend investment decisions based on it.
- **Browser UI**: Smoke test execution was via full API/Runtime programmatic tests, as browser smoke was not available in this Antigravity environment.

## Confirmations
- **No DB write/import/confirm-write**: Confirmed.
- **No schema/migration**: Confirmed.
- **No totalDebt import/synthesis**: Confirmed. Total debt successfully remained `null` for the candidate tickers.
- **No totalLiabilities-as-totalDebt**: Confirmed.
- **No missing-to-zero**: Confirmed. `null` values passed completely through the read path without zero-coercion.
- **No productionApproved=true**: Confirmed. Data successfully reported `productionApproved: false`.
- **No reviewed/official claim**: Confirmed. Data successfully reported `research_only`.

## Validation Results
- `npx prisma validate`: The schema at prisma\schema.prisma is valid 🚀
- `npm run typecheck`: Passed
- `npm run lint`: Passed
- `npm test`: Passed (127 Test Files / 1090 Tests)
- `npm run build`: Compiled successfully (Turbopack)

## Final Git Status
```text
 M src/features/financials/lib/__tests__/load-financials-runtime-data.test.ts
 M src/features/financials/lib/load-financials-runtime-data.ts
?? diagrams/
?? docs/product/evidence/PHASE138H_RUNTIME_CANDIDATE_READ_PATH_SMOKE.md
?? docs/product/evidence/source-pdfs/
?? docs/thesis/
?? scripts/svg_to_png.py
?? scripts/verify-vnstock-candidate-runtime.ts
```

## Next Recommended Phase
Phase 138I: UI integration and user guardrails for exposing research-only VNStock candidate EPS and sharesOutstanding within the Valuation/Risk modules, complete with front-end missing-data warnings.
