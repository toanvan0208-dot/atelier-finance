# Data Quality And Legal Checklist

Date: 2026-06-17

Phase: 26B - Data Documentation Alignment

This checklist must be completed before Atelier Finance moves any dataset from sample/static mode into real-data product mode. It applies to future adapters, API responses, database imports, AI/RAG context, DataQualityBanner surfaces, and any user-facing module that displays financial or market data.

## 1. Data Quality Gate

### Source and attribution

- [ ] Every dataset has `sourceName`.
- [ ] Every dataset has `sourceUrl` or a documented internal/licensed source ID.
- [ ] Every field group identifies whether it is official, exchange, licensed vendor, company disclosure, curated internal, user input, or unknown.
- [ ] User-provided assumptions are labeled as `user_input`.
- [ ] Sample/mock data is labeled with `isMockData = true`.
- [ ] No module claims live/realtime/verified data unless the source contract allows it.

### Time and period integrity

- [ ] Record-level `asOf` is present for displayed data.
- [ ] `collectedAt` is present for imported data.
- [ ] Price/OHLCV records have `tradingDate`, source, `asOf`, collected time, currency, unit, and adjusted/unadjusted flag.
- [ ] Financial statement data has `fiscalYear`, `periodType`, and `fiscalQuarter` when applicable.
- [ ] Financial statement records have `reportDate`, `publishedDate` when available, source, `asOf`, collected time, currency, and unit.
- [ ] Market data has `tradingDate`.
- [ ] Macro records have indicator period, period type, release date when available, source, and `asOf`.
- [ ] Industry taxonomy records have classification version and review/as-of date.
- [ ] Industry metric records have peer-set definition, period, source, unit, and `asOf`.
- [ ] Stale data is detected and marked with `STALE_DATA` or equivalent.
- [ ] TTM values state their construction method and source periods.

### Missing data handling

- [ ] Missing values are represented as `null`, `not_available`, `insufficient_data`, or `not_applicable`.
- [ ] Missing values are never represented as `0`, `"0"`, `false`, `"none"`, or blank strings in normalized output.
- [ ] Missing fields are listed in `missingFields`.
- [ ] Metrics that lack required inputs return `null` or `not_applicable`.
- [ ] Each module has a readiness gate that lists required fields.
- [ ] Missing required fields move the affected module/view/calculation to `insufficient_data`.
- [ ] Optional fields can be missing without blocking the module, but must lower confidence when they affect interpretation.
- [ ] UI and AI responses explain important missing fields when they affect interpretation.

### Numeric validity

- [ ] No calculation divides by `0`.
- [ ] Negative or zero denominators are handled explicitly.
- [ ] Price fields are not negative.
- [ ] `highPrice >= lowPrice` when both exist.
- [ ] `closePrice` is checked against high/low when all three exist.
- [ ] Volume and trading value are not negative.
- [ ] Financial statement sign conventions are documented, especially cash-flow and capex fields.
- [ ] Units are normalized before calculation.
- [ ] Currency is explicit when values are monetary.

### Duplicate and reconciliation checks

- [ ] Duplicate market rows by `ticker + tradingDate` are detected.
- [ ] Duplicate financial rows by `ticker + fiscalYear + fiscalQuarter + periodType + reportType` are detected.
- [ ] Duplicate macro rows by `indicatorCode + period + country` are detected.
- [ ] Conflicting duplicate values are flagged instead of silently overwritten.
- [ ] Source priority rules exist before reconciling multiple sources.
- [ ] Every dedupe/reconciliation action is auditable.

### Financial logic guardrails

- [ ] EPS <= 0 makes P/E `not_applicable` for normal cheap/expensive interpretation.
- [ ] Missing EPS blocks P/E.
- [ ] Equity <= 0 makes ROE, P/B, and BVPS `not_applicable` for normal interpretation.
- [ ] Missing equity blocks ROE/P/B/BVPS unless a valid direct field exists.
- [ ] Current Ratio is not interpreted mechanically for banks, securities companies, or insurers.
- [ ] Debt-to-Equity is not interpreted mechanically for banks, securities companies, or insurers.
- [ ] CFO can be negative and must not be forced positive or replaced with `0`.
- [ ] `companyType` is present before applying sector-sensitive ratios.
- [ ] Banks use bank-specific indicators where available, such as P/B, ROE, NIM, NPL, LLR, and CAR.
- [ ] Securities companies use cycle/capital-market caveats; generic industrial leverage and CFO reading is blocked.
- [ ] Insurers use reserve/investment-portfolio caveats; generic industrial leverage and CFO reading is blocked.
- [ ] Risk scores are not presented as final safe/bad conclusions.
- [ ] Valuation outputs are not generated when readiness is `not_ready` or confidence is `unknown`.
- [ ] Fair value ranges are never described as target prices or action instructions.

