# Phase 149R - GLOBAL_FLOW Definition Decision

## Phase Objective

Decide the product definition and acquisition path for `GLOBAL_FLOW` before any data ingestion.

This phase intentionally does not:

- write DB rows,
- fetch provider data,
- import CSV files,
- create `MacroObservation` or `MacroObservationProvenance`,
- populate `GLOBAL_FLOW`,
- expand the frontend-locked indicator universe,
- set `productionApproved=true`.

## Starting Commit

`5169a19f333f69f0cb0731cc3785adf37d68134a`

## Commands Run

Preflight:

```text
git status --short
git diff --stat
git diff
git show --stat --name-only HEAD
git log --oneline -12
```

Validation and smoke:

```text
node scripts/run-staging.mjs npx prisma validate
node scripts/run-staging.mjs npx prisma generate
node scripts/run-staging.mjs npx prisma migrate status
node scripts/run-staging.mjs npm run typecheck
node scripts/run-staging.mjs npm run build
node scripts/run-staging.mjs npm run lint
node scripts/run-staging.mjs npx eslint scripts/smoke-global-flow-definition-decision.ts
node scripts/run-staging.mjs npx tsx scripts/smoke-global-flow-definition-decision.ts
```

## Files Changed

- `docs/product/evidence/PHASE149R_GLOBAL_FLOW_DEFINITION_DECISION.md`
- `docs/product/MACRO_PARSER_STRATEGY.md`
- `docs/product/MACRO_TO_INDUSTRY_AND_ASSISTANT_BOUNDARIES.md`
- `docs/product/MACRO_DATA_PRODUCTION_READINESS_GATES.md`
- `scripts/smoke-global-flow-definition-decision.ts`

## Current Macro Coverage State After 149Q

Phase 149Q confirmed 13 of 14 frontend-locked indicators have DB observations/provenance/runtime/Assistant coverage.

Available / DB-backed or candidate-backed indicators:

- `FED_FUNDS_RATE`
- `DXY`
- `BRENT_OIL_PRICE`
- `GDP_GROWTH`
- `CPI_YOY`
- `USD_VND`
- `EXPORT_GROWTH`
- `PUBLIC_INVESTMENT`
- `CREDIT_GROWTH`
- `FOREIGN_NET_FLOW`
- `PMI_MANUFACTURING`
- `POLICY_RATE`
- `MARKET_TRADING_VALUE`

Remaining unresolved:

- `GLOBAL_FLOW`

## GLOBAL_FLOW Options Considered

### 1. `global_equity_fund_flow`

Meaning: net flow into/out of global equity funds.

Pros:

- Broadly describes global allocation pressure.
- Easier for users to understand as external capital movement.

Cons:

- Too broad for Vietnam context.
- Developed-market flows may dominate and reduce relevance to Vietnam.
- Source may require paid/permissioned fund-flow data.

Source feasibility:

- Requires a documented provider or a manual aggregation source with quoted publication evidence.
- No stable source is selected in this phase.

Frequency:

- Monthly preferred; weekly possible only if source terms and methodology are stable.

UI label if chosen:

- `Dòng vốn quỹ cổ phiếu toàn cầu`

Caveat:

- Broad global equity fund flow is context only and may not map cleanly to Vietnam.

Decision:

- Rejected for now because it is too broad relative to the current macro module's Vietnam-oriented interpretation needs.

### 2. `emerging_market_equity_fund_flow`

Meaning: net flow into/out of emerging-market equity funds.

Pros:

- More relevant to Vietnam than total global equity fund flow.
- Communicates external risk appetite toward markets closer to Vietnam's classification.
- Avoids overlapping with existing `DXY` and rate/commodity indicators.
- Can be represented with clear positive/negative value semantics.

Cons:

- May still be based on third-party or manually aggregated publications.
- Source licensing and methodology must be checked before any production approval.
- Does not directly measure Vietnam-specific foreign flow, which is already covered separately by `FOREIGN_NET_FLOW`.

Source feasibility:

- Candidate path is manual CSV first, using cited publications/source URLs and extracted quotes.
- A documented provider path can be used later only if the source is stable and clearly licensed.

Frequency:

- Monthly preferred; weekly allowed only if source stability is documented.

UI label:

- `Dòng vốn quỹ thị trường mới nổi`

Caveat:

- External capital-flow context indicator, not a trading signal.

Decision:

- Chosen.

### 3. `etf_flow_proxy`

Meaning: net flow into/out of selected ETF(s), such as EM ETF or Vietnam ETF.

Pros:

- More accessible if ETF issuer data is downloadable.
- Can be concrete if a single fund or basket is explicitly selected.

Cons:

