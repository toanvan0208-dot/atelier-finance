# Financials Data Source Transparency UI Readiness

Phase: 83

## 1. Phase Purpose

Phase 83 adds a UI-safe Financials transparency/readiness model and wires it into the existing Financials source transparency card.

The goal is clarity only. Users can see the Financials data mode, source/evidence state, `productionApproved:false`, unit metadata readiness, missing fields, blocked reasons, and the Valuation handoff boundary without adding a new ingestion path.

## 2. Why Phase 83 Follows Phase 82

Phase 82 proved that a tiny inline CSV string can pass through the parser boundary and a Prisma temp DB write/read-back trial with explicit sidecar unit metadata. After that backend evidence, the product needed a clearer browser-facing explanation of what the Financials module is using and what downstream modules may or may not claim.

Phase 83 does not extend the parser or write path. It only translates existing runtime metadata into a stable UI/readiness model.

## 3. UI/Readiness Scope

Implemented scope:

- `src/features/financials/lib/financials-data-source-transparency.ts`
- `src/features/financials/components/FinancialsSourceTransparency.tsx`
- focused helper and component tests
- cross-reference documentation

The existing Financials card now displays:

- normalized transparency data mode;
- source/evidence status;
- unit metadata status;
- missing important Financials fields;
- blocked reasons;
- Financials DB-backed boundary flag;
- Valuation handoff readiness;
- `canClaimValuationDbBacked:false`.

## 4. Data Source Transparency Model

The helper builds:

```ts
type FinancialsDataSourceTransparency = {
  dataMode: "sample" | "research_only" | "local_research" | "manual" | "db_backed" | "unknown";
  productionApproved: boolean;
  sourceLabel: string | null;
  sourceOwner: string | null;
  sourceEvidenceStatus: "available" | "partial" | "missing" | "not_approved";
  unitMetadataStatus: "explicit" | "partial" | "unknown" | "invalid";
  missingFields: string[];
  blockedReasons: string[];
  valuationHandoffStatus: "ready_with_explicit_units" | "partial" | "blocked" | "not_applicable";
  canClaimFinancialsDbBacked: boolean;
  canClaimValuationDbBacked: boolean;
  uiWarnings: string[];
};
```

`canClaimFinancialsDbBacked` can be true only for the existing local DB Financials runtime boundary. `canClaimValuationDbBacked` remains false because Valuation has its own source and calculation boundary.

## 5. `productionApproved:false` Behavior

Local, research-only, manual, sample, and current DB-backed Financials runtime states remain `productionApproved:false`.

The UI-safe warnings explicitly include `productionApproved:false` and avoid language that would imply a reviewed source approval state. A DB-backed read path is shown as a Financials runtime boundary, not as a downstream module approval.

## 6. Unit Metadata Readiness

The helper evaluates existing `FinancialsUnitMetadataMap`:

- `explicit`: every present important field has explicit valid unit metadata;
- `partial`: some present fields are explicit, but not all;
- `unknown`: present fields lack explicit units;
- `invalid`: any present field has invalid unit metadata.

Missing or invalid units block Valuation handoff readiness. Units are not inferred from numeric magnitude.

## 7. Missing Fields Behavior

Missing important fields are collected from runtime `dataQuality.missingFields` plus null snapshot values for the Financials unit-contract fields.

Missing values remain missing/null/unavailable. Phase 83 adds no zero-fill behavior and no new metric calculation.

## 8. Valuation Handoff Boundary

Valuation handoff can reach `ready_with_explicit_units` only when available Valuation-relevant Financials fields have explicit valid units and Financials data quality is available.

The helper still returns `canClaimValuationDbBacked:false`. Financials DB-backed availability does not make Valuation DB-backed, because Valuation has separate market input ownership and source/calc boundaries.

## 9. Browser-Visible Wording Guardrails

The UI warnings are tested to avoid recommendation, target-price, fair-value, DCF, EV/EBITDA, trading-signal, risk-scoring, `upside`, `downside`, and production-ready wording.

The browser-facing card uses neutral readiness/status copy and explicit machine-readable flags such as `productionApproved:false` and `canClaimValuationDbBacked:false`.

## 10. What Was Not Done

- Real CSV import performed: no
- Filesystem CSV reading: no
- General importer added: no
- DB write performed: no
- Migration/schema changed: no
- External API/vnstock used: no
- Excel/PDF parser added: no
- Public upload UI/API added: no
- productionApproved source approval added: no
- Browser-visible recommendation/target/fair-value wording added: no

## 11. Validation Results

Initial focused validation:

- `npx vitest run src/features/financials/lib/__tests__/financials-data-source-transparency.test.ts`: passed
- `npx vitest run src/features/financials/components/__tests__/FinancialsPage.runtime-boundary.test.ts`: passed before doc updates

Final validation commands are recorded in the Phase 83 final report.

## 12. Browser Verification Results

Browser verification is required because Phase 83 changes Financials browser-visible UI. Results are recorded in the final report after full validation.

## 13. Future Phase 84 Recommendation

Phase 84 should review the Valuation-side displayed runtime note against the same transparency model and decide whether to share a small status vocabulary across Financials, Valuation, Overview, and Risk while keeping each module's source boundary separate.

## 14. Phase 85 Browser Polish and Evidence Alignment

Phase 85 keeps the Phase 83 transparency model but makes the Financials source card easier to read in the browser.

The card now adds a compact summary for:

- data mode;
- source/evidence state;
- unit metadata readiness;
- Valuation handoff readiness.

The detailed machine-readable flags remain visible, including `productionApproved:false`, `unitMetadataStatus`, missing fields, blocked reasons, and `canClaimValuationDbBacked:false`.

Blocked reasons are displayed in a readable form while preserving their underlying guardrail meaning. Missing fields remain listed as field names and are not converted to `0`.

Phase 85 does not add ingestion, filesystem CSV reading, DB writes, schema changes, external API/Vnstock calls, upload UI/API, source approval, or new metrics.

Browser verification on 2026-06-21 checked `/workspace?module=financials` and `/workspace?module=valuation` with the in-app Browser. Both routes loaded without framework overlay or console errors. Financials showed `productionApproved:false`, data mode/source evidence/unit metadata/Valuation handoff summary cards, missing fields, readable blocked reasons, and `canClaimValuationDbBacked:false`. Valuation showed its mixed/controlled runtime boundary, `productionApproved:false`, and `canClaimValuationDbBacked:false`. No forbidden browser-visible wording was found in the checked routes.

Phase 86 follows this boundary from the Valuation side. Financials remains the owner of Financials runtime transparency, while Valuation explains its own mixed/partial source state, required input units, blocked/not-applicable reasons, and `canClaimValuationDbBacked:false`.
