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
