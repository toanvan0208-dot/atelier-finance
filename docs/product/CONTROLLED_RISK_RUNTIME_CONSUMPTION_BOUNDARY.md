# Controlled Risk Runtime Consumption Boundary

## 1. Phase 56 Summary

Phase 56 adds controlled partial Financials runtime consumption for Risk. Risk now receives Financials runtime metadata and available snapshot fields through the existing workspace/server boundary, and the Risk UI renders a compact source note.

This is not full Risk database-backed scoring. Risk display cards still use the existing static/sample calculation path, while the new boundary exposes Financials runtime source metadata, consumed fields, unavailable fields, readiness status, and guardrails.

## 2. Files Audited

- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/components/shared/DataQualityBanner.tsx`
- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/financials-derived-module-readiness.ts`
- `src/features/financials/index.ts`
- `src/features/overview/components/OverviewPage.tsx`
- `src/features/overview/lib/overview-financials-runtime-boundary.ts`
- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/lib/valuation-financials-runtime-readiness.ts`
- `src/features/valuation/lib/valuation-financials-runtime-consumption.ts`
- `src/features/risk/components/RiskPage.tsx`
- `src/features/risk/data/riskRedesign.data.ts`
- `src/features/risk/index.ts`
- `src/features/risk/lib/build-risk-desk-data.ts`
- `src/features/risk/lib/risk-financials-runtime-readiness.ts`
- `src/features/risk/lib/__tests__/build-risk-desk-data.test.ts`
- `src/features/risk/lib/__tests__/risk-financials-runtime-readiness.test.ts`

## 3. Files Changed

- `src/components/layout/AppShell.tsx`
  - Passes `initialFinancialsRuntimeData` into `RiskPage`.
- `src/features/risk/components/RiskPage.tsx`
  - Accepts the Financials runtime prop and renders a minimal Risk runtime boundary note.
- `src/features/risk/lib/risk-financials-runtime-consumption.ts`
  - Adds controlled consumption mapping, source mode, consumed/unavailable fields, readiness, warnings, and notes.
- `src/features/risk/lib/__tests__/risk-financials-runtime-consumption.test.ts`
  - Adds unit coverage for mixed source, fallback, missing/null fields, non-positive fields, and forbidden wording.
- `src/features/risk/index.ts`
  - Exports the controlled consumption helper.
- Product docs listed in the final commit cross-reference Phase 56.

## 4. Current Risk Source Status

- Risk receives Financials runtime metadata/snapshot: yes.
- Risk source mode:
  - Fallback mode: `sample_fallback`.
  - DB-backed Financials mode: `mixed_source`.
- Risk display/calculation path: existing static/sample Risk cards remain in use.
- Financials runtime consumption: controlled metadata and available snapshot fields only.
- `canClaimRiskDbBacked`: `false`.
- `productionApproved`: `false`.
- UI note: added.

The Risk UI note states that Risk uses static/sample display cards plus controlled Financials runtime metadata when available. It also shows source label, data mode, read path, runtime status, fallback status, `productionApproved:false`, and `canClaimRiskDbBacked:false`.

## 5. Consumed Fields

The helper only consumes fields present in the Financials runtime snapshot.

Safe field list:

- `revenue`
- `netIncome`
- `operatingCashFlow`
- `totalAssets`
- `equity`
- `totalDebt`
- `currentAssets`
- `currentLiabilities`

Mapping details:

- `netIncome` maps from `statementSnapshot.netProfit`.
- `equity` maps from `statementSnapshot.totalEquity`.
- `totalDebt` is not present in the current Financials runtime snapshot, so it remains unavailable.
- `currentAssets` and `currentLiabilities` are consumed only when present.

Observed browser examples:

- FPT DB-backed mode consumed: `revenue`, `netIncome`, `operatingCashFlow`, `totalAssets`, `equity`.
- FPT DB-backed mode unavailable: `totalDebt`, `currentAssets`, `currentLiabilities`.
- MWG DB-backed mode consumed: `netIncome`, `totalAssets`, `equity`.
- MWG DB-backed mode unavailable: `revenue`, `operatingCashFlow`, `totalDebt`, `currentAssets`, `currentLiabilities`.

## 6. Safety And Readiness Rules

- `operatingCashFlow` missing/null -> `cashFlowQuality:insufficient_data`.
- `netIncome` missing/null -> `earningsQuality:insufficient_data`.
- `revenue` missing/null -> `dataQualityRisk:insufficient_data`.
- `totalDebt` missing/null -> `leverageRisk:insufficient_data`.
- `equity` missing/null -> `leverageRisk:insufficient_data`.
- `equity <= 0` -> leverage/equity-based readiness is not ready; when debt is also missing the result can remain `insufficient_data`.
- `totalAssets` missing/null or `<= 0` -> `assetScaledRisk` is not ready.
- `currentAssets` or `currentLiabilities` missing/null -> `liquidityRisk:insufficient_data`.
- `currentLiabilities <= 0` -> `liquidityRisk` is not ready.
- Missing/null values remain null/unavailable and are not replaced with `0`.
- The helper does not divide by zero.
- Local/research-only/sample data keeps `productionApproved:false`.
- Financials DB-backed status does not make Risk fully database-backed.
- No source approval, live-data, production-ready, recommendation, trading-signal, or certainty wording is introduced.

## 7. UI Status

UI note added in `RiskPage`.

The note renders:

- `risk runtime boundary`
- `riskSourceMode`
- `runtimeStatus`
- `readPath`
- `sourceLabel`
- `dataMode`
- `fallbackUsed`
- `productionApproved`
- `canClaimRiskDbBacked`
- consumed and unavailable fields
- calculation readiness rows

The note is intentionally narrow. It does not replace existing Risk cards and does not merge runtime values into the static/sample Risk scoring path.

## 8. Tests Added

Added `src/features/risk/lib/__tests__/risk-financials-runtime-consumption.test.ts`.

The tests cover:

- local DB/research-only runtime with `mixed_source`
- static/sample Risk path warning
- `canClaimRiskDbBacked:false`
- `productionApproved:false`
- consumed/unavailable fields without inventing debt/liquidity values
- `operatingCashFlow` missing
- `netIncome` missing
- debt missing
- equity missing and non-positive
- total assets missing and non-positive
- current liabilities missing and non-positive
- Financials fallback labeling
- no forbidden source/certainty/action wording in helper output

Targeted test run:

- `npm test -- --run src/features/risk/lib/__tests__/risk-financials-runtime-consumption.test.ts src/features/risk/lib/__tests__/risk-financials-runtime-readiness.test.ts`
- Result: `2` files passed / `23` tests passed.

## 9. Browser Verification

Browser verification was run with regular Playwright because the in-app Browser plugin did not expose navigation/screenshot tools in this session.

Fallback mode:

- Command: `npm run dev -- --hostname 127.0.0.1 --port 3100`
- Env: no `ATELIER_FINANCIALS_DB_SOURCE` set by the launched command.
- Routes checked:
  - `/workspace?module=risk`
  - `/workspace?module=risk&ticker=FPT`
- Result:
  - rendered HTTP 200
  - no console errors
  - no framework overlay
  - Risk note visible
  - observed `sample_fallback`
  - observed `productionApproved:false`
  - observed `canClaimRiskDbBacked false`
  - no forbidden browser-visible hits in the checked terms

DB-backed Financials mode:

- Command: `DATABASE_URL=file:./dev.db ATELIER_FINANCIALS_DB_SOURCE=enabled npm run dev -- --hostname 127.0.0.1 --port 3100`
- Routes checked:
  - `/workspace?module=risk&ticker=FPT`
  - `/workspace?module=risk&ticker=MWG`
- Result:
  - rendered HTTP 200
  - no console errors
  - no framework overlay
  - Risk note visible
  - observed `mixed_source`
  - observed `local_db`
  - observed `research_only`
  - observed `productionApproved:false`
  - observed `canClaimRiskDbBacked false`
  - MWG unavailable fields included `revenue` and `operatingCashFlow`
  - no forbidden browser-visible hits in the checked terms

No screenshots or raw browser artifacts were committed.

## 10. Forbidden Wording Scan

The changed code/docs were scanned with fixed-string `rg` checks for:

- `nen mua`, `nen ban`, `nen nam giu`, `tin hieu mua`, `tin hieu ban`, `diem mua`
- `co phieu an toan`, `rui ro thap chac chan`, `chac chan xau`, `an toan`, `dang mua`
- accented Vietnamese equivalents
- `official`, `realtime`, `production-ready`, `production-approved`

Result:

- Unsafe hits in new helper/UI wording: none.
- Safe negative-context hits in docs/tests: allowed where they describe non-goals, denied claims, or forbidden wording checks.
- Existing pre-Phase-56 Risk static content still contains old Vietnamese "margin of safety" style phrases; Phase 56 did not add or expand those phrases.

## 11. Non-goals

- No DB write.
- No DB cleanup/delete.
- No `db:reset`.
- No `db:seed`.
- No real BCTC import.
- No source approval.
- No external API call.
- No Excel/PDF parser.
- No public upload API.
- No Valuation calculation wiring.
- No full Risk database-backed scoring.
- No source production approval.
- No recommendation/trading-signal wording.
- No full risk guarantee.

## 12. Final Result

Phase 56 passes as controlled partial Risk runtime consumption:

- Financials runtime metadata/snapshot reaches Risk.
- Risk UI shows source transparency.
- Risk remains mixed-source/partial-runtime.
- Risk display cards remain static/sample.
- `canClaimRiskDbBacked:false`.
- `productionApproved:false`.
- Missing/null values are not zero-filled.

Recommended next phase: Cross-module Runtime Consumption Browser Verification after Phase 56. This would re-check Financials, Overview, Valuation, and Risk together after Risk now renders its own runtime boundary note.

## 13. Phase 57 Follow-up

Phase 57 records the follow-up sweep in `CROSS_MODULE_RUNTIME_CONSUMPTION_BROWSER_VERIFICATION.md`. Browser verification confirmed Risk fallback and DB-backed routes render the new source note without claiming full Risk DB-backed status.
