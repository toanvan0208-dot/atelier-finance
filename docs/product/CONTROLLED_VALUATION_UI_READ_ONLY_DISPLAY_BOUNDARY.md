# Controlled Valuation UI Read-only Display Boundary

## 1. Phase Scope

Phase 61 wires the Phase 60 controlled Valuation integration boundary into the Valuation UI as a small read-only status panel.

The panel displays calculation readiness and source-boundary status only. It does not replace the existing persisted input bridge, does not approve any source, and does not produce an investment interpretation.

## 2. UI Surface

New component:

- `src/features/valuation/components/ControlledValuationCalculationPanel.tsx`

Valuation page wiring:

- `src/features/valuation/components/ValuationPage.tsx`

The panel appears below the existing Valuation Financials runtime note so the mixed-source/controlled partial source note remains visible before the metric-status table.

## 3. Displayed Source Flags

The panel displays:

- `sourceMode:<mode>`
- `productionApproved:false`
- `canClaimValuationDbBacked:false`
- controlled status
- boundary warnings when present

This is a UI disclosure boundary, not a DB-backed Valuation claim.

## 4. Allowed Read-only Metrics

The panel may display values only when the Phase 59/60 helper returns `status:"ready"`:

- `marketCap`
- `P/E`
- `BVPS`
- `P/B`
- `P/S`

For `insufficient_data`, `not_applicable`, or `blocked`, the panel displays `unavailable` plus the short helper reason. Missing values are not filled with zero. Very small positive ready values are formatted with enough precision to avoid being rounded down to `0`.

## 5. Blocked Metrics

The following metrics remain blocked in the UI:

- `EV`
- `EV/EBITDA`
- `DCF`
- `fair value range`

They show blocked status and helper reasons only. No value is displayed.

## 6. Interpretation Boundary

The panel does not render:

- buy/sell/hold instructions
- target price or price-goal wording
- cheap/expensive/attractive conclusions
- upside/downside labels
- production-ready or official/realtime data claims

The surrounding Valuation copy was also adjusted where needed so the checked Valuation routes do not show browser-visible investment-interpretation wording.

## 7. Browser Verification

The in-app Browser plugin path was unavailable in this session because no browser navigation/screenshot tool was exposed. Playwright Chromium fallback was used.

Fallback server:

- URL: `http://localhost:3101`
- routes checked:
  - `/workspace?module=valuation`
  - `/workspace?module=valuation&ticker=FPT`

DB-backed Financials server:

- URL: `http://localhost:3102`
- environment:
  - `DATABASE_URL=file:./dev.db`
  - `ATELIER_FINANCIALS_DB_SOURCE=enabled`
- routes checked:
  - `/workspace?module=valuation&ticker=FPT`
  - `/workspace?module=valuation&ticker=MWG`

Observed result:

- HTTP status `200`.
- controlled valuation panel visible.
- `sourceMode:` visible.
- `productionApproved:false` visible.
- `canClaimValuationDbBacked:false` visible.
- EV, EV/EBITDA, DCF, and fair value range visible as blocked.
- no framework overlay observed.
- no console warning/error messages observed.
- no unsafe browser-visible valuation interpretation wording observed.

Screenshots were written to `C:/tmp` and were not committed.

## 8. Tests Added

Added:

- `src/features/valuation/components/__tests__/ControlledValuationCalculationPanel.test.ts`

The tests cover:

- source boundary flags
- mixed-source warnings
- ready metric rendering
- unavailable rendering for non-ready metrics
- no zero-fill for missing values
- small positive ready values not rounded down to zero
- non-positive EPS/equity `not_applicable`
- EV, EV/EBITDA, DCF, and fair value range blocked
- forbidden wording absence in panel output

## 9. Non-goals

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
- No Valuation recommendation.
- No target price.
- No EV/EBITDA, DCF/WACC, or fair value range calculation.

## 10. Next Recommended Phase

