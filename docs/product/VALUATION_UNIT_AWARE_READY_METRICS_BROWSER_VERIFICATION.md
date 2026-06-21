# Valuation Unit-aware Ready Metrics Browser Verification

## 1. Phase 71 Summary

Phase 71 verifies the read-only Valuation panel with a controlled synthetic/local explicit-unit scenario.

The scenario proves ready metrics appear only when Financials units and Market/PVT units are explicit. It adds no real data import, no DB write, no schema migration, no new metric, no source approval, no target price, no fair value range, and no recommendation.

## 2. Files Audited

- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/components/ControlledValuationCalculationPanel.tsx`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/lib/controlled-valuation-calculation.ts`
- `src/features/valuation/lib/valuation-input-unit-provenance.ts`
- `src/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario.ts`
- `src/features/financials/lib/financials-unit-metadata-contract.ts`
- `src/features/technical/lib/market-pvt-unit-metadata-contract.ts`

## 3. Files Changed

Code:

- `src/features/valuation/lib/valuation-unit-aware-ready-metrics-scenario.ts`
- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`
- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/components/ControlledValuationCalculationPanel.tsx`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`

Tests:

- `src/features/valuation/components/__tests__/ControlledValuationCalculationPanel.test.ts`

Docs:

- `docs/product/VALUATION_UNIT_AWARE_READY_METRICS_BROWSER_VERIFICATION.md`
- cross-reference updates in Market/PVT, Financials unit metadata, Valuation display, productization, and source-evidence docs.

Schema/migration:

- none

## 4. Controlled Scenario

| Item | Value |
| --- | --- |
| Scenario route | `/workspace?module=valuation&valuationScenario=phase71-explicit-units` |
| Synthetic ticker | `UNIT71` |
| Financials source label | `phase71_synthetic_unit_valuation_check` |
| Market/PVT source label | `phase71_synthetic_market_unit_check` |
| Data mode | `research_only` |
| productionApproved | `false` |
| canClaimValuationDbBacked | `false` |

Financials explicit units:

- revenue: `1_000` `million_vnd`
- equity: `500` `million_vnd`
- EPS: `5_000` `vnd_per_share`
- sharesOutstanding: `0.1` `million_shares`

Market/PVT explicit units:

- marketPrice: `50_000` `vnd_per_share`
- direct marketCap: `5` `billion_vnd`

The scenario is synthetic/local only and does not use real BCTC or real market data.

## 5. Expected Metric Readiness

| Metric | Required explicit units | Expected status | Expected value behavior |
| --- | --- | --- | --- |
| marketCap | direct `marketCap` VND-scale, or `marketPrice` + `sharesOutstanding` explicit | `ready` | `5,000,000,000` VND from direct explicit marketCap |
| P/E | EPS `vnd_per_share` + marketPrice `vnd_per_share` | `ready` | `10` |
| BVPS | equity VND-scale + sharesOutstanding share unit | `ready` | `5,000` |
| P/B | BVPS ready + marketPrice explicit | `ready` | `10` |
| P/S | revenue VND-scale + direct/derived marketCap | `ready` | `5` |
| EV | explicit EV inputs are not wired | `blocked` | `unavailable` |
| EV/EBITDA | explicit EBITDA source is not wired | `blocked` | `unavailable` |
| DCF | DCF/WACC remains out of scope | `blocked` | `unavailable` |
| fair value range | fair value range remains out of scope | `blocked` | `unavailable` |

## 6. Browser Verification Result

Tool: in-app Browser plugin against local dev server `http://127.0.0.1:3000`.

| Route | Mode | Rendered | Panel visible | Ready metrics | Blocked metrics | Source boundary visible | Forbidden wording | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/workspace?module=valuation` | baseline fallback | yes | yes | baseline-dependent | EV/EV/EBITDA/DCF/fair value range blocked | yes | none | no console errors, no framework overlay |
| `/workspace?module=valuation&ticker=FPT` | baseline ticker | yes | yes | baseline-dependent | EV/EV/EBITDA/DCF/fair value range blocked | yes | none | no console errors, no framework overlay |
| `/workspace?module=valuation&valuationScenario=phase71-explicit-units` | synthetic explicit units | yes | yes | marketCap, P/E, BVPS, P/B, P/S ready | EV/EV/EBITDA/DCF/fair value range blocked | yes | none | no console errors, no framework overlay |

Interaction proof:

- The synthetic route rendered ticker `UNIT71`.
- The `Tải từ API` button was submitted once.
- The panel stayed on the controlled synthetic scenario and retained the expected ready/blocked metric states.

## 7. Source Boundary Result

Browser-visible source/status guardrails:

- `sourceMode:mixed_source`
- `financialsSource:financials_runtime_partial`
- `marketSource:market_pvt`
- `productionApproved:false`
- `canClaimValuationDbBacked:false`
- `valuation_remains_mixed_source`
- `local_research_data_not_production_approved`

No official, realtime, or production source claim was added.

## 8. Zero-fill And Missing Behavior

- The synthetic route shows ready metric values only when their required units are explicit.
- Blocked EV/EV/EBITDA/DCF/fair value rows render `unavailable`, not `0`.
- Baseline routes still use unavailable/insufficient states instead of zero-filling missing inputs.
- Unknown unit behavior remains covered by Phase 63/70 unit tests.

## 9. Tests Added Or Updated

Updated:

- `src/features/valuation/components/__tests__/ControlledValuationCalculationPanel.test.ts`

Coverage:

- Phase 71 synthetic explicit-unit scenario renders ready marketCap, P/E, BVPS, P/B, and P/S.
- EV, EV/EBITDA, DCF, and fair value range remain blocked.
- Source guardrails render `productionApproved:false`, `canClaimValuationDbBacked:false`, and mixed-source warnings.
- Missing/blocked values do not render as zero.
- Forbidden wording remains absent from rendered panel output.

## 10. Non-goals

- no DB reset or seed
- no destructive migration
- no real BCTC import
- no real market data import
- no official source
- no Excel or PDF parser
- no public upload API
- no external API call
- no new metric
- no target price
- no fair value
- no recommendation
- no Risk scoring
- no production source approval

## 11. Limitations

- The scenario is synthetic/local and exists only to verify browser-visible unit-aware readiness.
- Ready ratios are not interpreted as an investment conclusion.
- Unit metadata does not make any source production-approved.
- A real-data trial still requires source evidence, legal/ToS review, and a controlled import plan.

## 12. Next Recommended Phase

Recommended next phase: Phase 72 - Market/PVT Unit Metadata Capture Boundary.

Maximum scope:

- define how existing local/research market price rows or adapters can carry explicit unit metadata;
- keep all data local/research-only unless source evidence is approved;
- preserve `productionApproved:false`;
- do not add new metrics, target price, fair value range, recommendation, Risk scoring, DB reset, seed, or real-data import.