### Product/UI/AI safety

- [ ] DataQualityBanner receives source, `asOf`, status, and missing fields where relevant.
- [ ] AI/RAG context marks mock/sample data and source issues.
- [ ] AI responses do not invent EPS, equity, CFO, volume, market cap, fair value, WACC, FCFF, news, or sector context.
- [ ] Price Volume Time is framed as observation, not signal.
- [ ] Screening output is framed as candidate filtering, not recommendation.
- [ ] Checklist state is framed as discipline/missing-evidence review, not recommendation.
- [ ] Watchlist state is framed as idea tracking, not recommendation.
- [ ] Simulation state is framed as learning/simulation, not real trading advice.

## 2. Legal And Source-Usage Gate

### License and Terms of Service

- [ ] The source license has been reviewed.
- [ ] Terms of Service have been reviewed.
- [ ] Data ownership is identified when market/exchange data is involved.
- [ ] Use case is classified: internal demo, academic/thesis, public product, or commercial.
- [ ] Public display rights are confirmed before showing data to end users.
- [ ] Commercial rights are confirmed before any commercial/public launch.
- [ ] Attribution requirements are documented.

### Redistribution, caching, and storage

- [ ] Redistribution rights are confirmed.
- [ ] Caching rights are confirmed.
- [ ] Cache duration limits are documented.
- [ ] Database storage rights are documented.
- [ ] Derived-data rights are reviewed for ratios, normalized statements, and aggregate metrics.
- [ ] Downloaded files are not committed into the repo unless license allows it.
- [ ] Source-specific takedown/removal process is documented.

### API and scraping risk

- [ ] Private or undocumented APIs are not used unless risk is reviewed and accepted.
- [ ] Scraping is not used unless ToS allows it or legal risk is explicitly accepted for a limited internal/academic purpose.
- [ ] Rate-limit and retry rules are documented.
- [ ] User-agent and access behavior do not misrepresent the product.
- [ ] API keys, cookies, tokens, and secrets are never committed.
- [ ] Service-role credentials are server-only and never exposed to client code.

### Dataset provenance

- [ ] Every imported dataset records original source.
- [ ] Every transformed dataset records transformation version.
- [ ] Manual edits are tracked with editor/reason/date.
- [ ] User assumptions are separated from source data.
- [ ] Mock fixtures are separated from real data.

## 3. Checklist Before Moving From Sample Data To Real Data

### Documentation readiness

- [ ] `DATA_SOURCE_REGISTRY.md` has an entry for the data group.
- [ ] `DATA_DICTIONARY_MAPPING.md` maps the required fields.
- [ ] This checklist has been completed for the source.
- [ ] Phase 26C Real Data Source Contract defines source metadata, update frequency, stale rules, and allowed usage.
- [ ] API response contract includes `source`, `asOf`, `dataQuality`, `missingFields`, and `warnings`.

### Adapter readiness

- [ ] Adapter does not fallback missing values to `0`.
- [ ] Adapter validates units and currency.
- [ ] Adapter preserves raw source period and normalized period.
- [ ] Adapter emits source metadata.
- [ ] Adapter flags duplicates, stale data, invalid denominators, and source errors.
- [ ] Adapter has tests for null propagation.
- [ ] Adapter has tests for EPS <= 0 and equity <= 0.
- [ ] Adapter has tests for financial-sector caveats.
- [ ] Adapter has rollback behavior when source response changes.

### Database/API readiness

- [ ] Schema allows nullable values where data may be unavailable.
- [ ] Constraints reject impossible values but do not convert missing to `0`.
- [ ] API returns `null` plus warnings for missing data.
- [ ] API does not calculate blocked metrics.
- [ ] API does not return fake fair value or fake target price.
- [ ] API distinguishes sample/mock from real data.
- [ ] API supports stale/source warnings.

### UI/AI readiness

- [ ] DataQualityBanner displays real source status.
- [ ] UI copy does not imply real-time data unless true and licensed.
- [ ] AI prompt context includes source, period, missing fields, and data quality.
- [ ] AI output validator blocks unsafe recommendation, price prediction, fake data, and missing-as-zero behavior.
- [ ] User-facing modules have fallback states for `not_available`, `insufficient_data`, and `stale`.

## 4. Phase 26C Open Gaps

- Define the exact TypeScript data-source contract.
- Define source registry entries and legal status workflow.
- Define stale thresholds per data group.
- Define source priority and dedupe rules.
- Define normalized units and period types.
- Define adapter error taxonomy.
- Define database/API fields for `dataQuality`, `source`, `asOf`, `missingFields`, and `warnings`.
- Decide whether user persistence remains local-only or moves to authenticated backend storage in a later phase.
