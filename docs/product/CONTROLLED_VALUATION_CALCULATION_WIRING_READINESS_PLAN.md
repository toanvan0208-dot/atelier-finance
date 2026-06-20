# Controlled Valuation Calculation Wiring Readiness Plan

Phase: 58 - Controlled Valuation Calculation Wiring Readiness Plan
Date: 2026-06-20

## 1. Phase 58 Summary

Phase 58 is a readiness and planning phase only. It audits the current Valuation calculation path, records input ownership, and locks guardrails for a later controlled calculation wiring phase.

This phase does not wire Valuation calculations to Financials runtime data. It does not change UI, output metrics, database state, source approval, external data access, Risk scoring, or recommendation behavior.

The goal is to make Phase 59 narrow enough to implement safely: compute only where required inputs are valid, keep mixed-source boundaries visible, and preserve unavailable/not-applicable states when inputs are missing or unsafe.

## 2. Current Valuation Architecture

Current Valuation calculation flow:

1. `src/features/valuation/components/ValuationPage.tsx` calls `fetchValuationInputsByTicker`.
2. `src/lib/data-sources/valuation-api-client.ts` reads latest persisted local financial statement and market price API records.
3. The API client builds a `ValuationStatementSnapshot`.
4. `src/features/valuation/lib/build-valuation-desk-data.ts` maps the snapshot through `mapValuationToLogicInput`.
5. Financial logic core calculates Valuation ratios from that mapped persisted bridge snapshot.

Financials runtime is currently received by Valuation only for controlled metadata/safe snapshot transparency:

- `AppShell` passes `initialFinancialsRuntimeData` into `ValuationPage`.
- `buildValuationFinancialsRuntimeConsumption` lists consumed/unavailable safe fields.
- The UI note shows mixed-source/controlled partial state.
- The Valuation calculation path still uses the persisted input bridge.

Current boundary status:

| Area | Status |
| --- | --- |
| Calculation path | Persisted financial + market input bridge. |
| Financials runtime used for calculation | No. |
| Financials runtime used for metadata/safe snapshot visibility | Yes. |
| Persisted bridge role | Primary calculation input path. |
| Source mode | Mixed-source or sample fallback depending on runtime availability. |
| `canClaimValuationDbBacked` | `false`. |
| `productionApproved` | `false`. |

## 3. Files Audited

Workspace/layout:

- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`

Financials runtime:

- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`
- `src/features/financials/lib/financials-derived-module-readiness.ts`
- `src/features/financials/index.ts`

Valuation:

- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/lib/build-valuation-desk-data.ts`
- `src/features/valuation/lib/map-valuation-to-logic-input.ts`
- `src/features/valuation/lib/valuation-financials-runtime-readiness.ts`
- `src/features/valuation/lib/valuation-financials-runtime-consumption.ts`
- `src/features/valuation/data/valuationRefactored.data.ts`
- `src/features/valuation/types.ts`
- `src/features/valuation/index.ts`
- `src/features/valuation/lib/__tests__/build-valuation-desk-data.test.ts`
- `src/features/valuation/lib/__tests__/valuation-financials-runtime-readiness.test.ts`
- `src/features/valuation/lib/__tests__/valuation-financials-runtime-consumption.test.ts`

Persisted bridge and financial logic:

- `src/lib/data-sources/valuation-api-client.ts`
- `src/lib/financial-logic/valuation/valuation-metrics.ts`
- `src/lib/financial-logic/valuation/valuation-readiness.ts`
- `src/lib/financial-logic/valuation/valuation-confidence.ts`
- `src/lib/financial-logic/valuation/index.ts`

Technical/PVT and related docs were reviewed as market-runtime references because Valuation depends on market price and shares for market-based metrics.

## 4. Metric Inventory

| Metric | Current source/path | Required inputs | Current availability | Missing/unsafe inputs | Can wire from Financials runtime? | Needs Market/PVT runtime? | Guardrail |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EPS | Financial logic core via persisted bridge; direct `eps` or derived from `netProfit / sharesOutstanding`. | `eps`, or `netProfit` + `sharesOutstanding`. | Persisted bridge may provide `eps`; Financials runtime may expose `eps`; FPT/MWG can miss it. | Missing EPS, missing shares, unit mismatch when derived. | Yes, if Financials runtime has reviewed `eps` or net profit plus valid shares. | Shares still need ownership review if derived. | Missing stays unavailable; derived EPS must be labeled low-confidence unless source/unit is verified. |
| BVPS | `calculateBvps` via persisted bridge; direct `bvps` or `totalEquity / sharesOutstanding`. | `bvps`, or `totalEquity` + `sharesOutstanding`. | Persisted bridge may provide `bvps`; Financials runtime may provide equity/shares. | Missing or non-positive equity/BVPS, missing/non-positive shares. | Partially: equity from Financials runtime; shares ownership must be confirmed. | Yes for shares if not owned by Financials runtime. | Missing -> insufficient data; non-positive equity/BVPS or shares -> not applicable. |
| Market cap | `calculateMarketCap` via persisted bridge. | `closePrice`, `sharesOutstanding`. | Persisted market bridge may provide close price; shares may be missing. | Missing/non-positive close price or shares. | No, except possible shares field after ownership review. | Yes: market price is market/PVT-owned. | Missing or non-positive inputs block calculation; no zero fill. |
| Enterprise value | `calculateEnterpriseValue` via persisted bridge. | Market cap, total debt, cash/cash equivalents. | Logic exists; current persisted snapshot usually lacks cash fields, and API bridge does not map cash from financial API record. | Missing market cap, debt, or cash. | Partially: debt/cash can come from Financials runtime after field support exists. | Yes for market cap. | Missing debt/cash -> insufficient data; do not infer cash or debt. |
| P/E | `calculatePeRatio` via persisted bridge. | `closePrice`, positive EPS. | Logic exists and UI displays value/unavailable from bridge. | Missing close price, missing/non-positive EPS. | Partially: EPS can come from Financials runtime; price cannot. | Yes for close price. | EPS missing -> insufficient data; EPS <= 0 -> not applicable; price missing/non-positive -> unavailable. |
| P/B | `calculatePbRatio` via persisted bridge. | `closePrice`, positive BVPS or equity/share inputs. | Logic exists and UI displays value/unavailable from bridge. | Missing close price, missing/non-positive BVPS/equity/shares. | Partially: equity/BVPS can come from Financials runtime; price cannot. | Yes for close price and possibly shares. | Equity/BVPS missing -> insufficient data; non-positive -> not applicable. |
| P/S | `calculatePsRatio` via persisted bridge. | Market cap, positive revenue. | Logic exists; MWG can miss revenue; market cap can be blocked by missing shares. | Missing/non-positive revenue, missing market cap. | Partially: revenue can come from Financials runtime. | Yes for market cap. | Revenue missing -> insufficient data; revenue <= 0 -> not applicable/unavailable. |
| EV/EBITDA | `calculateEvToEbitda` via persisted bridge. | Enterprise value, positive EBITDA. | Logic exists; bridge/runtime may not have EBITDA, cash, or full EV inputs. | Missing/non-positive EBITDA, missing EV components. | Partially: EBITDA/debt/cash can come from Financials runtime if fields exist. | Yes for market cap inside EV. | EBITDA missing -> insufficient data; EBITDA <= 0 -> not applicable; EV missing -> insufficient data. |
| ROE readiness | `valuation-financials-runtime-readiness` tracks readiness; core financial metrics calculate ROE elsewhere. | Net income, equity. | Readiness exists in Valuation boundary; not a primary Valuation output metric in current page. | Missing/non-positive equity; missing net income. | Yes for net income/equity after runtime field review. | No market dependency. | Equity missing -> insufficient data; equity <= 0 -> not applicable. |
| Valuation readiness/confidence | `calculateValuationReadiness`, `calculateValuationConfidence`, adjusted in `buildValuationDeskData`. | Market price, shares, revenue, net profit, equity, operating cash flow. | Logic exists and is fed by persisted bridge snapshot. | Missing market, financial, or cash-flow inputs; weak source status lowers confidence. | Partially for financial fields only. | Yes for market price and possibly shares. | Mixed-source and fallback must lower/label confidence; no source approval claim. |
| DCF/WACC/fair value range | UI states not ready; `hasFairValueRange` is false. | Multi-period cash flow, WACC, terminal assumptions, scenario support. | Not calculated; fair value range is locked as not ready. | Missing multi-period/assumption data. | No for Phase 59. | Potentially later, after market and assumption models exist. | Must remain locked until a separate model and evidence plan exists. |

## 5. Input Ownership Matrix

| Input | Owner/source candidate | Available in Financials runtime? | Available in Market/PVT runtime? | Available in persisted bridge? | Production approved? | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `revenue` | Financials runtime | Yes, when present in statement snapshot; MWG may miss it. | No. | Yes, through financial API bridge when persisted. | No. | Safe candidate for controlled Phase 59 wiring if present and positive. |
| `netIncome` / `netProfit` | Financials runtime | Yes as `netProfit`. | No. | Yes as `netIncome` mapped to `netProfit`. | No. | Needed for EPS derivation and ROE; do not infer when missing. |
| `operatingCashFlow` | Financials runtime | Yes when present; MWG may miss it. | No. | Yes when persisted financial record has it. | No. | Used in readiness/confidence, not a market ratio numerator today. |
| `totalAssets` | Financials runtime | Yes in runtime type/snapshot family where available. | No. | Not currently used by Valuation bridge snapshot. | No. | More relevant to Risk/Financials than current Valuation ratios. |
| `equity` / `totalEquity` | Financials runtime | Yes as `totalEquity` when present. | No. | Yes as `equity` mapped to `totalEquity`. | No. | Candidate for P/B, BVPS, ROE readiness. |
| `eps` | Financials runtime or derived from Financials + shares | Yes when present. | No. | Yes when persisted. | No. | Candidate only when present or derivation inputs are valid and units are confirmed. |
| `sharesOutstanding` | Financials runtime candidate, issuer/market metadata candidate | Yes when present, but FPT/MWG may miss it. | Candidate only if PVT/issuer metadata owns it later. | Yes when persisted; API bridge currently nulls shares if EPS is null. | No. | Must not be inferred from market cap or price. |
| `marketPrice` / `closePrice` | Market/PVT runtime | No. | Technical/PVT owns market price path. | Yes through market price API bridge. | No. | Required for market-based ratios. |
| `marketCap` | Derived Valuation metric from market price and shares | No as raw field. | Derived candidate once price + shares are available. | Derived by core logic. | No. | Do not persist or display if price/shares invalid. |
| `totalDebt` / debt | Financials runtime | Yes when present. | No. | Yes through financial API bridge. | No. | Required for EV; `shortTermDebt + longTermDebt` is acceptable only when both are finite. |
| `cash` / `cashEquivalents` | Financials runtime | Current Valuation API bridge type supports `cashAndEquivalents`, but API record does not currently map it. | No. | Not currently mapped from latest financial API record. | No. | Blocks controlled EV/EV/EBITDA wiring until bridge/runtime field support is explicit. |
| `ebitda` | Financials runtime candidate | Type supports it in Valuation snapshot, but latest financial API record does not currently include it. | No. | Not currently mapped by API record. | No. | Blocks EV/EBITDA wiring until available and positive. |
| `enterpriseValue` | Derived Valuation metric | No. | Derived candidate after market cap is valid. | Derived by core logic. | No. | Requires market cap, debt, and cash. |

## 6. Guardrail Decision Table

| Condition | Affected metrics | Required output | Forbidden behavior |
| --- | --- | --- | --- |
| EPS missing/null | P/E, EPS, readiness/confidence | `insufficient_data` or unavailable. | Do not replace with `0`; do not infer from price. |
| EPS <= 0 | P/E | `not_applicable`. | Do not present P/E as normally interpretable. |
| Equity missing/null | P/B, BVPS, ROE readiness, confidence | `insufficient_data` or unavailable. | Do not infer equity from assets or market cap. |
| Equity <= 0 | P/B, BVPS, ROE readiness | `not_applicable`. | Do not treat denominator as normal. |
| Shares outstanding missing/null | Market cap, BVPS, EPS-derived/share metrics, P/S, EV | `insufficient_data` or unavailable. | Do not infer shares from price or market cap. |
| Shares outstanding <= 0 | Market cap, BVPS, EPS-derived/share metrics | `not_applicable` or unavailable. | Do not divide by zero or negative shares. |
| Market price missing/null | P/E, P/B, P/S, market cap, EV, EV/EBITDA, yield metrics | Unavailable. | Do not substitute last sample price unless source mode is explicitly sample fallback. |
| Market price <= 0 | Market-based metrics | `not_applicable` or unavailable. | Do not calculate market ratios. |
| Revenue missing/null | P/S, readiness/confidence | `insufficient_data` or unavailable. | Do not treat missing revenue as `0`. |
| Revenue <= 0 | P/S | `not_applicable` or unavailable. | Do not divide by zero or non-positive revenue. |
| EBITDA missing/null | EV/EBITDA | `insufficient_data` or unavailable. | Do not derive EBITDA from net income without a reviewed formula. |
| EBITDA <= 0 | EV/EBITDA | `not_applicable`. | Do not present EV/EBITDA as normally interpretable. |
| Debt/cash missing for EV | Enterprise value, EV/EBITDA | `insufficient_data` or unavailable. | Do not assume debt or cash is `0`. |
| Mixed-source financial + market data | All valuation metrics | Display mixed-source/partial-runtime boundary and preserve source metadata. | Do not claim a single fully DB-backed Valuation source. |
| Fallback/sample data | All valuation metrics | Label fallback/sample state and keep `productionApproved:false`. | Do not promote source status or hide fallback. |
| Local/research-only data | All valuation metrics | Label research-only status and keep `productionApproved:false`. | Do not describe it as source-approved or final. |

## 7. Proposed Phase 59 Controlled Wiring Scope

Recommended maximum Phase 59 scope:

- Add a controlled helper that computes Valuation calculation readiness and optionally calculates only metrics whose required numerator and denominator are valid.
- Keep persisted bridge inputs visible and still supported.
- Use Financials runtime only for financial fields with clear ownership: revenue, net profit, equity, operating cash flow, EPS where present, and debt only when present.
- Keep market price owned by the market/PVT or persisted market bridge path.
- Keep `canClaimValuationDbBacked:false`.
- Keep `productionApproved:false`.
- Keep mixed-source note visible when financial and market inputs come from different boundaries.
- Do not add valuation interpretation wording, action wording, or Risk scoring.

Metrics safest for a narrow Phase 59:

- P/E readiness from runtime EPS plus persisted/market price, only when EPS and price are positive.
- P/B/BVPS readiness from runtime equity/BVPS plus valid shares/price, only when denominators are positive.
- P/S readiness from runtime revenue plus valid market cap, only when revenue, price, and shares are positive.
- Valuation readiness/confidence labels, with mixed-source/fallback lowering or blocking source claims.

Metrics blocked for Phase 59 unless additional fields are made explicit:

- Enterprise value and EV/EBITDA, because cash/cash equivalents and EBITDA are not currently available through the latest Valuation API bridge record.
- DCF/WACC/fair value range, because they need a separate multi-period model and assumption review.

## 8. Tests Required Before/With Phase 59

Required unit/helper tests:

- EPS missing -> P/E `insufficient_data`.
- EPS <= 0 -> P/E `not_applicable`.
- Equity missing -> P/B/BVPS/ROE `insufficient_data`.
- Equity <= 0 -> P/B/BVPS/ROE `not_applicable`.
- Shares outstanding missing or <= 0 -> market cap/BVPS/share-based metrics unavailable.
- Market price missing or <= 0 -> market-based metrics unavailable.
- Revenue missing or <= 0 -> P/S unavailable or `not_applicable`.
- EBITDA missing or <= 0 -> EV/EBITDA unavailable or `not_applicable`.
- Debt/cash missing -> EV `insufficient_data`.
- Mixed-source warning remains present.
- `productionApproved:false` is preserved.
- Missing/null values are not zero-filled.
- No forbidden action/source-approval wording appears in positive claims.

Required integration/UI tests if Phase 59 changes rendered output:

- Fallback mode keeps source labels visible.
- DB-backed Financials mode still shows Valuation as mixed-source/controlled partial when market input is bridge-owned.
- FPT and MWG missing fields remain unavailable, not `0`.
- The persisted bridge remains visible wherever it still supplies inputs.

## 9. Browser Verification Requirement For Phase 59

If Phase 59 changes UI or calculations, browser verification must cover:

- `/workspace?module=valuation&ticker=FPT`
- `/workspace?module=valuation&ticker=MWG`
- default fallback mode
- DB-backed Financials mode with `ATELIER_FINANCIALS_DB_SOURCE=enabled`

The verification must confirm:

- no UI/source overclaim
- unavailable fields remain visible
- mixed-source/partial-runtime note remains visible
- `productionApproved:false` remains visible or inspectable
- `canClaimValuationDbBacked:false` remains true in the boundary
- no recommendation/trading-signal wording
- no forbidden valuation interpretation wording in positive claims

## 10. Non-goals

- No DB write.
- No DB cleanup/delete.
- No `db:reset`.
- No `db:seed`.
- No real BCTC import.
- No source approval.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No Risk scoring.
- No production source approval.
- No full Valuation recommendation.
- No Valuation calculation wiring in Phase 58.
- No UI change in Phase 58.

## 11. Final Recommendation

Phase 59 is reasonable only as a narrow controlled wiring helper and test phase.

The maximum safe Phase 59 scope is:

- wire financial fields from Financials runtime into a calculation-readiness helper;
- calculate only metrics with valid positive denominators and complete owned inputs;
- keep market price and market cap dependent on persisted market/PVT ownership;
- keep EV/EV/EBITDA blocked until cash, debt, EBITDA, and market cap ownership are explicit;
- keep DCF/WACC/fair value range locked.

If Phase 59 cannot preserve mixed-source labeling, unavailable states, and `productionApproved:false`, it should remain blocked.

## 12. Phase 59 Follow-up

Phase 59 adds `CONTROLLED_VALUATION_CALCULATION_HELPER.md` and the pure `buildControlledValuationCalculation` helper. The helper calculates only marketCap, P/E, BVPS, P/B, and P/S when inputs are valid; it keeps EV, EV/EBITDA, DCF/WACC, and fair value range blocked. It is not wired into Valuation UI or the existing Valuation calculation path.
