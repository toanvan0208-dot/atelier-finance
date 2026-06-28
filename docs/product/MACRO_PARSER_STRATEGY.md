# Macro Parser Strategy

## Purpose
This document outlines the strategy for building parsers to fetch data for the frontend-locked macro indicators. Not all sources have clean APIs. This strategy dictates which sources can be automated via HTML scraping, which have clean APIs, and which must remain manual.

## Parser Feasibility Classification (Phase 148D)
All manual-review indicators from Phase 148C have been classified:

### 1. High Priority Candidates (Phase 148H Targets)
These indicators have feasible data paths and are domestic/critical. In Phase 148G, a real-source parser dry run was attempted using verified URLs for `USD_VND` and `INTERBANK_RATE_OVERNIGHT`, which failed gracefully due to unstable SBV HTML. In Phase 148H, the source was inspected for stable endpoints:
- `USD_VND` (SBV HTML): Inspected, HTML highly unstable. Identified alternate source: **Vietcombank Exchange Rate XML API** -> `api_ready` -> Eligible for parser dry-run.
- `INTERBANK_RATE_OVERNIGHT` (SBV HTML): Inspected, HTML heavily JS-rendered. No stable alternate API found -> `manual_review_only` -> **Blocked** from automated parser. (Note: Phase 148I evaluated its semantic fit for the frontend "Lãi suất trong nước" card. In Phase 148J, `POLICY_RATE` was selected as the new representative indicator. `INTERBANK_RATE_OVERNIGHT` is no longer in the frontend scope).
- `POLICY_RATE`: Selected as the representative indicator for "Lãi suất trong nước" in Phase 148J. Awaiting source assessment.
- `MARKET_TRADING_VALUE` (Market API): `api_ready`
- `FOREIGN_NET_FLOW` (Market API): `api_ready`

Due to the complex structure of the SBV site, `USD_VND` will transition to using an alternate XML API in the next parser dry-run phase, while `INTERBANK_RATE_OVERNIGHT` will require a manual workflow or paid provider.

### 2. Medium Priority Candidates
These indicators have feasible paths but are either lower priority (global) or more difficult to parse (Excel downloads):
- `EXPORT_GROWTH` (GSO Excel): `csv_excel_ready`
- `PUBLIC_INVESTMENT` (GSO Excel): `csv_excel_ready`
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
