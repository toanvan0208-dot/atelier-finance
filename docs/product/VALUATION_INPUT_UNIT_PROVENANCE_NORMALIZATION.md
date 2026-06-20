# Valuation Input Unit Provenance Normalization

## 1. Phase 63 Summary

Phase 63 adds controlled unit and provenance normalization for the narrow Valuation helper/integration path.

This phase does not add a new metric, does not add a recommendation, does not calculate EV/EV/EBITDA/DCF/fair value range, and does not claim Valuation is DB-backed, official, realtime, or production-approved.

The main guardrail is simple: scale-sensitive Valuation inputs must carry explicit unit metadata before they are passed into the controlled calculation helper. Unknown units are not guessed from magnitude.

## 2. Files Audited

Valuation:

- `src/features/valuation/lib/controlled-valuation-calculation.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/components/ControlledValuationCalculationPanel.tsx`
- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/index.ts`
- Valuation tests under `src/features/valuation/**/__tests__`

Financials runtime:

- `src/features/financials/lib/financials-runtime-types.ts`
- `src/features/financials/lib/load-financials-runtime-data.ts`

Docs:

- `docs/product/CONTROLLED_VALUATION_UI_READ_ONLY_DISPLAY_BOUNDARY.md`
- `docs/product/VALUATION_CONTROLLED_DISPLAY_EVIDENCE_HARDENING.md`
- `docs/product/CONTROLLED_VALUATION_HELPER_INTEGRATION_BOUNDARY.md`
- `docs/product/CONTROLLED_VALUATION_CALCULATION_HELPER.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 3. Files Changed

Code:

- `src/features/valuation/lib/valuation-input-unit-provenance.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`

Tests:

- `src/features/valuation/lib/__tests__/valuation-input-unit-provenance.test.ts`
- `src/features/valuation/lib/__tests__/controlled-valuation-integration-boundary.test.ts`
- `src/features/valuation/components/__tests__/ControlledValuationCalculationPanel.test.ts`

Docs:

- `docs/product/VALUATION_INPUT_UNIT_PROVENANCE_NORMALIZATION.md`
- cross-reference updates in Valuation/productization/source evidence docs

## 4. Unit Ownership Table

| Input | Expected unit | Accepted explicit units | Source candidate | Can infer unit? | If unknown |
| --- | --- | --- | --- | --- | --- |
| revenue | `vnd` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | Financials runtime, persisted bridge | no | normalized value is `null`; dependent metrics are not ready |
| equity | `vnd` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | Financials runtime, persisted bridge | no | normalized value is `null`; BVPS/P/B are not ready |
| eps | `vnd_per_share` | `vnd_per_share` | Financials runtime, persisted bridge | no | normalized value is `null`; P/E is not ready |
| sharesOutstanding | `shares` | `shares`, `thousand_shares`, `million_shares` | Financials runtime, persisted bridge | no | normalized value is `null`; marketCap/BVPS/share-based metrics are not ready |
| marketPrice | `vnd_per_share` | `vnd_per_share` | persisted bridge, future Market/PVT | no | normalized value is `null`; market-based ratios are not ready |
| marketCap | `vnd` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | persisted bridge, future Market/PVT | no | normalized value is `null`; direct marketCap/P/S are not ready |
| netIncome | `vnd` | `vnd`, `thousand_vnd`, `million_vnd`, `billion_vnd` | Financials runtime, persisted bridge | no | normalized value is `null`; no current displayed metric depends on it |

## 5. Provenance Ownership Table

| Input | Financials runtime | Persisted bridge | Market/PVT | Notes |
| --- | --- | --- | --- | --- |
| revenue | allowed when explicit unit exists | fallback only when explicit unit exists | no | unknown unit blocks P/S |
| equity | allowed when explicit unit exists | fallback only when explicit unit exists | no | unknown unit blocks BVPS/P/B |
| eps | allowed when explicit unit exists | fallback only when explicit unit exists | no | unknown unit blocks P/E |
| sharesOutstanding | allowed when explicit unit exists | fallback only when explicit unit exists | future candidate | unknown unit blocks marketCap/BVPS |
| marketPrice | no | allowed when explicit unit exists | future owner | unknown unit blocks market-based ratios |
| marketCap | no | allowed when explicit unit exists | future owner | direct value must be explicit VND scale |
| netIncome | allowed when explicit unit exists | fallback only when explicit unit exists | no | tracked for provenance, not currently displayed |

`productionApproved:false` remains forced for local/research/sample data.

## 6. Normalization Rules

Currency:

- `vnd` stays `vnd`
- `thousand_vnd` becomes `vnd * 1_000`
- `million_vnd` becomes `vnd * 1_000_000`
- `billion_vnd` becomes `vnd * 1_000_000_000`

Shares:

- `shares` stays `shares`
- `thousand_shares` becomes `shares * 1_000`
- `million_shares` becomes `shares * 1_000_000`

Per-share:

- `vnd_per_share` stays `vnd_per_share`

Unknown or incompatible units:

- `normalizedValue:null`
- status `unknown_unit` or `not_normalized`
- warning emitted
- no magnitude guessing
- no automatic scale inference

