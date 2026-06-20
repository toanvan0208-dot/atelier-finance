# Controlled Valuation Helper Integration Boundary

Phase: 60 - Controlled Valuation Helper Integration Boundary
Date: 2026-06-20

## 1. Phase 60 Summary

Phase 60 adds a pure integration boundary for the Phase 59 controlled Valuation calculation helper.

The integration boundary can select financial inputs from a Financials runtime snapshot and market inputs from the persisted valuation bridge. It calls `buildControlledValuationCalculation`, preserves selected-input provenance, and returns source-boundary warnings.

This phase does not wire the integration boundary into `ValuationPage`, does not change displayed Valuation metrics, and does not claim Valuation DB-backed status.

## 2. Files Changed

Code:

- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/index.ts`

Tests:

- `src/features/valuation/lib/__tests__/controlled-valuation-integration-boundary.test.ts`

Docs:

- `docs/product/CONTROLLED_VALUATION_HELPER_INTEGRATION_BOUNDARY.md`
- `docs/product/CONTROLLED_VALUATION_CALCULATION_HELPER.md`
- `docs/product/CONTROLLED_VALUATION_CALCULATION_WIRING_READINESS_PLAN.md`
- `docs/product/CONTROLLED_VALUATION_RUNTIME_CONSUMPTION_BOUNDARY.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 3. Integration Behavior

Helper:

- `buildControlledValuationIntegrationBoundary`

Behavior:

- Selects financial inputs from Financials runtime when present.
- Falls back to persisted financial inputs when runtime field is explicitly missing and persisted input exists.
- Selects market inputs only from persisted/market bridge inputs.
- Does not infer market price or market cap.
- Calls `buildControlledValuationCalculation`.
- Returns selected input source tracking for each input.
- Returns source mode and warnings without changing UI/runtime behavior.

Selected input sources:

- `financials_runtime`
- `persisted_bridge`
- `unavailable`

Integration notes include:

- `calculation_helper_integrated_ui_output_unchanged`
- `market_inputs_remain_persisted_or_pvt_owned`
- `financial_inputs_may_use_runtime_when_available`
- `no_ev_dcf_or_fair_value_integration`

## 4. Source Ownership

| Input | Preferred source | Fallback source | Can infer? | Notes |
| --- | --- | --- | --- | --- |
| revenue | Financials runtime snapshot. | Persisted bridge if runtime field is explicitly missing. | No. | Used for P/S only when positive. |
| equity | Financials runtime snapshot. | Persisted bridge if runtime field is explicitly missing. | No. | Used for BVPS/P/B only when positive. |
| eps | Financials runtime snapshot. | Persisted bridge if runtime field is explicitly missing. | No. | Phase 60 does not derive EPS from net income and shares. |
| sharesOutstanding | Financials runtime snapshot when present. | Persisted bridge if runtime field is explicitly missing. | No. | Can combine with persisted market price, which makes source mode mixed. |
| marketPrice | Persisted bridge / market/PVT owner. | None in this boundary. | No. | Financials runtime is not a market-price source. |
| marketCap | Persisted bridge / market/PVT owner if directly provided. | Helper can derive from valid marketPrice and shares. | Only from valid owned inputs. | Missing direct marketCap is not replaced with `0`. |
| netIncome | Financials runtime snapshot. | Persisted bridge if runtime field is explicitly missing. | No. | Tracked for provenance; Phase 60 does not use it to derive EPS. |

## 5. Metric Behavior Through Helper

| Metric | Phase 60 behavior |
| --- | --- |
| marketCap | Ready from direct persisted marketCap, or from persisted marketPrice plus selected valid sharesOutstanding. |
| P/E | Ready only when selected EPS and persisted marketPrice are positive. |
| BVPS | Ready only when selected equity and selected sharesOutstanding are positive. |
| P/B | Ready only when BVPS and persisted marketPrice are ready. |
| P/S | Ready only when selected revenue and marketCap are ready. |
| EV | Blocked by Phase 59 helper. |
| EV/EBITDA | Blocked by Phase 59 helper. |
| DCF/WACC | Blocked by Phase 59 helper. |
| fair value range | Blocked by Phase 59 helper. |

## 6. Boundary Rules

- `canClaimValuationDbBacked:false`
- `productionApproved:false`
- source mode is `mixed_source` when runtime financial inputs and persisted market/bridge inputs are both used
- local/research-only runtime data emits `local_research_data_not_production_approved`
- fallback data emits `fallback_data_not_production_approved`
- runtime field fallback to persisted input emits field-level persisted-bridge warning
- no official/realtime/production claim
- no recommendation or trading-signal wording
- no cheap/expensive/attractive wording

## 7. Tests Added

The new tests cover:

- Financials runtime revenue/equity selection.
- Persisted market input ownership.
- P/E from runtime EPS and persisted market price.
- EPS missing and EPS non-positive.
- BVPS/P/B from runtime equity/shares and persisted market price.
- Equity non-positive guardrail.
- P/S from runtime revenue and direct persisted market cap.
- marketCap from persisted market price plus runtime shares.
- missing shares guardrail and zero-fill prevention.
- runtime missing field fallback to persisted bridge.
- local/research-only warning.
- fallback warning.
- EV, EV/EBITDA, DCF, and fair value range remaining blocked.
- integration notes that UI output is unchanged.
- forbidden wording absence in helper output.

## 8. UI And Browser Status

Browser verification was not run for Phase 60.

Reason: this phase adds a pure integration helper, export, tests, and documentation only. `ValuationPage` was not changed, displayed metric cards were not changed, and the existing persisted-bridge calculation path remains unchanged.

If a future phase displays the integration output, browser verification must cover fallback and local DB-backed Financials modes for FPT and MWG.

## 9. Non-goals

- No DB write.
- No real BCTC import.
- No source approval.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No Valuation UI metric display change.
- No Risk scoring.
- No production source approval.
- No EV, EV/EBITDA, DCF/WACC, or fair value range calculation.
- No valuation recommendation.
- No target price.

## 10. Next Recommended Phase

Phase 61 can be a Controlled Valuation UI Read-only Display Boundary only if the product wants to expose helper statuses.

Maximum safe Phase 61 scope:

- display controlled statuses only, not investment interpretation;
- preserve existing Valuation source note;
- keep persisted bridge visible where it still supplies market inputs;
- keep `canClaimValuationDbBacked:false`;
- browser-verify fallback and local DB-backed modes before commit.

## 11. Phase 61 Follow-up

Phase 61 adds `CONTROLLED_VALUATION_UI_READ_ONLY_DISPLAY_BOUNDARY.md` and wires this boundary into Valuation UI as a read-only status panel. It displays source mode, `productionApproved:false`, `canClaimValuationDbBacked:false`, allowed metric readiness, and blocked EV/EV/EBITDA/DCF/fair-value-range states without adding investment interpretation.
