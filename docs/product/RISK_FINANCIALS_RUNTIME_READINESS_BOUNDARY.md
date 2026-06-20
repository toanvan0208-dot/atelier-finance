# Risk Financials Runtime Readiness Boundary

Phase: 54 - Risk Financials Runtime Readiness Boundary

Date: 2026-06-20

## 1. Summary

Phase 54 adds a Risk readiness contract for Financials runtime availability and risk-specific input safety. It does not wire Risk calculations to Financials runtime data. Risk UI still uses its existing static/sample data path.

The boundary makes these states explicit:

- Financials runtime may be available.
- Risk calculation may still be unwired to that runtime.
- Risk cannot claim DB-backed status from Financials, Overview, or Valuation.
- Local/research-only/sample data remains `productionApproved:false`.

## 2. Why Readiness First

Risk can overstate confidence when core inputs are missing. CFO, net income, debt, equity, total assets, current assets, and current liabilities need explicit readiness states before any runtime consumption is wired into the module.

## 3. Files Audited

- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/financials-derived-module-readiness.ts`
- `src/features/financials/index.ts`
- `src/features/overview/lib/overview-financials-runtime-boundary.ts`
- `src/features/valuation/lib/valuation-financials-runtime-readiness.ts`
- `src/features/valuation/lib/valuation-financials-runtime-consumption.ts`
- `src/features/risk`
- `src/features/risk/index.ts`
- `src/features/risk/components/RiskPage.tsx`
- `src/features/risk/lib/build-risk-desk-data.ts`
- `src/features/risk/lib/map-risk-to-logic-input.ts`
- `src/features/risk/lib/__tests__/build-risk-desk-data.test.ts`
- `src/components/shared/DataQualityBanner.tsx`

## 4. Files Changed

- `src/features/risk/lib/risk-financials-runtime-readiness.ts`
- `src/features/risk/lib/__tests__/risk-financials-runtime-readiness.test.ts`
- `src/features/risk/index.ts`
- `docs/product/RISK_FINANCIALS_RUNTIME_READINESS_BOUNDARY.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`
- `docs/product/FINANCIALS_DERIVED_MODULE_READINESS_BOUNDARY.md`
- `docs/product/CONTROLLED_VALUATION_RUNTIME_CONSUMPTION_BOUNDARY.md`
- `docs/product/OVERVIEW_FINANCIALS_RUNTIME_CONSUMPTION_BOUNDARY.md`

## 5. Current Risk Source Status

| Area | Current status |
| --- | --- |
| Risk UI source | Existing static/sample `riskRedesignData` path. |
| Risk builder | `buildRiskDeskData` can build derived risk data from a supplied snapshot, with missing-data handling. |
| Persisted/API bridge | No Risk-specific persisted input API bridge is wired in the UI. |
| Financials runtime consumption | Not wired in Phase 54. |
| Risk status claim | Readiness only. `canClaimRiskDbBacked:false`. |
| Production approval | Always `productionApproved:false` for local/research-only/sample/missing data. |

## 6. Readiness Rules

- operating cash flow missing/null -> cash-flow quality is `insufficient_data`.
- net income missing/null -> earnings quality is `insufficient_data`.
- revenue missing/null -> data quality risk is `insufficient_data`.
- debt missing/null -> leverage risk is `insufficient_data`.
- equity missing/null -> leverage risk is `insufficient_data`.
- equity `<= 0` -> equity-based risk is `not_applicable`.
- total assets missing/null -> asset-scaled risk is `insufficient_data`.
- total assets `<= 0` -> asset-scaled risk is `not_applicable`.
- current assets missing/null -> liquidity risk is `insufficient_data`.
- current liabilities missing/null -> liquidity risk is `insufficient_data`.
- current liabilities `<= 0` -> liquidity risk is `not_applicable`.
- Missing/null values remain `null` or `unavailable`; they are not converted to `0`.
- Divide-by-zero is not allowed.
- No source approval, realtime, certainty, or action wording is introduced by the boundary.

## 7. Boundary Rules

- Financials DB-backed status does not mean Risk is DB-backed.
- If Financials runtime is available but Risk calculation is not wired, Risk status is readiness/source-available only.
- Local DB/research-only/sample data is not production-approved.
- `productionApproved:false` remains explicit.
- Risk readiness is only a data-safety state.

## 8. UI Consumption

UI consumption was deferred in Phase 54.

Reason: Risk UI currently uses static/sample data directly. Wiring Financials runtime into Risk display would require a broader source transition. Phase 54 keeps the change as a pure readiness/safety boundary with focused tests.

## 9. Tests Added

Added `src/features/risk/lib/__tests__/risk-financials-runtime-readiness.test.ts`.

The tests cover:

- Financials local DB/research-only runtime available while Risk remains unwired.
- `canClaimRiskDbBacked:false`.
- `productionApproved:false`.
- operating cash flow missing readiness.
- net income missing readiness.
- revenue missing readiness.
- debt missing readiness.
- equity missing and non-positive readiness.
- total assets missing and non-positive readiness.
- current liabilities missing and non-positive readiness.
- missing/null policy and no zero substitution.
- no forbidden source, certainty, or action wording in boundary output.

## 10. Browser Verification

Browser verification was not run for Phase 54. No Risk UI change was made; the phase adds a pure helper, tests, exports, and documentation.

## 11. Non-goals

- No DB write.
- No real BCTC import.
- No source approval.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No Valuation calculation wiring.
- No production source approval.
- No risk/safety action instruction.

## 12. Next Recommended Phase

Phase 55 can define a Controlled Risk Runtime Consumption Boundary if Phase 54 remains stable. Another useful next step is a browser verification sweep for Financials, Overview, Valuation, and Risk source transparency.

## 13. Phase 55 Follow-up

Phase 55 browser verification is recorded in `CROSS_MODULE_RUNTIME_SOURCE_TRANSPARENCY_BROWSER_VERIFICATION.md`. Playwright confirmed Risk remains on the static/sample UI path in both fallback and DB-backed Financials modes, does not receive Financials runtime props, and does not claim Risk DB-backed status.

## 14. Phase 56 Follow-up

Phase 56 adds `CONTROLLED_RISK_RUNTIME_CONSUMPTION_BOUNDARY.md`. Risk now receives Financials runtime metadata and available snapshot fields for a UI boundary note, while the Risk display/scoring path remains static/sample and `canClaimRiskDbBacked:false`.

## 15. Phase 57 Follow-up

Phase 57 adds `CROSS_MODULE_RUNTIME_CONSUMPTION_BROWSER_VERIFICATION.md`. The sweep confirmed Risk stays controlled partial/mixed-source in fallback and local DB-backed modes, with unavailable fields remaining explicit.
