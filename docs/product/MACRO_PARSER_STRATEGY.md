# Macro Parser Strategy

## Purpose
This document outlines the strategy for building parsers to fetch data for the frontend-locked macro indicators. Not all sources have clean APIs. This strategy dictates which sources can be automated via HTML scraping, which have clean APIs, and which must remain manual.

## Parser Feasibility Classification (Phase 148D)
All manual-review indicators from Phase 148C have been classified:

### 1. High Priority Candidates (Phase 148H Targets)
These indicators have feasible data paths and are domestic/critical. In Phase 148G, a real-source parser dry run was attempted using verified URLs for `USD_VND` and `INTERBANK_RATE_OVERNIGHT`, which failed gracefully due to unstable SBV HTML. In Phase 148H, the source was inspected for stable endpoints:
- `USD_VND` (SBV HTML): Inspected, HTML highly unstable. Identified alternate source: **Vietcombank Exchange Rate XML API** -> `api_ready` -> Eligible for parser dry-run.
- `INTERBANK_RATE_OVERNIGHT` (SBV HTML): Inspected, HTML heavily JS-rendered. No stable alternate API found -> `manual_review_only` -> **Blocked** from automated parser. (Note: Phase 148I evaluated its semantic fit for the frontend "Lãi suất trong nước" card. In Phase 148J, `POLICY_RATE` was selected as the new representative indicator. `INTERBANK_RATE_OVERNIGHT` is no longer in the frontend scope).
- `POLICY_RATE` (SBV HTML): Selected as the representative indicator for "Lãi suất trong nước" in Phase 148J. In Phase 148K, the SBV source URL was verified to be highly dynamic (Liferay/Oracle ADF). -> `manual_review_only` -> **Blocked** from automated parser. In Phase 148L, the manual review workflow was documented and the unavailable state for this indicator was hardened across UI and Assistant.
- `MARKET_TRADING_VALUE` (Market API): Examined in Phase 148M. API is undocumented (e.g., vnstock). -> `source_assessment_needed` -> **Blocked** from automated parser dry-run until a formal endpoint is established. In Phase 148N, undocumented provider boundary was finalized, securing it in a hardened unavailable state.
- `FOREIGN_NET_FLOW` (Market API): Examined in Phase 148M. API is undocumented (e.g., vnstock). -> `source_assessment_needed` -> **Blocked** from automated parser dry-run until a formal endpoint is established. In Phase 148N, undocumented provider boundary was finalized, securing it in a hardened unavailable state.
- `FED_FUNDS_RATE`, `DXY`, `BRENT_OIL_PRICE` (FRED API): Examined in Phase 148O/P. API requires authentication key (`auth_required`). -> `source_assessment_needed`. The label for DXY was changed to "Sức mạnh USD" to mitigate semantic risk with the DTWEXBGS proxy. In Phase 148Q, a guarded dry-run was successfully executed to fetch and parse candidate rows using the API key, proving parser readiness. Ready for confirm-write phase.

Due to the complex structure of the SBV site, `USD_VND` will transition to using an alternate XML API in the next parser dry-run phase, while `INTERBANK_RATE_OVERNIGHT` will require a manual workflow or paid provider.

### Phase 149B Vietnam Batch Readiness
- `USD_VND`: alternate VCB XML API reachable (HTTP 200, `text/xml; charset=utf-8`). No numeric values extracted. `readyForParserDryRun=true`, pending semantic/product review before any DB write because VCB rate may differ from SBV central rate.
- `EXPORT_GROWTH`: GSO remains a plausible official candidate, but the repo has no concrete URL. `sourceUrlStatus=missing_source_url`, `readyForParserDryRun=false`.
- `CREDIT_GROWTH`: blocked until a concrete official SBV/source URL and exact definition are selected. Do not substitute M2 growth or lending rates. `readyForParserDryRun=false`.
- `PUBLIC_INVESTMENT`: blocked until the source confirms whether the metric is realized public investment capital from the state budget or another approved definition. `readyForParserDryRun=false`.