- Proxy risk is high.
- One ETF or a small ETF basket may not represent broad emerging-market fund flow.
- Vietnam ETF flows would overlap with, but not equal, market-wide foreign flow.
- Requires explicit proxy labeling in UI and Assistant.

Source feasibility:

- Feasible only after selecting exact ETF(s), source pages/downloads, and methodology.

UI label if chosen:

- `Dòng vốn ETF proxy`

Caveat:

- Proxy only; not official global or emerging-market fund-flow data.

Decision:

- Rejected for Phase 149R because it would require a separate product decision about which ETF(s) represent the indicator.

### 4. `risk_on_risk_off_proxy`

Meaning: proxy built from VIX, DXY, financial conditions, liquidity, or similar variables.

Pros:

- Often easier to source from public APIs.
- Useful for global market regime context.

Cons:

- Semantic overlap with existing `DXY / Sức mạnh USD`.
- Not actually fund flow.
- Easy to misread as a signal if the label remains `GLOBAL_FLOW`.
- Would require a different UI label and methodology.

Source feasibility:

- Feasible only after product owner explicitly chooses a proxy definition.

UI label if chosen:

- `Bối cảnh risk-on/risk-off toàn cầu`

Caveat:

- Proxy, not fund flow.

Decision:

- Rejected for Phase 149R. Do not substitute DXY/VIX or other existing indicators unless the product owner explicitly chooses a risk-on/risk-off proxy in a future phase.

## Chosen Definition

```text
indicatorCode=GLOBAL_FLOW
productDefinition=Emerging-market equity fund net flow.
definitionKey=emerging_market_equity_fund_flow
displayLabel=Dòng vốn quỹ thị trường mới nổi
unit=usd_billion
period_type=monthly preferred; weekly allowed only if source is stable
scope=Emerging markets
flow_type=emerging_market_equity_fund_flow
positiveValue=net inflow
negativeValue=net outflow
```

## Future Acquisition Path

Preferred path:

1. Use manual CSV first, with source URL, publication date, extracted quote, and notes per row.
2. Keep every future row as candidate data:
   - `productionApproved=false`
   - `needsReview=true`
3. Use `sourceType=manual_aggregated_global_flow_candidate`.
4. If a stable documented provider is later selected, use `sourceType=documented_provider_global_flow_candidate`.
5. Do not populate `GLOBAL_FLOW` from DXY/VIX/liquidity/risk proxy unless a future product decision changes the definition.

Future manual CSV schema:

```csv
period,period_type,global_flow_value,unit,definition,scope,flow_type,source_name,source_url,publication_date,extracted_quote,notes
```

Expected row contract:

```text
period_type=monthly
unit=usd_billion
scope=Emerging markets
flow_type=emerging_market_equity_fund_flow
definition=Emerging-market equity fund net flow.
```

Required caveat:

```text
This is an external capital-flow context indicator, not a trading signal.
```

If an ETF/proxy source is used in a future phase:

```text
UI and Assistant must clearly say proxy.
```

## Guardrails

```text
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
globalFlowPopulated=false
frontendIndicatorUniverseExpanded=false
productionApprovedTrueCount=0
mockOrSampleAsReal=false
fallbackAsReal=false
missingDataZeroFilled=false
investmentAdviceAdded=false
```

## Validation Results

```text
npx prisma validate: pass
npx prisma generate: pass
npx prisma migrate status: pass
npm run typecheck: pass
npm run build: pass
npx eslint scripts/smoke-global-flow-definition-decision.ts: pass
npx tsx scripts/smoke-global-flow-definition-decision.ts: pass
npm run lint: fail due to pre-existing/out-of-scope lint debt
```

Smoke result:

```text
dbReadAttempted=true
dbWriteAttempted=false
providerFetchAttempted=false
csvImportAttempted=false
globalFlowObservationCount=0
globalFlowProvenanceCount=0
globalFlowStillUnpopulated=true
frontendIndicatorUniverseExpanded=false
productionApprovedTrueCount=0
smokePassed=true
```

Global lint is not a clean pass. The failures are existing repository-wide lint debt in older scripts/source files and do not list the new Phase 149R smoke file.

## Known Limitations

- No source was selected or fetched in Phase 149R.
- Future acquisition still needs a concrete manual CSV or documented provider source.
- Licensing/methodology review is still required before any production approval gate.

## Next Recommended Phase

Phase 149S should acquire or prepare `GLOBAL_FLOW` candidate rows using the selected definition:

- preferred: manual CSV with cited source evidence,
- alternate: documented provider source if stable and reviewable,
- no DB write until parser/manual dry-run and eligibility audit pass.

## Commit

Phase 149R commit is the final `HEAD` commit for this evidence file; the exact hash is recorded in the final report and `git log`.