Missing values:

- status `missing`
- `normalizedValue:null`
- no zero-fill

## 7. Metric Impact

| Metric | Phase 63 behavior |
| --- | --- |
| marketCap | Ready only with direct explicit VND marketCap, or explicit `marketPrice:vnd_per_share` plus explicit `sharesOutstanding:shares`. |
| P/E | Ready only with explicit `eps:vnd_per_share` and explicit `marketPrice:vnd_per_share`. |
| BVPS | Ready only with explicit VND equity and explicit shares outstanding. |
| P/B | Ready only when BVPS is ready and market price has explicit `vnd_per_share`. |
| P/S | Ready only when marketCap is ready and revenue has explicit VND scale. |
| EV | Still blocked. |
| EV/EBITDA | Still blocked. |
| DCF | Still blocked. |
| fair value range | Still blocked. |

## 8. UI Impact

No new UI component was added.

The existing read-only panel may display more `insufficient_data` states when current runtime or persisted bridge values lack explicit unit metadata. This is intentional: unknown unit is safer than rendering a scale-sensitive value.

Browser verification was run because the Valuation panel output can change from ready values to unavailable status when unit metadata is missing.

Browser verification notes:

- In-app Browser runtime was attempted, but the node-backed browser kernel exited with `windows sandbox failed: spawn setup refresh`.
- Playwright fallback was used.
- Screenshot file writes to `C:/tmp` were blocked by sandbox `EPERM`, so verification relied on DOM/console checks instead of committed or saved screenshots.
- The sandbox blocked at least one external resource and emitted `ERR_NETWORK_ACCESS_DENIED`; the app route still rendered with HTTP `200`, no framework overlay, and a visible Valuation panel.

Checked routes:

| Route | Mode | Result |
| --- | --- | --- |
| `/workspace?module=valuation` | fallback | rendered; panel visible; unknown-unit warnings visible; no forbidden wording; no zero-fill |
| `/workspace?module=valuation&ticker=FPT` | fallback | rendered; panel visible; unknown-unit warnings visible; no forbidden wording; no zero-fill |
| `/workspace?module=valuation&ticker=FPT` | DB-backed Financials | rendered; `sourceMode:mixed_source`; unknown-unit warnings visible; no forbidden wording; no zero-fill |
| `/workspace?module=valuation&ticker=MWG` | DB-backed Financials | rendered; `sourceMode:mixed_source`; unknown-unit warnings visible; no forbidden wording; no zero-fill |

## 9. Tests Added/Updated

Added:

- `valuation-input-unit-provenance.test.ts`

Updated:

- `controlled-valuation-integration-boundary.test.ts`
- `ControlledValuationCalculationPanel.test.ts`

Covered behavior:

- million/billion VND normalization
- thousand/million shares normalization
- VND-per-share preservation
- unknown unit blocking
- missing value stays null
- no magnitude guessing
- integration blocks unknown equity/shares/revenue/market inputs
- explicit units still allow marketCap, P/E, BVPS, P/B, and P/S
- production approval remains false
- forbidden wording remains absent in helper/panel output

## 10. Non-goals

- No DB write.
- No real BCTC import.
- No official source.
- No Excel/PDF parser.
- No public upload API.
- No external API call.
- No target price.
- No fair value calculation.
- No recommendation.
- No Risk scoring.
- No production source approval.
- No new metric.
- No EV calculation.
- No EV/EBITDA calculation.
- No DCF/WACC calculation.

## 11. Limitations

- Existing local/sample/persisted Valuation data does not yet carry explicit unit metadata.
- When unit metadata is missing, controlled Valuation metrics may remain `insufficient_data`.
- Future source-specific import/runtime contracts should attach units at ingestion or adapter boundaries.
- The panel does not yet show a dedicated unit column; unit uncertainty is surfaced through boundary warnings and unavailable statuses.

## 12. Next Recommended Phase

Recommended Phase 64: Financials Import Unit Metadata Contract.

Maximum safe scope:

- attach explicit units to Financials runtime snapshots and persisted valuation bridge inputs;
- add source-specific unit tests for local/research/sample data;
- keep `productionApproved:false`;
- do not add new metrics;
- do not calculate EV, DCF, or fair value range.

## 13. Phase 64 Follow-up

Phase 64 adds `FINANCIALS_IMPORT_UNIT_METADATA_CONTRACT.md`. Financials runtime data now carries a `unitMetadata` sidecar for the import-owned numeric fields. Current local/research/sample values without explicit source units remain `unit:"unknown"`, so the Phase 63 Valuation normalization boundary continues to block scale-sensitive metrics instead of guessing magnitude.

## 14. Phase 65 Follow-up

Phase 65 adds `SOURCE_SPECIFIC_FINANCIALS_IMPORT_UNIT_CAPTURE.md`. CSV dry-run rows can now carry explicit import units into accepted row metadata, and pure tests confirm those units can be handed to the Valuation integration boundary. Unknown units still normalize to `null`; DB/runtime persistence of the import sidecar is deferred.