### Phase 149C Vietnam Parser Dry-Run Batch
- `USD_VND`: parser dry-run succeeded against the VCB XML source and extracted the USD `Transfer` quote into an in-memory candidate only. The candidate is `unit=vnd_per_usd`, `rateType=commercial_bank_quote`, `sourceInstitution=Vietcombank`, `notSbvCentralRate=true`, `productionApproved=false`, and `needsReview=true`.
- `EXPORT_GROWTH`: CSV parser was attempted, but the required files `gso-export-value-2024.csv`, `gso-export-value-2025.csv`, and `gso-export-value-2026.csv` were not present at the exact expected paths. The parser failed closed with zero candidates. When files are present, the candidate must be derived from export value in `1000 USD` using `(currentPeriodExportValue - priorPeriodExportValue) / priorPeriodExportValue * 100`; it is not directly published growth.
- `CREDIT_GROWTH`: CSV parser was attempted, but the required manual aggregated CSV was not present at the exact expected path. The parser failed closed with zero candidates. Future rows remain `manual_aggregated_sbv_news_candidate`, not official machine-readable SBV CSV.
- `PUBLIC_INVESTMENT`: CSV parser was attempted, but the required clean manual CSV was not present at the exact expected path. The parser failed closed with zero candidates. Future rows must keep unit-specific interpretation: `billion_vnd` or `percent_of_plan_ytd`.
- No parser dry-run created DB observations or provenance. All candidate/manual data requires manual review before any confirm-write phase.

### Phase 149E Vietnam Candidate Eligibility Audit
- Phase 149E is audit-only. It reruns the Phase 149D parser batch in memory, builds a per-row eligibility report, and does not write candidates, observations, or provenance to the database.
- Candidate rows that pass eligibility can only be considered for a later candidate confirm-write phase with `productionApproved=false` and `needsReview=true`.
- `productionApproved=true` requires a separate stronger review gate and is outside Phase 149E and any immediate candidate confirm-write follow-up.
- `USD_VND` remains a Vietcombank commercial-bank transfer quote, not SBV central rate.
- `EXPORT_GROWTH` remains derived YoY from manual GSO export value CSV, not directly published growth.
- `CREDIT_GROWTH` remains a manual aggregated candidate, not official machine-readable SBV CSV.
- `PUBLIC_INVESTMENT` must keep unit-specific interpretation as `billion_vnd` or `percent_of_plan_ytd`.

### Phase 149F Vietnam Candidate Confirm-Write
- Phase 149F confirm-writes only eligible candidate rows for `USD_VND`, `EXPORT_GROWTH`, and `PUBLIC_INVESTMENT`.
- Confirm-write does not mean production approval: every persisted row remains `productionApproved=false` and `needsReview=true`.
- Blocked rows are not persisted. `CREDIT_GROWTH` remains blocked until the manual source CSV schema is corrected to include `period_type`.
- Persisted provenance must retain the semantic caveats: VCB commercial-bank quote is not SBV central rate; export growth is derived from GSO export value CSV; public investment interpretation depends on unit.

### Phase 149G Vietnam Candidate Read Path
- Phase 149G reads the 149F DB candidate rows into Macro runtime, UI, and Assistant context without importing or writing any new data.
- DB candidate rows may be displayed only with warnings that they are system data requiring review and not production-approved.
- Assistant may explain `USD_VND`, `EXPORT_GROWTH`, and `PUBLIC_INVESTMENT` only with their caveats: VCB commercial-bank quote is not SBV central rate; export growth is derived YoY from GSO export value CSV; public investment meaning is determined by unit.
- `CREDIT_GROWTH` remains absent from the DB read path because all 149E rows were blocked and 149F persisted zero rows.

### Phase 149H Credit Growth Schema Correction and Confirm-Write
- `CREDIT_GROWTH` manual CSV schema now requires `period_type`; if missing, the parser fails closed.
- Eligible `CREDIT_GROWTH` rows may be DB-written as candidate rows only, with `productionApproved=false` and `needsReview=true`.
- `CREDIT_GROWTH` remains manually aggregated from SBV/news/publication sources and must not be called an official machine-readable SBV CSV.
- Macro runtime, UI, and Assistant may show the written candidate rows only with warnings and the manual-aggregation caveat.

