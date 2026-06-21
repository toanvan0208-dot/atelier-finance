# Valuation Controlled Display Evidence Hardening

## 1. Phase 62 Summary

Phase 62 is a hardening and evidence pass after Phase 61's controlled Valuation UI read-only display.

No new metric was added. No large calculation path was changed. The goal was to audit the Valuation controlled panel, confirm source-boundary visibility, verify browser-visible wording, and record evidence for fallback plus local DB-backed Financials modes.

## 2. Files Audited

Code and tests:

- `src/features/valuation/components/ValuationPage.tsx`
- `src/features/valuation/components/ControlledValuationCalculationPanel.tsx`
- `src/features/valuation/components/__tests__/ControlledValuationCalculationPanel.test.ts`
- `src/features/valuation/lib/controlled-valuation-calculation.ts`
- `src/features/valuation/lib/controlled-valuation-integration-boundary.ts`
- `src/features/valuation/lib/valuation-financials-runtime-consumption.ts`
- `src/features/valuation/lib/valuation-financials-runtime-readiness.ts`
- `src/features/valuation/index.ts`
- `src/app/workspace/page.tsx`
- `src/components/layout/AppShell.tsx`

Docs:

- `docs/product/CONTROLLED_VALUATION_UI_READ_ONLY_DISPLAY_BOUNDARY.md`
- `docs/product/CONTROLLED_VALUATION_HELPER_INTEGRATION_BOUNDARY.md`
- `docs/product/CONTROLLED_VALUATION_CALCULATION_HELPER.md`
- `docs/product/CROSS_MODULE_RUNTIME_CONSUMPTION_BROWSER_VERIFICATION.md`
- `docs/product/PRODUCTIZATION_STATUS_AFTER_PHASE_29.md`
- `docs/product/SOURCE_EVIDENCE_RECORDS.md`

## 3. Files Changed

Docs only:

- `docs/product/VALUATION_CONTROLLED_DISPLAY_EVIDENCE_HARDENING.md`
- cross-reference updates in the existing Valuation/productization/source evidence docs

Code changed: no.

Tests changed: no.

## 4. Browser Verification

Browser path:

- In-app Browser plugin was available and used.
- Browser runtime Playwright APIs were used for DOM checks, console checks, and screenshots.
- Screenshots were saved under `C:/tmp` and were not committed.

| Route | Mode | Rendered | Panel visible | Source boundary visible | Blocked metrics visible | Forbidden wording found | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/workspace?module=valuation` | fallback | yes | yes | yes | yes | none | `sourceMode:sample_fallback`; persisted bridge warnings visible |
| `/workspace?module=valuation&ticker=FPT` | fallback | yes | yes | yes | yes | none | `sourceMode:sample_fallback`; persisted bridge warnings visible |
| `/workspace?module=valuation&ticker=FPT` | DB-backed Financials | yes | yes | yes | yes | none | `sourceMode:mixed_source`; runtime EPS and shares warnings visible |
| `/workspace?module=valuation&ticker=MWG` | DB-backed Financials | yes | yes | yes | yes | none | `sourceMode:mixed_source`; runtime revenue, EPS, and shares warnings visible |

No console warnings or errors were observed in the checked routes. No framework error overlay was observed.

## 5. Fallback Mode Result

Environment:

- no `ATELIER_FINANCIALS_DB_SOURCE`
- `http://localhost:3101`

Routes:

- `/workspace?module=valuation`
- `/workspace?module=valuation&ticker=FPT`

Result:

- page rendered with HTTP navigation success
- controlled Valuation panel visible
- `sourceMode:sample_fallback` visible
- `productionApproved:false` visible
- `canClaimValuationDbBacked:false` visible
- EV, EV/EBITDA, DCF, and fair value range visible as blocked
- no forbidden browser-visible wording found
- no zero-fill observed for non-ready values

## 6. DB-backed Financials Mode Result

Environment:

- `DATABASE_URL=file:./dev.db`
- `ATELIER_FINANCIALS_DB_SOURCE=enabled`
- `http://localhost:3102`

Routes:

- `/workspace?module=valuation&ticker=FPT`
- `/workspace?module=valuation&ticker=MWG`

Result:

- page rendered with HTTP navigation success
- controlled Valuation panel visible
- `sourceMode:mixed_source` visible
- `productionApproved:false` visible
- `canClaimValuationDbBacked:false` visible
- local/research-only warning visible where applicable
- persisted bridge fallback warnings visible where runtime fields were missing
- EV, EV/EBITDA, DCF, and fair value range visible as blocked
- no forbidden browser-visible wording found
- no zero-fill observed for non-ready values

## 7. Missing/null Behavior

FPT DB-backed route:

- runtime EPS and shares outstanding were missing and surfaced as `runtime_eps_missing_used_persisted_bridge` and `runtime_shares_outstanding_missing_used_persisted_bridge`
- panel remained `mixed_source`
- no missing/non-ready metric was rendered as `0`
- small positive BVPS rendered as `0.000002`, not `0`

