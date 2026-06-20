# Controlled Valuation Calculation Helper

Phase: 59 - Controlled Valuation Calculation Helper
Date: 2026-06-20

## 1. Phase 59 Summary

Phase 59 adds a pure helper and tests for controlled Valuation metric calculation/readiness.

This phase does not wire the helper into the Valuation UI. It does not change the current Valuation calculation path, which still uses the persisted financial and market input bridge. It does not claim Valuation DB-backed status and does not promote any source approval state.

The helper calculates only narrow metrics when required inputs are present and positive. It keeps blocked metrics blocked and returns source-boundary warnings for mixed, fallback, local, research-only, or unapproved source states.

## 2. Files Changed

Code:

- `src/features/valuation/lib/controlled-valuation-calculation.ts`
- `src/features/valuation/index.ts`

Tests:

- `src/features/valuation/lib/__tests__/controlled-valuation-calculation.test.ts`

Docs:

- `docs/product/CONTROLLED_VALUATION_CALCULATION_HELPER.md`
- `docs/product/CONTROLLED_VALUATION_CALCULATION_WIRING_READINESS_PLAN.md`
- `docs/product/CONTROLLED_VALUATION_RUNTIME_CONSUMPTION_BOUNDARY.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 3. Helper Behavior

Helper:

- `buildControlledValuationCalculation`

Input groups:

- `financials.revenue`
- `financials.netIncome`
- `financials.equity`
- `financials.eps`
- `financials.sharesOutstanding`
- `market.marketPrice`
- `market.marketCap`
- `source.financialsSourceMode`
- `source.marketSourceMode`
- `source.dataMode`
- `source.productionApproved`
- `source.mixedSource`
- `source.fallbackUsed`

Output status values:

- `ready`
- `insufficient_data`
- `not_applicable`
- `blocked`

Source boundary output:

- `canClaimValuationDbBacked:false`
- `productionApproved:false`
- `mixedSource`
- `warnings`

The helper returns numeric values only for ready metrics. Missing, unsafe, or blocked metrics return `value:null`.

## 4. Metric Rules

| Metric | Ready condition | Missing behavior | Non-positive behavior | Output |
| --- | --- | --- | --- | --- |
| marketCap | Direct `marketCap > 0`, or `marketPrice > 0` and `sharesOutstanding > 0`. | `insufficient_data`, `value:null`. | `insufficient_data`, `value:null`. | Ready value or null. |
| P/E | `marketPrice > 0` and `eps > 0`. | `insufficient_data`, `value:null`. | EPS `<= 0` gives `not_applicable`; market price `<= 0` gives `insufficient_data`. | Ready value or null. |
| BVPS | `equity > 0` and `sharesOutstanding > 0`. | `insufficient_data`, `value:null`. | Equity `<= 0` gives `not_applicable`; shares `<= 0` gives `insufficient_data`. | Ready value or null. |
| P/B | `marketPrice > 0` and BVPS ready. | `insufficient_data`, `value:null`. | Equity/BVPS not applicable keeps P/B `not_applicable`. | Ready value or null. |
| P/S | `revenue > 0` and marketCap ready. | `insufficient_data`, `value:null`. | Revenue `<= 0` gives `not_applicable`. | Ready value or null. |
| EV | Never ready in Phase 59. | Blocked. | Blocked. | `blocked`, `value:null`. |
| EV/EBITDA | Never ready in Phase 59. | Blocked. | Blocked. | `blocked`, `value:null`. |
| DCF | Never ready in Phase 59. | Blocked. | Blocked. | `blocked`, `value:null`. |
| fair value range | Never ready in Phase 59. | Blocked. | Blocked. | `blocked`, `value:null`. |

## 5. Blocked Metrics

The helper always blocks:

- EV: `blocked_until_explicit_ev_inputs`
- EV/EBITDA: `blocked_until_ebitda_source_is_explicit`
- DCF/WACC: `blocked_no_dcf_wacc_in_phase_59`
- fair value range: `blocked_no_fair_value_range_in_phase_59`

These outputs intentionally avoid deriving debt, cash, EBITDA, WACC, scenario assumptions, or a valuation range from incomplete inputs.

## 6. Source And Mixed Boundary

The helper keeps source claims conservative:

- `canClaimValuationDbBacked:false`
- `productionApproved:false`
- local/research-only/sample data is not production-approved
- mixed-source input adds `valuation_remains_mixed_source`
- fallback input adds `fallback_data_not_production_approved`
- unapproved or unspecified source approval adds `source_not_approved_for_runtime_claim`

Financials DB-backed status still does not make Valuation fully DB-backed.

## 7. Tests Added

The new test file covers:

- P/E ready, EPS missing, EPS non-positive, and market price missing/non-positive.
- BVPS ready, equity missing, equity non-positive, and shares missing/non-positive.
- P/B ready through BVPS dependency.
- P/S ready from direct market cap and derived market cap.
- Revenue missing and revenue non-positive.
- EV, EV/EBITDA, DCF, and fair value range blocked.
- `productionApproved:false` preservation.
- mixed-source and fallback warnings.
- missing/null values not zero-filled.
- forbidden interpretation flags remaining false.
- helper output avoiding forbidden positive wording.

## 8. Browser Verification

Browser verification was not run for Phase 59.

Reason: this phase adds a pure helper, export, tests, and documentation only. It does not wire the helper into UI, does not change `ValuationPage`, and does not change the existing Valuation calculation path.

Any future UI wiring phase must browser-verify fallback and local DB-backed Financials modes for FPT and MWG.

## 9. Non-goals

- No DB write.
- No real BCTC import.
- No source approval.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No Valuation UI wiring.
- No Risk scoring.
- No production source approval.
- No valuation recommendation.
- No fair value range.
- No target price.

## 10. Next Recommended Phase

Phase 60 can be a Controlled Valuation Helper Integration Boundary.

Maximum safe Phase 60 scope:

- decide whether the helper is consumed only by a boundary helper or by a small non-user-facing adapter first;
- keep `ValuationPage` output unchanged unless a separate UI verification plan is included;
- preserve mixed-source labeling and `canClaimValuationDbBacked:false`;
- browser-verify if any UI or displayed calculation changes.

## 11. Phase 60 Follow-up

Phase 60 adds `CONTROLLED_VALUATION_HELPER_INTEGRATION_BOUNDARY.md` and the pure `buildControlledValuationIntegrationBoundary` wrapper. It selects Financials runtime and persisted bridge inputs, calls `buildControlledValuationCalculation`, and returns source provenance while keeping `ValuationPage` output unchanged.
