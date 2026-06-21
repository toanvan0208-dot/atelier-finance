# Macro/Industry Data Boundary

Phase: 87

## 1. Phase purpose

Phase 87 defines a safe, reusable data boundary for Macro and Industry modules using the compressed prompt pattern from the operating manual.

The phase adds a pure helper and focused tests for field definitions, explicit unit metadata, source/evidence metadata, readiness states, blocked reasons, and future phase gates. It does not productize ingestion.

## 2. Why Macro/Industry use a compressed boundary pattern

Macro and Industry data can influence many beginner-facing modules, so they need the same fail-closed behavior already used by Financials, Market/PVT, and Valuation.

The compressed boundary pattern keeps future prompts short while preserving stable rules:

- source/evidence metadata is required before approval;
- unit metadata must be explicit for unit-sensitive values;
- missing values remain missing and are not converted to `0`;
- local/research/manual/sample data remains `productionApproved:false`;
- future DB-backed state does not imply source approval;
- readiness states explain what is available, partial, or blocked.

## 3. Macro data boundary

Phase 87 defines boundary candidates only. It does not calculate Macro metrics.

Supported Macro field candidates:

- `gdpGrowth`
- `inflation`
- `policyRate`
- `exchangeRate`
- `creditGrowth`
- `moneySupplyGrowth`
- `unemploymentRate`
- `pmi`

Each supported Macro field is unit-sensitive and must carry an accepted explicit unit before downstream usage.

## 4. Industry data boundary

Phase 87 defines Industry boundary candidates only. It does not calculate Industry metrics.

Supported Industry field candidates:

- `industryCode`
- `industryName`
- `revenueGrowth`
- `profitGrowth`
- `grossMargin`
- `inventoryGrowth`
- `exportValue`
- `importValue`
- `sectorIndexLevel`
- `sectorIndexChange`

`industryCode` and `industryName` are not unit-sensitive. The remaining fields require explicit unit metadata.

## 5. Unit metadata requirements

Accepted units:

- `percent`
- `basis_points`
- `vnd_per_usd`
- `index_points`
- `ratio`

Rules:

- missing unit metadata is treated as `unknown_unit`;
- invalid units block unit-sensitive usage;
- numeric magnitude must not be used to guess units;
- unit metadata does not approve the source;
- missing unit metadata must not be silently replaced.

## 6. Source/evidence requirements

Required source/evidence metadata:

- `sourceLabel`
- `sourceOwner`
- `documentReference`
- `termsReviewed`
- `runtimeDisplayApproved`
- `storageApproved`
- `reviewNotes`

If evidence is missing or partial, readiness must be marked missing/partial/not approved and fail closed. Source approval is not added in this phase.

## 7. Period/date rules

Each boundary input requires:

- `period`: the reporting period or observation period;
- `asOf`: the date the boundary state applies to.

Missing period or `asOf` blocks readiness. Future phases can add stricter period-type handling, but Phase 87 does not parse, normalize, or import dates from files.

## 8. Missing/invalid behavior

Rules enforced by the helper/tests:

- missing value remains `null`;
- missing value must not become `0`;
- missing unit blocks unit-sensitive usage;
- invalid unit blocks unit-sensitive usage;
- unknown field blocks readiness;
- magnitude guessing is forbidden;
- source/evidence gaps produce stable blocked reasons.

## 9. productionApproved:false rule

The following data modes remain `productionApproved:false`:

- `local_db_research`
- `research_only`
- `manual`
- `sample`
- `synthetic`
- `future_db_backed`

Future Macro/Industry DB-backed data must not imply production approval. Production approval requires a future source/evidence workflow that is outside Phase 87.

## 10. UI/readiness boundary

Phase 87 does not change UI/browser behavior.

The helper defines readiness states future UI phases can surface:

- `ready_for_boundary_review`
- `partial`
- `blocked`

It also defines stable blocked reasons and a checklist for future UI readiness work. Future UI must keep `productionApproved:false`, missing/partial source state, unit status, and blocked reasons visible where the UI contract exposes them.

## 11. Explicit non-goals

Real macro/industry data imported: no

DB write performed: no

Migration/schema changed: no

External API/vnstock used: no

Parser/importer added: no

UI/browser behavior changed: no

productionApproved/source approval added: no

Recommendation/target/fair value/risk scoring added: no

Additional non-goals:

- no CSV parser;
- no filesystem read;
- no public upload UI/API;
- no web scraping;
- no Excel/PDF parser;
- no new valuation metric;
- no official/realtime/production-approved claim.

## 12. Future phase gates

Future production work remains blocked by default until a future phase explicitly adds and validates:

- source approval workflow;
- schema design;
- parser or adapter design;
- unit metadata persistence;
- UI readiness review;
- production ingestion approval.

The helper exposes these as future gates and does not enable production ingestion by default.

## 13. Validation results

Focused validation:

```bash
npx vitest run src/features/macro/lib/__tests__/macro-industry-data-boundary.test.ts
```

Result: passed, 1 file, 13 tests.

Full validation is recorded in the Phase 87 final report.

## 14. Phase 88 UI skeleton follow-up

Phase 88 adds a browser-visible readiness skeleton in `MACRO_INDUSTRY_READINESS_UI_SKELETON.md`. The Phase 87 boundary remains unchanged: no real import, DB write, schema/migration, parser, filesystem read, external API/Vnstock call, source approval, recommendation, target, fair value, risk scoring, or production claim is added.
