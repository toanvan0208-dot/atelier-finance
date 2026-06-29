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
- `GLOBAL_FLOW`: Source unidentified.

## Guardrails
- **Parser Feasibility is NOT Data**: Just because an indicator is `api_ready` does not mean the system possesses the observation data. The UI and Assistant must explicitly treat it as "Chưa có dữ liệu" until the parser successfully executes and writes to the DB.
- **No Mock Scraping**: We do not hardcode values to pretend a parser works. All parsing attempts must fetch the live source.