### Phase 149I Vietnam Candidate Coverage Smoke
- Final coverage smoke passed for DB candidate read-path visibility of `USD_VND`, `EXPORT_GROWTH`, `PUBLIC_INVESTMENT`, and `CREDIT_GROWTH`.
- Coverage/readability does not equal production approval; all Vietnam candidate rows remain `productionApproved=false` and `needsReview=true`.
- A separate stronger review gate is still required before any `productionApproved=true` workflow.

### Phase 149R GLOBAL_FLOW Definition Decision
- Phase 149R is definition-only. It does not fetch providers, import CSV files, create observations, or populate `GLOBAL_FLOW`.
- Chosen product definition: `emerging_market_equity_fund_flow`, meaning emerging-market equity fund net flow.
- Proposed display label: `Dòng vốn quỹ thị trường mới nổi`.
- Expected future unit: `usd_billion`; preferred period type: `monthly`; weekly is allowed only if the selected source is stable and explicitly documented.
- Value semantics: positive = net inflow, negative = net outflow.
- Future source types: `manual_aggregated_global_flow_candidate` for manual CSV rows or `documented_provider_global_flow_candidate` for a stable provider path.
- Future manual CSV schema: `period,period_type,global_flow_value,unit,definition,scope,flow_type,source_name,source_url,publication_date,extracted_quote,notes`.
- Required caveat: this is an external capital-flow context indicator, not a trading signal. If any future source uses ETF/proxy data, UI and Assistant must clearly label it as a proxy. Do not substitute DXY/VIX or other existing indicators unless the product owner explicitly chooses a risk-on/risk-off proxy.

### Phase 149S Accepted Macro Coverage
- Product owner accepts current macro coverage at 13/14 frontend-locked indicators.
- Do not import sparse `GLOBAL_FLOW` points from public/news search. Sparse, non-continuous EM equity fund-flow points are not reliable enough for a monthly product time series and could reduce product clarity.
- Keep `GLOBAL_FLOW` unavailable until a continuous monthly EM equity fund-flow source is available.
- Do not fetch a provider, import CSV, write DB rows, zero-fill, or substitute a DXY/VIX/risk proxy for `GLOBAL_FLOW`.
- Existing 13 covered indicators remain candidate/manual/provider/proxy data where applicable and keep `productionApproved=false` unless a future production approval gate passes.

### 2. Medium Priority Candidates
These indicators have feasible paths but are either lower priority (global) or more difficult to parse (Excel downloads):
- `EXPORT_GROWTH` (GSO candidate): blocked until a concrete official URL/download is selected.
- `PUBLIC_INVESTMENT` (GSO candidate): blocked until URL and semantic scope are selected.
- `BRENT_OIL_PRICE` (FRED/Global API): `api_ready`
- `DXY` (Global API): `api_ready`
- `FED_FUNDS_RATE` (FRED): `api_ready`

### 3. Low Priority / Manual Review Only
These indicators have highly unstructured data (e.g. text in PDFs) making automated parsing too risky:
- `CREDIT_GROWTH` (SBV Press Releases): `manual_review_only`

### 4. Blocked
- `PMI_MANUFACTURING`: Proprietary/paywall blocked.
- `GLOBAL_FLOW`: Definition selected as `emerging_market_equity_fund_flow`, but data remains unpopulated until a manual CSV or documented provider source is selected and reviewed.

## Guardrails
- **Parser Feasibility is NOT Data**: Just because an indicator is `api_ready` does not mean the system possesses the observation data. The UI and Assistant must explicitly treat it as "Chưa có dữ liệu" until the parser successfully executes and writes to the DB.
- **No Mock Scraping**: We do not hardcode values to pretend a parser works. All parsing attempts must fetch the live source.