The next safe phase should focus on data-unit normalization and metric provenance before any broader Valuation calculation surface is expanded.

Priority checks:

- confirm unit ownership for equity, revenue, shares outstanding, and market price;
- keep mixed-source warnings visible when persisted bridge values supplement runtime data;
- keep `productionApproved:false` until source evidence is approved;
- keep blocked metrics locked until explicit source-owned inputs exist.

## 11. Phase 62 Follow-up

Phase 62 adds `VALUATION_CONTROLLED_DISPLAY_EVIDENCE_HARDENING.md`. It re-audits the Phase 61 read-only panel in fallback and local DB-backed Financials modes, confirms browser-visible source boundary flags remain clear, records runtime-missing persisted-bridge warnings, and finds no UI/source overclaim issue.

## 12. Phase 63 Follow-up

Phase 63 adds `VALUATION_INPUT_UNIT_PROVENANCE_NORMALIZATION.md`. The read-only panel remains the display surface, but controlled values can now become unavailable when required input units are unknown. This prevents scale-sensitive values from being rendered from raw untyped inputs.

## 13. Phase 64 Follow-up

Phase 64 adds `FINANCIALS_IMPORT_UNIT_METADATA_CONTRACT.md`. The Valuation page now passes Financials runtime unit metadata into the controlled boundary, but current Financials local/research/sample data remains unknown-unit unless a source explicitly supplies units. The read-only panel behavior therefore stays conservative: unavailable/insufficient-data is preferred over scale inference.

## 14. Phase 65 Follow-up

Phase 65 adds `SOURCE_SPECIFIC_FINANCIALS_IMPORT_UNIT_CAPTURE.md`. This is parser/import dry-run work only; it does not change the visible Valuation panel. Explicit units captured during dry-run become eligible for future runtime handoff, while unknown units remain blocked by the existing read-only boundary.

## 15. Phase 66 Follow-up

Phase 66 adds `FINANCIALS_UNIT_METADATA_PERSISTENCE_READBACK_BOUNDARY.md`. Runtime sidecar handoff is test-covered, but DB persistence and visible UI output are unchanged. Browser verification is therefore not required for this phase.

## 16. Phase 70 Follow-up

Phase 70 adds `MARKET_PVT_UNIT_METADATA_CONTRACT.md`. This is a non-UI boundary update: explicit Market/PVT unit metadata can be handed into the controlled Valuation integration tests, but the read-only Valuation panel rendering is not changed.

Browser verification is therefore not required for Phase 70. The panel's safety posture remains `productionApproved:false`, `canClaimValuationDbBacked:false`, and blocked EV/DCF/fair-value output.

## 17. Phase 71 Follow-up

Phase 71 adds `VALUATION_UNIT_AWARE_READY_METRICS_BROWSER_VERIFICATION.md`. The read-only panel now has a controlled synthetic browser scenario for unit-aware ready metrics and exposes source-mode chips for Financials and Market/PVT provenance.

The panel remains read-only and does not add any new metric, source approval, target price, fair value, recommendation, or Risk scoring.

## 18. Phase 72 Follow-up

Phase 72 adds `MARKET_PVT_UNIT_METADATA_CAPTURE_BOUNDARY.md`. The Valuation UI is unchanged; the new work is a helper/runtime metadata sidecar boundary that feeds the existing read-only calculation guardrails when market unit metadata exists.

## 19. Phase 73 Follow-up

Phase 73 adds `CONTROLLED_MARKET_PVT_METADATA_WRITE_TRIAL.md`. The Valuation UI remains unchanged; the controlled read-through trial verifies Market/PVT metadata handoff into the existing read-only guardrails without new visible behavior.

## 20. Phase 74 Follow-up

Phase 74 adds `MARKET_PVT_METADATA_PERSISTENCE_DESIGN.md`. The Valuation UI remains unchanged because this phase only designs future Market/PVT metadata storage.
