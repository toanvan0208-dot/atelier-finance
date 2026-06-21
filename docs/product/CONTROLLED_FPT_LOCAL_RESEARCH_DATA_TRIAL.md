# Controlled FPT Local Research Data Trial

## 1. Phase Purpose

Phase 78 validates a controlled local research financial statement data trial for one ticker, `FPT`, before any future real CSV write trial.

The trial proves that a tiny inline FPT fixture can pass pre-write validation only when ticker, period, basis, source/evidence metadata, values, and explicit unit metadata are all valid.

## 2. Why One Ticker Only

One ticker limits mapping risk and keeps the trial focused on pre-write validation. Phase 78 does not attempt multi-issuer reconciliation, ticker alias mapping, exchange conflict handling, or production ingestion.

## 3. Trial Scenario Identity

- ticker: `FPT`
- scenario: `phase78_fpt_local_research_financial_statement_trial`
- period: `2024`
- periodType: `annual`
- basis: `consolidated`
- fixture type: inline test-only local research fixture

No raw CSV file is created or committed.

## 4. Data Mode And Source Approval Boundary

- dataMode: `research_only`
- productionApproved: `false`
- source approval added: no
- source status: not approved

The fixture is not official, not realtime, not source-approved, and not for investment decision use.

## 5. Required Fields

The trial uses only fields already supported by the current Financials unit contract:

```text
revenue
netIncome
eps
totalAssets
equity
totalDebt
currentAssets
currentLiabilities
operatingCashFlow
sharesOutstanding
```

Unsupported source candidates such as `grossProfit`, `totalLiabilities`, and `capitalExpenditure` remain blocked until a later contract/schema review maps them safely.

## 6. Required Unit Metadata

Each row must include an explicit accepted unit:

- currency fields: `vnd`, `thousand_vnd`, `million_vnd`, or `billion_vnd`
- `eps`: `vnd_per_share`
- `sharesOutstanding`: `shares`, `thousand_shares`, or `million_shares`

Missing unit, `unknown`, or invalid unit blocks pre-write validation. Units are never inferred from numeric magnitude.

## 7. Required Source/Evidence Metadata

Each row must carry:

```text
sourceLabel
sourceOwner
sourceDocumentRef
asOf
dataMode
productionApproved
evidenceNote
basis
```

For Phase 78 the source document reference is an inline fixture marker, not a raw CSV file.

## 8. Pre-write Validation Gates

The trial helper checks:

- ticker is `FPT`;
- period is `2024`;
- period type is valid;
- statement type is valid;
- basis is present and not mixed;
- field is supported;
- value is present;
- unit is explicit and accepted for the field;
- source/evidence metadata is present;
- `productionApproved` is false;
- duplicate row keys are blocked.

## 9. Missing/Invalid Behavior

Missing values remain `null` and block draft mapping. They are not converted to `0`.

Missing units, invalid units, unsupported fields, missing basis, mixed basis, missing evidence, duplicate rows, and production-approved claims all fail closed before any future write.

## 10. productionApproved:false Rule

Local research/manual/user-provided data remains `productionApproved:false`. Passing pre-write validation does not approve a source and does not make data production-ready.

## 11. Financials-to-Valuation Handoff Boundary

Valid trial rows can map to a draft/write-intent object with `unitMetadata` and valuation unit handoff fields. This draft is not written to DB.

Valuation can consume only fields with valid explicit units. Financials DB-backed data still does not imply Valuation is fully DB-backed. Missing or invalid units keep unit-sensitive valuation calculations unavailable or insufficient.

## 12. What Was Not Done

- Real CSV import performed: no.
- Raw CSV committed: no.
- DB write performed: no.
- Migration/schema changed: no.
- External API/Vnstock used: no.
- Source approval added: no.
- Browser UI changed: no.
- New financial or valuation metric added: no.
- Recommendation, target price, fair value, or Risk scoring added: no.

## 13. Validation Results

Focused test:

```text
npx vitest run src/features/financials/lib/__tests__/fpt-local-research-data-trial.test.ts
```

Coverage includes one-ticker identity, source/evidence metadata, valid pre-write pass, missing/invalid unit fail-closed, missing value no zero-fill, unsupported field block, basis handling, duplicate handling, draft/write-intent mapping, unit metadata handoff, Valuation boundary, no exposed parser/import/write function, and no recommendation/target/fair-value/Risk-scoring output.

## 14. Future Phase 79 Recommendation

Phase 79 should remain dry-run first. It may validate a real user-provided FPT CSV only if the file stays outside the repo, required source/evidence metadata is complete, explicit units are present for every supported field, no source approval is claimed, and pre-write validation passes.

No real DB write should occur until a later reviewed phase explicitly approves the write trial boundary.