MWG DB-backed route:

- runtime revenue, EPS, and shares outstanding were missing and surfaced as persisted-bridge fallback warnings
- panel remained `mixed_source`
- no missing/non-ready metric was rendered as `0`
- small positive BVPS rendered as `0.000001`, not `0`

Current behavior note:

- Some allowed metrics can still be `ready` when missing runtime fields are supplied by the persisted Valuation bridge.
- The UI surfaces this as `mixed_source` plus field-level persisted-bridge warnings.
- This is not a full Valuation DB-backed claim.

## 8. Source Boundary Result

Confirmed visible:

- `sourceMode`
- `productionApproved:false`
- `canClaimValuationDbBacked:false`
- `sourceMode:mixed_source` in DB-backed Financials mode
- persisted bridge warnings for runtime-missing fields
- local/research-only not-production-approved warning

Financials DB-backed status did not become a Valuation DB-backed production claim.

## 9. Blocked Metrics Result

Confirmed blocked in browser-visible panel:

- EV
- EV/EBITDA
- DCF
- fair value range

All blocked metrics showed `unavailable` values and blocked helper reasons.

## 10. Forbidden Wording Scan

Browser-visible forbidden wording result:

- no unsafe browser-visible hits in the four checked Valuation routes

Source/docs scan result:

- safe negative-context hits remain in tests and docs where forbidden strings are denied or documented as blocked
- non-Valuation educational/source copy still contains some words such as `hấp dẫn`, `rẻ`, or `đắt`, but these were not browser-visible in the checked Valuation routes
- `fair value range` appears as the explicitly blocked metric label and blocked reason

Representative commands:

```powershell
rg -n "controlled valuation|Controlled valuation|productionApproved:false|canClaimValuationDbBacked|fair value range|upside|downside|rẻ|đắt|hấp dẫn|đáng mua|giá mục tiêu|mục tiêu giá" src/features/valuation src/config/aiTutor.config.ts src/components/layout/RightAssistantPanel.tsx -S
```

Browser checks used a forbidden list containing:

- buy/sell/hold style wording
- cheap/expensive/attractive wording
- target-price wording
- upside/downside wording
- official/realtime/production-ready wording

## 11. Issues Found and Fixes

No UI/source overclaim issue found.

No code fix was applied in Phase 62.

## 12. Non-goals

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

## 13. Final Result

Result: pass.

Recommended next phase: Phase 63 should focus on controlled unit/provenance normalization for Valuation inputs before expanding any displayed calculation surface. Maximum scope should be input-unit evidence, selected-input provenance display or tests, and no new metric/EV/DCF/fair-value output.

## 14. Phase 63 Follow-up

Phase 63 implements the recommended unit/provenance normalization step in `VALUATION_INPUT_UNIT_PROVENANCE_NORMALIZATION.md`. Unknown units now block scale-sensitive controlled Valuation calculations instead of being inferred from raw numbers.

## 15. Phase 64 Follow-up

Phase 64 adds `FINANCIALS_IMPORT_UNIT_METADATA_CONTRACT.md`. The Financials runtime sidecar now records missing, unknown, explicit, or invalid units for import-owned fields and passes the Valuation-relevant units into the controlled Valuation boundary. Existing local/research/sample data still has unknown units unless explicitly supplied by a source, so prior browser evidence remains directionally unchanged for visible Valuation output.

## 16. Phase 65 Follow-up

Phase 65 adds `SOURCE_SPECIFIC_FINANCIALS_IMPORT_UNIT_CAPTURE.md`. Browser evidence is not refreshed because Phase 65 only changes parser/import dry-run contracts and tests; runtime DB persistence and visible Valuation output remain unchanged.

## 17. Phase 66 Follow-up

Phase 66 adds `FINANCIALS_UNIT_METADATA_PERSISTENCE_READBACK_BOUNDARY.md`. The phase remains non-UI: it validates payload/read-back and runtime handoff behavior in tests, while visible Valuation browser output remains unchanged.

## 18. Phase 70 Follow-up

Phase 70 adds `MARKET_PVT_UNIT_METADATA_CONTRACT.md`. The display evidence remains valid because Phase 70 changes helper/types/tests/docs and the controlled Valuation integration boundary only; it does not change browser-visible Valuation UI behavior.

Market/PVT inputs with missing or invalid units keep dependent metrics unavailable, and the display remains non-production-approved with no recommendation, target price, EV, DCF, or fair-value output.

## 19. Phase 71 Follow-up

Phase 71 adds `VALUATION_UNIT_AWARE_READY_METRICS_BROWSER_VERIFICATION.md`. In-app Browser verification covered baseline Valuation routes and a synthetic explicit-unit route. The controlled panel rendered ready marketCap, P/E, BVPS, P/B, and P/S only for explicit-unit inputs, while EV, EV/EBITDA, DCF, and fair value range stayed blocked.

No browser-visible forbidden wording, framework overlay, console error, source overclaim, or zero-fill issue was found.
